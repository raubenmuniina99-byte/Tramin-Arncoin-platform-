import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavbarBottom from './components/NavbarBottom';
import NavbarTop from './components/NavbarTop';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Market from './pages/Market';
import GWallet from './pages/GWallet';
import MWallet from './pages/MWallet';
import Mining from './pages/Mining';
import Profile from './pages/Profile';
import P2P from './pages/P2P';
import Support from './pages/Support';
import AdminDashboard from './pages/admin/AdminDashboard';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  return (
    <Router>
      <div className="bg-slate-900 min-h-screen text-white">
        {isLoggedIn && <NavbarTop />}
        
        <Routes>
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* User Routes */}
          <Route path="/market" element={<Market />} />
          <Route path="/g-wallet" element={<GWallet />} />
          <Route path="/m-wallet" element={<MWallet />} />
          <Route path="/mining" element={<Mining />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/p2p" element={<P2P />} />
          <Route path="/support" element={<Support />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Login setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Login setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />} />
        </Routes>
        
        {isLoggedIn && <NavbarBottom />}
      </div>
    </Router>
  );
}

export default App;
