import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTickets();
    fetchAnnouncements();
    fetchPaymentProofs();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/support/announcements`);
      setAnnouncements(response.data.announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchPaymentProofs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/support/payment-proofs`);
      setPaymentProofs(response.data.proofs);
    } catch (error) {
      console.error('Error fetching payment proofs:', error);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/support/ticket`,
        { subject, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Support ticket submitted!');
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-32">
      <h1 className="text-3xl font-bold mb-6 text-green-400">💬 Support Center</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submit Ticket */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Submit a Complaint</h2>
            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field"
                  placeholder="Describe your issue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field resize-none"
                  rows="4"
                  placeholder="Detailed description..."
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2">
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>

          {/* My Tickets */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-purple-400">My Tickets</h2>
            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-slate-700 p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{ticket.subject}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${ticket.status === 'resolved' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{ticket.message}</p>
                    {ticket.support_replies?.length > 0 && (
                      <div className="mt-2 bg-slate-800 p-2 rounded">
                        <p className="text-sm font-semibold mb-1">Admin Reply:</p>
                        {ticket.support_replies.map((reply) => (
                          <p key={reply.id} className="text-sm text-slate-300">{reply.reply_message}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No tickets yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="card">
            <h2 className="text-lg font-bold mb-3 text-yellow-400">📢 Announcements</h2>
            {announcements.length > 0 ? (
              <div className="space-y-2">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-slate-700 p-2 rounded text-sm">
                    <p className="font-semibold text-blue-300">{ann.title}</p>
                    <p className="text-slate-400 text-xs mt-1">{ann.content.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No announcements</p>
            )}
          </div>

          {/* Payment Proofs */}
          <div className="card">
            <h2 className="text-lg font-bold mb-3 text-cyan-400">💳 Payment Proofs</h2>
            {paymentProofs.length > 0 ? (
              <div className="space-y-2">
                {paymentProofs.map((proof) => (
                  <a key={proof.id} href={proof.proof_url} target="_blank" rel="noopener noreferrer" className="block bg-slate-700 p-2 rounded text-sm hover:bg-slate-600 transition">
                    <p className="text-blue-400 hover:underline">{proof.description}</p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No payment proofs available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
