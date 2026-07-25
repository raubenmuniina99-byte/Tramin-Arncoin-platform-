# Frontend Setup

## Installation

```bash
cd frontend
npm install
```

## Environment Variables

Create `.env` file:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=https://eftcnzosiosaamzulypn.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_IkflpE9rqHBrGdAJv_J2Dg_gg7swVQE
```

## Development

```bash
npm start
```

Visit `http://localhost:3000`

## Build

```bash
npm run build
```

## Deployment to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy

## Pages

### User Pages
- **Login/Signup**: Authentication
- **Market**: Trading predictions
- **G-Wallet**: Fiat deposits/withdrawals
- **M-Wallet**: Mining earnings
- **Mining**: Hashrate rentals
- **P2P**: Buy/Sell Arncoin
- **Profile**: User information
- **Support**: Tickets, announcements, payment proofs

### Admin Pages
- **Dashboard**: Overview
- **Users**: Manage all users
- **Deposits/Withdrawals**: Approve requests
- **Market Controls**: Set open/close times
- **Mining**: Create hashrate packages
- **Support**: Handle complaints
