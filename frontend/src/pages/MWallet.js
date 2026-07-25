import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MWallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallets/m-wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallets/transactions/m`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  return (
    <div className="p-6 pb-32">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">M-Wallet (Mining Earnings)</h1>

      {/* Balance Card */}
      <div className="card mb-6 bg-gradient-to-r from-purple-900 to-pink-900">
        <h2 className="text-xl font-bold mb-2 text-purple-300">Arncoin Balance</h2>
        <p className="text-4xl font-bold text-purple-300">{balance.toFixed(8)} ARN</p>
      </div>

      {/* Earnings Info */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm text-slate-400 mb-2">Total Earned</h3>
          <p className="text-2xl font-bold text-green-400">{balance.toFixed(8)} ARN</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-slate-400 mb-2">Active Mining Sessions</h3>
          <p className="text-2xl font-bold text-blue-400">-</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-slate-400 mb-2">Completed Sessions</h3>
          <p className="text-2xl font-bold text-slate-400">-</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">📊 Mining Earnings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-600">
              <tr>
                <th className="text-left p-2">Type</th>
                <th className="text-right p-2">Amount (ARN)</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-700 hover:bg-slate-800">
                    <td className="p-2">{tx.transaction_type}</td>
                    <td className="text-right p-2 text-green-400">{parseFloat(tx.amount).toFixed(8)}</td>
                    <td className="p-2 text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-slate-400">
                    No mining earnings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MWallet;
