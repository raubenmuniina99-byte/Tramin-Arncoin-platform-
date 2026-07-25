const express = require('express');
const router = express.Router();

const adminAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin role
    const supabase = req.supabase;
    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!admin || !admin.is_active) {
      return res.status(403).json({ error: 'Not an admin user' });
    }

    req.adminId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all users
router.get('/users', adminAuthMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: users } = await supabase
      .from('users')
      .select('id, email, phone_number, real_name, secret_id, g_wallet_balance, m_wallet_balance, is_suspended, created_at');

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trading session analytics
router.get('/trading-analytics/:sessionId', adminAuthMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { sessionId } = req.params;

    const { data: session } = await supabase
      .from('market_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    const { data: predictions } = await supabase
      .from('trading_predictions')
      .select('*')
      .eq('market_session_id', sessionId);

    res.json({
      session,
      predictions,
      analytics: {
        rise_percentage: (session.total_rise_predictions / (session.total_rise_predictions + session.total_fall_predictions) * 100).toFixed(2),
        fall_percentage: (session.total_fall_predictions / (session.total_rise_predictions + session.total_fall_predictions) * 100).toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve deposit
router.post('/deposits/approve/:depositId', adminAuthMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { depositId } = req.params;

    const { data: deposit } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .single();

    // Update deposit status
    await supabase
      .from('deposits')
      .update({ status: 'approved', approved_by: req.adminId, approved_at: new Date().toISOString() })
      .eq('id', depositId);

    // Add to user's G-Wallet
    const { data: user } = await supabase
      .from('users')
      .select('g_wallet_balance')
      .eq('id', deposit.user_id)
      .single();

    await supabase
      .from('users')
      .update({ g_wallet_balance: user.g_wallet_balance + deposit.amount })
      .eq('id', deposit.user_id);

    res.json({ message: 'Deposit approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve withdrawal
router.post('/withdrawals/approve/:withdrawalId', adminAuthMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { withdrawalId } = req.params;

    await supabase
      .from('withdrawals')
      .update({ status: 'sent', sent_by: req.adminId, sent_at: new Date().toISOString() })
      .eq('id', withdrawalId);

    res.json({ message: 'Withdrawal approved and payment sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update market controls
router.post('/market-controls', adminAuthMiddleware, async (req, res) => {
  try {
    const { is_market_open, market_open_time, market_close_time, is_p2p_open, p2p_open_time, p2p_close_time } = req.body;
    const supabase = req.supabase;

    const { data: updated } = await supabase
      .from('market_controls')
      .update({
        is_market_open,
        market_open_time,
        market_close_time,
        is_p2p_open,
        p2p_open_time,
        p2p_close_time,
        updated_by: req.adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    res.json({ message: 'Market controls updated', updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create hashrate package
router.post('/mining/create-package', adminAuthMiddleware, async (req, res) => {
  try {
    const { hashrate_per_hour, price_ugx, duration_hours } = req.body;
    const supabase = req.supabase;

    const { data: pkg, error } = await supabase
      .from('hashrate_packages')
      .insert([{
        admin_id: req.adminId,
        hashrate_per_hour,
        price_ugx,
        duration_hours,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Hashrate package created', package: pkg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Arncoin price
router.post('/arncoin/price', adminAuthMiddleware, async (req, res) => {
  try {
    const { price_ugx } = req.body;
    const supabase = req.supabase;

    // Update market controls
    await supabase
      .from('market_controls')
      .update({ arncoin_price_ugx: price_ugx, updated_by: req.adminId })
      .eq('id', 1);

    // Record price history
    await supabase
      .from('arncoin_price_history')
      .insert([{ price_ugx, set_by_admin: req.adminId }]);

    res.json({ message: 'Arncoin price updated', new_price: price_ugx });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
