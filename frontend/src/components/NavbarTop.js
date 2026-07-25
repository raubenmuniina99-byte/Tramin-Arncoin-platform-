import React from 'react';
import { Link } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import { SiArduino } from 'react-icons/si';

const NavbarTop = () => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="navbar-top flex justify-between items-center px-6 py-4">
      <Link to="/" className="flex items-center gap-2">
        <SiArduino size={32} className="text-blue-600" />
        <span className="text-xl font-bold text-white">Tramin Arncoin</span>
      </Link>

      <div className="flex items-center gap-4">
        <button
          className="p-2 hover:bg-slate-800 rounded-lg transition"
          onClick={() => setShowMenu(!showMenu)}
        >
          <FiMenu size={24} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute top-16 right-6 bg-slate-800 border border-slate-700 rounded-lg p-4 w-48 shadow-lg">
          <Link to="/market" className="block py-2 px-4 hover:bg-slate-700 rounded">
            Market
          </Link>
          <Link to="/g-wallet" className="block py-2 px-4 hover:bg-slate-700 rounded">
            G-Wallet
          </Link>
          <Link to="/m-wallet" className="block py-2 px-4 hover:bg-slate-700 rounded">
            M-Wallet
          </Link>
          <Link to="/mining" className="block py-2 px-4 hover:bg-slate-700 rounded">
            Mining
          </Link>
          <Link to="/p2p" className="block py-2 px-4 hover:bg-slate-700 rounded">
            P2P Trading
          </Link>
          <Link to="/profile" className="block py-2 px-4 hover:bg-slate-700 rounded">
            Profile
          </Link>
          <hr className="my-2 border-slate-600" />
          <a href="#terms" className="block py-2 px-4 hover:bg-slate-700 rounded text-sm">
            Terms & Conditions
          </a>
        </div>
      )}
    </div>
  );
};

export default NavbarTop;
