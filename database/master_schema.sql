-- ================================================================
-- TRAMIN ARNCOIN PLATFORM - MASTER SQL SCHEMA
-- ================================================================
-- Database: Supabase PostgreSQL
-- Created for Tramin Arncoin Platform
-- ================================================================

-- ================================================================
-- 1. USERS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  real_name VARCHAR(255) NOT NULL,
  secret_id VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  g_wallet_balance DECIMAL(15, 2) DEFAULT 0,
  m_wallet_balance DECIMAL(20, 8) DEFAULT 0,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_secret_id ON users(secret_id);
CREATE INDEX idx_users_phone ON users(phone_number);

-- ================================================================
-- 2. WALLETS & TRANSACTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS g_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- deposit, withdraw, trading_profit, trading_loss, p2p_received
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS m_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- mining_earned, p2p_sold, p2p_bought
  amount DECIMAL(20, 8) NOT NULL,
  mining_session_id UUID,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_g_wallet_user ON g_wallet_transactions(user_id);
CREATE INDEX idx_m_wallet_user ON m_wallet_transactions(user_id);

-- ================================================================
-- 3. DEPOSITS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  secret_id VARCHAR(50) NOT NULL,
  payment_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  approved_at TIMESTAMP,
  approved_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deposits_user ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);

-- ================================================================
-- 4. WITHDRAWALS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  secret_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, sent, rejected
  admin_notes TEXT,
  sent_at TIMESTAMP,
  sent_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- ================================================================
-- 5. TRADING SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS market_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_is_open BOOLEAN DEFAULT FALSE,
  current_price DECIMAL(12, 2) NOT NULL DEFAULT 100,
  session_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end_time TIMESTAMP,
  total_rise_predictions INT DEFAULT 0,
  total_fall_predictions INT DEFAULT 0,
  total_rise_amount DECIMAL(15, 2) DEFAULT 0,
  total_fall_amount DECIMAL(15, 2) DEFAULT 0,
  winners_count INT DEFAULT 0,
  losers_count INT DEFAULT 0,
  admin_earnings DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trading_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_session_id UUID NOT NULL REFERENCES market_sessions(id) ON DELETE CASCADE,
  prediction VARCHAR(10) NOT NULL, -- rise, fall
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, won, lost
  profit_earned DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trading_user ON trading_predictions(user_id);
CREATE INDEX idx_trading_session ON trading_predictions(market_session_id);
CREATE INDEX idx_trading_status ON trading_predictions(status);

