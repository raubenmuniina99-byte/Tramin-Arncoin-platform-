import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
    fetchPendingTransactions();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPendingTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/transactions/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingTransactions(response.data);
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
    }
  };

  return (
    <div className="p-6 pb-32">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">👤 Profile</h1>

      {user ? (
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-blue-300">{user.real_name}</h2>
            <div className="space-y-3 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Email</p>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Phone</p>
                <p className="text-lg font-semibold">{user.phone_number}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Secret ID</p>
                <p className="text-lg font-mono font-bold text-yellow-400">{user.secret_id}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Joined</p>
                <p className="text-lg font-semibold">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Wallet Balances */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card bg-gradient-to-br from-blue-900 to-blue-800">
              <p className="text-slate-400 text-sm mb-2">G-Wallet Balance</p>
              <p className="text-3xl font-bold text-green-400">UGX {user.g_wallet_balance.toLocaleString()}</p>
            </div>
            <div className="card bg-gradient-to-br from-purple-900 to-purple-800">
              <p className="text-slate-400 text-sm mb-2">M-Wallet Balance</p>
              <p className="text-3xl font-bold text-purple-300">{user.m_wallet_balance.toFixed(8)} ARN</p>
            </div>
          </div>

          {/* Pending Transactions */}
          {(pendingTransactions.deposits?.length > 0 || pendingTransactions.withdrawals?.length > 0) && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-yellow-400">⏳ Pending Approvals</h3>
              {pendingTransactions.deposits?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Deposit Requests</h4>
                  {pendingTransactions.deposits.map((dep) => (
                    <div key={dep.id} className="bg-slate-700 p-3 rounded mb-2">
                      <p>UGX {dep.amount} - Pending Approval</p>
                    </div>
                  ))}
                </div>
              )}
              {pendingTransactions.withdrawals?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Withdrawal Requests</h4>
                  {pendingTransactions.withdrawals.map((wd) => (
                    <div key={wd.id} className="bg-slate-700 p-3 rounded mb-2">
                      <p>UGX {wd.amount} - Pending Approval</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default Profile;
