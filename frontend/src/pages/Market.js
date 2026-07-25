import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PriceGraph from '../components/PriceGraph';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Market = () => {
  const [marketStatus, setMarketStatus] = useState(null);
  const [prediction, setPrediction] = useState('rise');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMarketStatus();
    fetchBalance();
  }, []);

  const fetchMarketStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/trading/market-status`);
      setMarketStatus(response.data);
    } catch (error) {
      console.error('Error fetching market status:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallets/g-wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handlePlacePrediction = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/trading/predict`,
        { prediction, amount: parseFloat(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Prediction placed successfully!');
      setAmount('');
      fetchBalance();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-32">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Market Trading</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Market Status */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Market Status</h2>
          {marketStatus ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={marketStatus.is_open ? 'text-green-400' : 'text-red-400'}>
                  {marketStatus.is_open ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Your Balance:</span>
                <span className="text-green-400">UGX {balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Open Time:</span>
                <span>{marketStatus.open_time}</span>
              </div>
              <div className="flex justify-between">
                <span>Close Time:</span>
                <span>{marketStatus.close_time}</span>
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* Place Prediction */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Place Prediction</h2>
          <form onSubmit={handlePlacePrediction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prediction</label>
              <select
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                className="input-field"
              >
                <option value="rise">📈 Price Will Rise</option>
                <option value="fall">📉 Price Will Fall</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount (UGX)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1500"
                className="input-field"
                placeholder="Minimum: 1500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !marketStatus?.is_open}
              className="w-full btn-primary font-semibold py-2 disabled:opacity-50"
            >
              {loading ? 'Placing...' : 'Place Prediction'}
            </button>
          </form>
        </div>
      </div>

      {/* Price Chart */}
      <div className="mt-6">
        <PriceGraph data={[{ time: 'Now', price: 100 }]} title="Live Price Chart" />
      </div>
    </div>
  );
};

export default Market;