-- ================================================================
-- 6. MINING SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS hashrate_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  hashrate_per_hour DECIMAL(10, 4) NOT NULL, -- 0.05 ARN/hr, etc
  price_ugx DECIMAL(12, 2) NOT NULL,
  duration_hours INT NOT NULL, -- 24, 48, 72 hours
  total_earnings DECIMAL(20, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mining_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hashrate_package_id UUID NOT NULL REFERENCES hashrate_packages(id) ON DELETE CASCADE,
  rental_cost DECIMAL(12, 2) NOT NULL,
  hashrate_per_hour DECIMAL(10, 4) NOT NULL,
  duration_hours INT NOT NULL,
  total_mined DECIMAL(20, 8) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mining_user ON mining_sessions(user_id);
CREATE INDEX idx_mining_status ON mining_sessions(status);

-- ================================================================
-- 7. P2P TRADING SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS p2p_sell_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_id VARCHAR(50) NOT NULL,
  arncoin_amount DECIMAL(20, 8) NOT NULL,
  ugx_value DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, partially_matched, completed, cancelled, expired
  remaining_amount DECIMAL(20, 8),
  matched_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS p2p_buy_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_id VARCHAR(50) NOT NULL,
  arncoin_amount DECIMAL(20, 8) NOT NULL,
  ugx_value DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, partially_matched, completed, cancelled, expired
  remaining_amount DECIMAL(20, 8),
  matched_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS p2p_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_order_id UUID NOT NULL REFERENCES p2p_sell_orders(id) ON DELETE CASCADE,
  buy_order_id UUID NOT NULL REFERENCES p2p_buy_orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  arncoin_amount DECIMAL(20, 8) NOT NULL,
  ugx_amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_p2p_sell_user ON p2p_sell_orders(user_id);
CREATE INDEX idx_p2p_buy_user ON p2p_buy_orders(user_id);
CREATE INDEX idx_p2p_matches_seller ON p2p_matches(seller_id);
CREATE INDEX idx_p2p_matches_buyer ON p2p_matches(buyer_id);

-- ================================================================
-- 8. ADMIN CONTROLS
-- ================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_market_open BOOLEAN DEFAULT FALSE,
  market_open_time TIME,
  market_close_time TIME,
  is_p2p_open BOOLEAN DEFAULT FALSE,
  p2p_open_time TIME,
  p2p_close_time TIME,
  arncoin_price_ugx DECIMAL(12, 4) NOT NULL DEFAULT 100.00,
  updated_by UUID,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_mobile_number VARCHAR(20) NOT NULL DEFAULT '0707021395',
  admin_real_name VARCHAR(255) NOT NULL DEFAULT 'Richard Njagala',
  trading_profit_share_winner_below_3000 DECIMAL(5, 2) DEFAULT 50.00,
  trading_profit_share_3000_to_5000 DECIMAL(5, 2) DEFAULT 30.00,
  trading_profit_share_above_5100 DECIMAL(5, 2) DEFAULT 20.00,
  admin_share_from_losers DECIMAL(5, 2) DEFAULT 25.00,
  admin_share_from_winners DECIMAL(5, 2) DEFAULT 15.00,
  settlement_cycle_seconds INT DEFAULT 30,
  minimum_trade_amount DECIMAL(10, 2) DEFAULT 1500.00,
  p2p_expiry_hours INT DEFAULT 24,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 9. SUPPORT & COMMUNICATION
-- ================================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  admin_id UUID,
  reply_message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  proof_url VARCHAR(500) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_user ON support_tickets(user_id);
CREATE INDEX idx_support_status ON support_tickets(status);

-- ================================================================
-- 10. TRADING HISTORY & AUDITS
-- ================================================================
CREATE TABLE IF NOT EXISTS trading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_session_id UUID REFERENCES market_sessions(id),
  prediction VARCHAR(10),
  amount DECIMAL(15, 2),
  result VARCHAR(10), -- win, loss
  profit_loss DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trading_history_user ON trading_history(user_id);

-- ================================================================
-- 11. ARNCOIN PRICE HISTORY
-- ================================================================
CREATE TABLE IF NOT EXISTS arncoin_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_ugx DECIMAL(12, 4) NOT NULL,
  set_by_admin UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- INITIAL DATA INSERTION
-- ================================================================

-- Insert default market controls
INSERT INTO market_controls (
  is_market_open,
  market_open_time,
  market_close_time,
  is_p2p_open,
  p2p_open_time,
  p2p_close_time,
  arncoin_price_ugx
) VALUES (
  FALSE,
  '09:00:00'::time,
  '18:00:00'::time,
  FALSE,
  '08:00:00'::time,
  '20:00:00'::time,
  100.00
) ON CONFLICT DO NOTHING;

-- Insert default admin settings
INSERT INTO admin_settings (
  admin_mobile_number,
  admin_real_name,
  trading_profit_share_winner_below_3000,
  trading_profit_share_3000_to_5000,
  trading_profit_share_above_5100,
  admin_share_from_losers,
  admin_share_from_winners,
  settlement_cycle_seconds,
  minimum_trade_amount
) VALUES (
  '0707021395',
  'Richard Njagala',
  50.00,
  30.00,
  20.00,
  25.00,
  15.00,
  30,
  1500.00
) ON CONFLICT DO NOTHING;

-- ================================================================
-- END OF SCHEMA
-- ================================================================
