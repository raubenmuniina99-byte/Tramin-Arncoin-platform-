import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-20">
      <h1 className="text-3xl font-bold mb-6 text-red-400">👨‍💼 Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-slate-700">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'users', label: '👥 Users' },
          { id: 'deposits', label: '💰 Deposits' },
          { id: 'withdrawals', label: '💸 Withdrawals' },
          { id: 'mining', label: '⛏️ Mining' },
          { id: 'market', label: '📈 Market Controls' },
          { id: 'support', label: '💬 Support' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-slate-400 text-sm mb-2">Total Users</p>
            <p className="text-3xl font-bold text-blue-400">{users.length}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm mb-2">Total G-Wallet Balance</p>
            <p className="text-3xl font-bold text-green-400">
              UGX {users.reduce((sum, u) => sum + u.g_wallet_balance, 0).toLocaleString()}
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm mb-2">Total M-Wallet Balance</p>
            <p className="text-3xl font-bold text-purple-400">
              {users.reduce((sum, u) => sum + u.m_wallet_balance, 0).toFixed(8)} ARN
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm mb-2">Suspended Users</p>
            <p className="text-3xl font-bold text-red-400">{users.filter(u => u.is_suspended).length}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">All Users</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-600">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Secret ID</th>
                    <th className="text-right p-2">G-Wallet</th>
                    <th className="text-right p-2">M-Wallet</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800">
                      <td className="p-2">{user.real_name}</td>
                      <td className="p-2 text-sm">{user.email}</td>
                      <td className="p-2 text-xs font-mono text-yellow-400">{user.secret_id}</td>
                      <td className="text-right p-2 text-green-400">UGX {user.g_wallet_balance.toLocaleString()}</td>
                      <td className="text-right p-2 text-purple-400">{user.m_wallet_balance.toFixed(4)} ARN</td>
                      <td className="text-center p-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          user.is_suspended ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
                        }`}>
                          {user.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Other admin pages would go here */}
      {activeTab !== 'overview' && activeTab !== 'users' && (
        <div className="card">
          <p className="text-slate-400">Admin feature for {activeTab} coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
