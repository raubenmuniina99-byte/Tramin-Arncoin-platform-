const express = require('express');
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current market session
router.get('/market-status', async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: controls } = await supabase
      .from('market_controls')
      .select('*')
      .single();

    res.json({
      is_open: controls.is_market_open,
      open_time: controls.market_open_time,
      close_time: controls.market_close_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place trading prediction
router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const { prediction, amount } = req.body;
    const supabase = req.supabase;

    // Verify market is open
    const { data: controls } = await supabase
      .from('market_controls')
      .select('is_market_open')
      .single();

    if (!controls.is_market_open) {
      return res.status(400).json({ error: 'Market is currently closed' });
    }

    // Verify user has sufficient balance
    const { data: user } = await supabase
      .from('users')
      .select('g_wallet_balance')
      .eq('id', req.userId)
      .single();

    if (user.g_wallet_balance < amount) {
      return res.status(400).json({ error: 'Insufficient G-Wallet balance' });
    }

    // Get current market session
    const { data: session } = await supabase
      .from('market_sessions')
      .select('*')
      .eq('market_is_open', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return res.status(400).json({ error: 'No active market session' });
    }

    // Create prediction
    const { data: pred, error } = await supabase
      .from('trading_predictions')
      .insert([{
        user_id: req.userId,
        market_session_id: session.id,
        prediction,
        amount,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    // Deduct amount from G-Wallet
    await supabase
      .from('users')
      .update({ g_wallet_balance: user.g_wallet_balance - amount })
      .eq('id', req.userId);

    // Record transaction
    await supabase
      .from('g_wallet_transactions')
      .insert([{
        user_id: req.userId,
        transaction_type: 'trading_placed',
        amount,
        status: 'completed',
        description: `${prediction} prediction for UGX${amount}`
      }]);

    res.status(201).json({
      message: 'Prediction placed successfully',
      prediction: pred
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user trading history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: history } = await supabase
      .from('trading_history')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
