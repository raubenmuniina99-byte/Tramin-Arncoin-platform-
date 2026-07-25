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

// Create support ticket
router.post('/ticket', authMiddleware, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const supabase = req.supabase;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert([{
        user_id: req.userId,
        subject,
        message,
        status: 'open'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Support ticket created', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user support tickets
router.get('/tickets', authMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*, support_replies(reply_message, created_at)')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get announcements
router.get('/announcements', async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment proofs
router.get('/payment-proofs', async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: proofs } = await supabase
      .from('payment_proofs')
      .select('*')
      .order('created_at', { ascending: false });

    res.json({ proofs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
