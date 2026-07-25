import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PriceGraph from '../components/PriceGraph';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const P2P = () => {
  const [p2pStatus, setP2pStatus] = useState(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [secretId, setSecretId] = useState('');
  const [loading, setLoading] = useState(false);
  const [arnBalance, setArnBalance] = useState(0);
  const [ugxBalance, setUgxBalance] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchP2PStatus();
    fetchBalances();
  }, []);

  const fetchP2PStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/p2p/status`);
      setP2pStatus(response.data);
    } catch (error) {
      console.error('Error fetching P2P status:', error);
    }
  };

  const fetchBalances = async () => {
    try {
      const [mRes, gRes] = await Promise.all([
        axios.get(`${API_URL}/api/wallets/m-wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/wallets/g-wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setArnBalance(mRes.data.balance);
      setUgxBalance(gRes.data.balance);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/p2p/sell`,
        {
          arncoin_amount: parseFloat(sellAmount),
          secret_id: secretId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Sell order created! Waiting for buyers...');
      setSellAmount('');
      setSecretId('');
      fetchBalances();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create sell order');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/p2p/buy`,
        {
          arncoin_amount: parseFloat(buyAmount),
          secret_id: secretId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Buy order created! Waiting for sellers...');
      setBuyAmount('');
      setSecretId('');
      fetchBalances();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create buy order');
    } finally {
      setLoading(false);
    }
  };

  if (!p2pStatus) return <div className="p-6 text-center">Loading P2P market...</div>;

  return (
    <div className="p-6 pb-32">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">P2P Trading - Buy & Sell Arncoin</h1>

      {/* Market Status */}
      <div className={`card mb-6 ${p2pStatus.is_open ? 'bg-green-900' : 'bg-red-900'}`}>
        <h2 className="text-xl font-bold mb-2">Market Status: {p2pStatus.is_open ? '🟢 OPEN' : '🔴 CLOSED'}</h2>
        <p className="text-slate-300">
          Open: {p2pStatus.open_time} | Close: {p2pStatus.close_time}
        </p>
        <p className="text-lg font-bold mt-2">Current Price: UGX {p2pStatus.current_price}/ARN</p>
      </div>

      {/* Current Balances */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400 text-sm mb-2">Your Arncoin (M-Wallet)</p>
          <p className="text-3xl font-bold text-purple-300">{arnBalance.toFixed(8)} ARN</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-2">Your UGX (G-Wallet)</p>
          <p className="text-3xl font-bold text-green-400">UGX {ugxBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Sell & Buy Forms */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Sell Form */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4 text-orange-400">📤 Sell Arncoin</h3>
          <form onSubmit={handleSell} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (ARN)</label>
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                step="0.00000001"
                max={arnBalance}
                className="input-field"
                required
              />
              {sellAmount && (
                <p className="text-sm text-slate-400 mt-1">
                  ≈ UGX {(parseFloat(sellAmount) * p2pStatus.current_price).toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secret ID</label>
              <input
                type="password"
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <button type="submit" disabled={loading || !p2pStatus.is_open} className="w-full btn-primary py-2">
              {loading ? 'Creating...' : 'Create Sell Order'}
            </button>
          </form>
        </div>

        {/* Buy Form */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">📥 Buy Arncoin</h3>
          <form onSubmit={handleBuy} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (ARN)</label>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                step="0.00000001"
                className="input-field"
                required
              />
              {buyAmount && (
                <p className="text-sm text-slate-400 mt-1">
                  Will cost: UGX {(parseFloat(buyAmount) * p2pStatus.current_price).toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secret ID</label>
              <input
                type="password"
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <button type="submit" disabled={loading || !p2pStatus.is_open} className="w-full btn-secondary py-2">
              {loading ? 'Creating...' : 'Create Buy Order'}
            </button>
          </form>
        </div>
      </div>

      {/* Price History Chart */}
      <PriceGraph
        data={[
          { date: 'Mon', price: 100 },
          { date: 'Tue', price: 105 },
          { date: 'Wed', price: 102 },
        ]}
        title="Arncoin Price History (Days)"
      />
    </div>
  );
};

export default P2P;
