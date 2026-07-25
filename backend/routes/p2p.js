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

// Get P2P market status
router.get('/status', async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: controls } = await supabase
      .from('market_controls')
      .select('is_p2p_open, p2p_open_time, p2p_close_time, arncoin_price_ugx')
      .single();

    res.json({
      is_open: controls.is_p2p_open,
      open_time: controls.p2p_open_time,
      close_time: controls.p2p_close_time,
      current_price: controls.arncoin_price_ugx
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sell order
router.post('/sell', authMiddleware, async (req, res) => {
  try {
    const { arncoin_amount, secret_id } = req.body;
    const supabase = req.supabase;

    // Verify P2P is open
    const { data: controls } = await supabase
      .from('market_controls')
      .select('is_p2p_open, arncoin_price_ugx')
      .single();

    if (!controls.is_p2p_open) {
      return res.status(400).json({ error: 'P2P market is currently closed' });
    }

    // Verify secret ID
    const { data: user } = await supabase
      .from('users')
      .select('m_wallet_balance, secret_id')
      .eq('id', req.userId)
      .single();

    if (user.secret_id !== secret_id) {
      return res.status(400).json({ error: 'Invalid secret ID' });
    }

    if (user.m_wallet_balance < arncoin_amount) {
      return res.status(400).json({ error: 'Insufficient M-Wallet balance' });
    }

    // Calculate UGX value
    const ugx_value = arncoin_amount * controls.arncoin_price_ugx;

    // Create sell order
    const { data: order, error } = await supabase
      .from('p2p_sell_orders')
      .insert([{
        user_id: req.userId,
        secret_id,
        arncoin_amount,
        ugx_value,
        status: 'active',
        remaining_amount: arncoin_amount,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Deduct from M-Wallet
    await supabase
      .from('users')
      .update({ m_wallet_balance: user.m_wallet_balance - arncoin_amount })
      .eq('id', req.userId);

    // Start matching process
    matchP2POrders(supabase);

    res.status(201).json({
      message: 'Sell order created. Waiting for buyers...',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create buy order
router.post('/buy', authMiddleware, async (req, res) => {
  try {
    const { arncoin_amount, secret_id } = req.body;
    const supabase = req.supabase;

    // Verify P2P is open
    const { data: controls } = await supabase
      .from('market_controls')
      .select('is_p2p_open, arncoin_price_ugx')
      .single();

    if (!controls.is_p2p_open) {
      return res.status(400).json({ error: 'P2P market is currently closed' });
    }

    // Verify secret ID
    const { data: user } = await supabase
      .from('users')
      .select('g_wallet_balance, secret_id')
      .eq('id', req.userId)
      .single();

    if (user.secret_id !== secret_id) {
      return res.status(400).json({ error: 'Invalid secret ID' });
    }

    // Calculate UGX needed
    const ugx_needed = arncoin_amount * controls.arncoin_price_ugx;

    if (user.g_wallet_balance < ugx_needed) {
      return res.status(400).json({ error: 'Insufficient G-Wallet balance' });
    }

    // Create buy order
    const { data: order, error } = await supabase
      .from('p2p_buy_orders')
      .insert([{
        user_id: req.userId,
        secret_id,
        arncoin_amount,
        ugx_value: ugx_needed,
        status: 'active',
        remaining_amount: arncoin_amount,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Deduct from G-Wallet
    await supabase
      .from('users')
      .update({ g_wallet_balance: user.g_wallet_balance - ugx_needed })
      .eq('id', req.userId);

    // Start matching process
    matchP2POrders(supabase);

    res.status(201).json({
      message: 'Buy order created. Waiting for sellers...',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// P2P matching algorithm
const matchP2POrders = async (supabase) => {
  try {
    // Get active sell orders
    const { data: sellOrders } = await supabase
      .from('p2p_sell_orders')
      .select('*')
      .eq('status', 'active')
      .gt('remaining_amount', 0);

    // Get active buy orders
    const { data: buyOrders } = await supabase
      .from('p2p_buy_orders')
      .select('*')
      .eq('status', 'active')
      .gt('remaining_amount', 0);

    // Match buyers with sellers
    for (let buyOrder of buyOrders) {
      for (let sellOrder of sellOrders) {
        if (buyOrder.remaining_amount <= 0) break;

        const matchAmount = Math.min(buyOrder.remaining_amount, sellOrder.remaining_amount);
        const ugxAmount = matchAmount * (buyOrder.ugx_value / buyOrder.arncoin_amount);

        // Create match
        await supabase
          .from('p2p_matches')
          .insert([{
            sell_order_id: sellOrder.id,
            buy_order_id: buyOrder.id,
            seller_id: sellOrder.user_id,
            buyer_id: buyOrder.user_id,
            arncoin_amount: matchAmount,
            ugx_amount: ugxAmount,
            status: 'completed',
            completed_at: new Date().toISOString()
          }]);

        // Update buyer's M-Wallet
        const { data: buyer } = await supabase
          .from('users')
          .select('m_wallet_balance')
          .eq('id', buyOrder.user_id)
          .single();

        await supabase
          .from('users')
          .update({ m_wallet_balance: buyer.m_wallet_balance + matchAmount })
          .eq('id', buyOrder.user_id);

        // Update seller's G-Wallet
        const { data: seller } = await supabase
          .from('users')
          .select('g_wallet_balance')
          .eq('id', sellOrder.user_id)
          .single();

        await supabase
          .from('users')
          .update({ g_wallet_balance: seller.g_wallet_balance + ugxAmount })
          .eq('id', sellOrder.user_id);

        // Update remaining amounts
        buyOrder.remaining_amount -= matchAmount;
        sellOrder.remaining_amount -= matchAmount;

        // Update order statuses
        await supabase
          .from('p2p_buy_orders')
          .update({
            remaining_amount: buyOrder.remaining_amount,
            status: buyOrder.remaining_amount <= 0 ? 'completed' : 'partially_matched'
          })
          .eq('id', buyOrder.id);

        await supabase
          .from('p2p_sell_orders')
          .update({
            remaining_amount: sellOrder.remaining_amount,
            status: sellOrder.remaining_amount <= 0 ? 'completed' : 'partially_matched'
          })
          .eq('id', sellOrder.id);
      }
    }
  } catch (error) {
    console.error('P2P matching error:', error);
  }
};

// Get P2P price history (for graph)
router.get('/price-history', async (req, res) => {
  try {
    const supabase = req.supabase;
    const { data: history } = await supabase
      .from('arncoin_price_history')
      .select('price_ugx, created_at')
      .order('created_at', { ascending: true })
      .limit(30);

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
