# Database Setup Instructions

## Running the Master Schema on Supabase

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project: https://eftcnzosiosaamzulypn.supabase.co
2. Navigate to SQL Editor
3. Create a new query

### Step 2: Execute the Master Schema
1. Open `master_schema.sql`
2. Copy the entire SQL content
3. Paste it into the Supabase SQL Editor
4. Click "Run" to execute

### Step 3: Verify Tables Created
After successful execution, verify these 19 tables exist:
- users
- g_wallet_transactions
- m_wallet_transactions
- deposits
- withdrawals
- market_sessions
- trading_predictions
- hashrate_packages
- mining_sessions
- p2p_sell_orders
- p2p_buy_orders
- p2p_matches
- admin_users
- market_controls
- admin_settings
- support_tickets
- support_replies
- payment_proofs
- announcements
- trading_history
- arncoin_price_history

## Database Structure Overview

### Core Tables
- **users**: User accounts with wallet balances and secret IDs
- **g_wallet_transactions**: Fiat currency transactions
- **m_wallet_transactions**: Arncoin mining transactions

### Trading System
- **market_sessions**: Trading round information
- **trading_predictions**: User predictions (rise/fall)
- **trading_history**: Historical trade records

### Mining System
- **hashrate_packages**: Available hashrate for rent
- **mining_sessions**: User mining rentals

### P2P System
- **p2p_sell_orders**: Arncoin sell listings
- **p2p_buy_orders**: Arncoin buy requests
- **p2p_matches**: Completed trades

### Admin & Control
- **admin_users**: Admin accounts
- **market_controls**: Market open/close times and P2P settings
- **admin_settings**: Platform configuration

### Support
- **support_tickets**: User complaints/support requests
- **support_replies**: Admin responses
- **payment_proofs**: Payment verification documents
- **announcements**: Admin announcements

## Connection String
URL: https://eftcnzosiosaamzulypn.supabase.co
