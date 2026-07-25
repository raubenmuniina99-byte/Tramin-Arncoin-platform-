import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Mining = () => {
  const [packages, setPackages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPackages();
    fetchSessions();
    fetchBalance();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mining/packages`);
      setPackages(response.data.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mining/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
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

  const handleRentPackage = async (packageId) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/mining/rent`,
        { package_id: packageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Hashrate rented successfully! Mining started!');
      fetchBalance();
      fetchSessions();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to rent package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-32">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">⛏️ Mining</h1>

      {/* Balance */}
      <div className="card mb-6 bg-gradient-to-r from-yellow-900 to-orange-900">
        <h2 className="text-xl font-bold mb-2">Available G-Wallet Balance</h2>
        <p className="text-4xl font-bold text-green-400">UGX {balance.toLocaleString()}</p>
      </div>

      {/* Available Packages */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">Available Hashrate Packages</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="card hover:border-blue-500 transition">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="text-lg font-bold mb-2">{pkg.hashrate_per_hour} ARN/hr</h3>
              <div className="space-y-2 mb-4 text-sm">
                <p>Duration: {pkg.duration_hours} hours</p>
                <p>Price: <span className="text-green-400 font-bold">UGX {pkg.price_ugx}</span></p>
              </div>
              <button
                onClick={() => handleRentPackage(pkg.id)}
                disabled={loading || balance < pkg.price_ugx}
                className="w-full btn-primary py-2 disabled:opacity-50"
              >
                {loading ? 'Renting...' : 'Rent Now'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Mining Sessions */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-purple-400">My Mining Sessions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-600">
              <tr>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Hashrate</th>
                <th className="text-left p-3">Duration</th>
                <th className="text-right p-3">Earned</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-slate-700">
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${session.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="p-3">{session.hashrate_per_hour} ARN/hr</td>
                  <td className="p-3">{session.duration_hours}h</td>
                  <td className="text-right p-3 text-green-400 font-bold">{session.total_mined.toFixed(8)} ARN</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Mining;
