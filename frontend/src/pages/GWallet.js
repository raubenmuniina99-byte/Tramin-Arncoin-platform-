import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const GWallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentTime, setPaymentTime] = useState('');
  const [secretId, setSecretId] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

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

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallets/transactions/g`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/wallets/deposit`,
        {
          amount: parseFloat(depositAmount),
          payment_time: paymentTime,
          secret_id: secretId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Deposit request submitted! Awaiting admin approval.');
      setDepositAmount('');
      setPaymentTime('');
      setSecretId('');
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/wallets/withdraw`,
        {
          amount: parseFloat(withdrawAmount),
          secret_id: secretId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Withdrawal request submitted! Awaiting admin approval.');
      setWithdrawAmount('');
      setSecretId('');
      fetchBalance();
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-32">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">G-Wallet (Fiat)</h1>

      {/* Balance Card */}
      <div className="card mb-6 bg-gradient-to-r from-blue-900 to-purple-900">
        <h2 className="text-xl font-bold mb-2 text-blue-300">Available Balance</h2>
        <p className="text-4xl font-bold text-green-400">UGX {balance.toLocaleString()}</p>
      </div>

      {/* Admin Info */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold mb-3">💳 Mobile Money Account</h3>
        <p className="mb-1"><strong>Admin Mobile:</strong> 0707021395</p>
        <p><strong>Name:</strong> Richard Njagala</p>
        <p className="text-sm text-slate-400 mt-2">Send money to the above account and enter details below.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Deposit Form */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4 text-blue-400">📥 Request Deposit</h3>
          <form onSubmit={handleDeposit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (UGX)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Time</label>
              <input
                type="datetime-local"
                value={paymentTime}
                onChange={(e) => setPaymentTime(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secret ID</label>
              <input
                type="text"
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                className="input-field"
                placeholder={user.secret_id}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-2">
              {loading ? 'Processing...' : 'Submit Deposit'}
            </button>
          </form>
        </div>

        {/* Withdraw Form */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4 text-purple-400">📤 Request Withdrawal</h3>
          <form onSubmit={handleWithdraw} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (UGX)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={balance}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secret ID</label>
              <input
                type="text"
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                className="input-field"
                placeholder={user.secret_id}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-secondary py-2">
              {loading ? 'Processing...' : 'Submit Withdrawal'}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card mt-6">
        <h3 className="text-lg font-bold mb-4">📊 Transaction History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-600">
              <tr>
                <th className="text-left p-2">Type</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-700 hover:bg-slate-800">
                  <td className="p-2">{tx.transaction_type}</td>
                  <td className="text-right p-2 text-green-400">UGX {tx.amount}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        tx.status === 'completed'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-yellow-900 text-yellow-300'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-2 text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GWallet;
