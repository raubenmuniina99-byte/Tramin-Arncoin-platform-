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

// Get G-Wallet balance
router.get('/g-wallet', authMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: user } = await supabase
      .from('users')
      .select('g_wallet_balance')
      .eq('id', req.userId)
      .single();

    res.json({ balance: user.g_wallet_balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get M-Wallet balance
router.get('/m-wallet', authMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: user } = await supabase
      .from('users')
      .select('m_wallet_balance')
      .eq('id', req.userId)
      .single();

    res.json({ balance: user.m_wallet_balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request deposit
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount, payment_time, secret_id } = req.body;
    const supabase = req.supabase;

    // Verify secret ID
    const { data: user } = await supabase
      .from('users')
      .select('secret_id')
      .eq('id', req.userId)
      .single();

    if (user.secret_id !== secret_id) {
      return res.status(400).json({ error: 'Invalid secret ID' });
    }

    // Create deposit request
    const { data: deposit, error } = await supabase
      .from('deposits')
      .insert([{
        user_id: req.userId,
        amount,
        secret_id,
        payment_time: new Date(payment_time),
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Deposit request submitted. Awaiting admin approval.',
      deposit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request withdrawal
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, secret_id } = req.body;
    const supabase = req.supabase;

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('g_wallet_balance, secret_id')
      .eq('id', req.userId)
      .single();

    // Verify secret ID
    if (user.secret_id !== secret_id) {
      return res.status(400).json({ error: 'Invalid secret ID' });
    }

    // Check balance
    if (user.g_wallet_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal request
    const { data: withdrawal, error } = await supabase
      .from('withdrawals')
      .insert([{
        user_id: req.userId,
        amount,
        secret_id,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Withdrawal request submitted. Awaiting admin approval.',
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet transactions history
router.get('/transactions/:walletType', authMiddleware, async (req, res) => {
  try {
    const { walletType } = req.params;
    const supabase = req.supabase;
    const tableName = walletType === 'g' ? 'g_wallet_transactions' : 'm_wallet_transactions';

    const { data: transactions } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
