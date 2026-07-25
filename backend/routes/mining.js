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

// Get available hashrate packages
router.get('/packages', async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: packages } = await supabase
      .from('hashrate_packages')
      .select('*')
      .eq('is_active', true)
      .order('price_ugx', { ascending: true });

    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rent hashrate package
router.post('/rent', authMiddleware, async (req, res) => {
  try {
    const { package_id } = req.body;
    const supabase = req.supabase;

    // Get package details
    const { data: pkg } = await supabase
      .from('hashrate_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Get user wallet
    const { data: user } = await supabase
      .from('users')
      .select('g_wallet_balance')
      .eq('id', req.userId)
      .single();

    if (user.g_wallet_balance < pkg.price_ugx) {
      return res.status(400).json({ error: 'Insufficient G-Wallet balance' });
    }

    // Create mining session
    const { data: session, error } = await supabase
      .from('mining_sessions')
      .insert([{
        user_id: req.userId,
        hashrate_package_id: package_id,
        rental_cost: pkg.price_ugx,
        hashrate_per_hour: pkg.hashrate_per_hour,
        duration_hours: pkg.duration_hours,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    // Deduct from G-Wallet
    await supabase
      .from('users')
      .update({ g_wallet_balance: user.g_wallet_balance - pkg.price_ugx })
      .eq('id', req.userId);

    // Start mining simulation
    startMiningSimulation(supabase, req.userId, session.id, pkg.hashrate_per_hour, pkg.duration_hours);

    res.status(201).json({
      message: 'Hashrate rented successfully. Mining started!',
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mining simulation function
const startMiningSimulation = async (supabase, userId, sessionId, hashRatePerHour, durationHours) => {
  const miningInterval = setInterval(async () => {
    try {
      const earnedAmount = hashRatePerHour / 60; // Per minute

      // Update session total
      await supabase
        .from('mining_sessions')
        .update({ total_mined: supabase.raw('total_mined + ?', [earnedAmount]) })
        .eq('id', sessionId);

      // Update user M-Wallet
      const { data: user } = await supabase
        .from('users')
        .select('m_wallet_balance')
        .eq('id', userId)
        .single();

      await supabase
        .from('users')
        .update({ m_wallet_balance: user.m_wallet_balance + earnedAmount })
        .eq('id', userId);
    } catch (error) {
      console.error('Mining update error:', error);
    }
  }, 60000); // Update every minute

  // Stop mining after duration
  setTimeout(async () => {
    clearInterval(miningInterval);
    await supabase
      .from('mining_sessions')
      .update({ status: 'completed', end_time: new Date().toISOString() })
      .eq('id', sessionId);
  }, durationHours * 60 * 60 * 1000);
};

// Get user mining sessions
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: sessions } = await supabase
      .from('mining_sessions')
      .select(`
        *,
        hashrate_packages (hashrate_per_hour, price_ugx, duration_hours)
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
