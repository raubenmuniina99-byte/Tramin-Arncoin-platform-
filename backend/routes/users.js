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

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error) throw error;

    res.json({
      id: user.id,
      email: user.email,
      secret_id: user.secret_id,
      phone_number: user.phone_number,
      real_name: user.real_name,
      g_wallet_balance: user.g_wallet_balance,
      m_wallet_balance: user.m_wallet_balance,
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending deposits and withdrawals
router.get('/transactions/pending', authMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;

    const { data: deposits } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'pending');

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'pending');

    res.json({ deposits, withdrawals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suspend user (Admin only)
router.post('/suspend/:userId', authMiddleware, async (req, res) => {
  try {
    const { suspension_reason } = req.body;
    const supabase = req.supabase;

    const { error } = await supabase
      .from('users')
      .update({ is_suspended: true, suspension_reason })
      .eq('id', req.params.userId);

    if (error) throw error;
    res.json({ message: 'User suspended successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
