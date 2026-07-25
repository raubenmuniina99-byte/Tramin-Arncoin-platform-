import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiLogOut, FiHome } from 'react-icons/fi';
import { MdAttachMoney, MdAccountBalanceWallet, MdShowChart } from 'react-icons/md';
import { TbMining } from 'react-icons/tb';
import { BiSolidPieChartAlt } from 'react-icons/bi';

const NavbarBottom = () => {
  const location = useLocation();
  const [showMenu, setShowMenu] = React.useState(false);

  const menuItems = [
    { label: 'Market', path: '/market', icon: <MdAttachMoney size={24} /> },
    { label: 'Wallets', path: '/g-wallet', icon: <MdAccountBalanceWallet size={24} /> },
    { label: 'Mining', path: '/mining', icon: <TbMining size={24} /> },
    { label: 'Profile', path: '/profile', icon: <BiSolidPieChartAlt size={24} /> },
    { label: 'Support', path: '/support', icon: <FiHome size={24} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="navbar-bottom flex justify-between items-center px-4 py-3 h-20">
        <div className="flex gap-2 flex-1 justify-around">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${
                location.pathname === item.path
                  ? 'text-blue-500 bg-slate-800'
                  : 'text-slate-400 hover:text-blue-500'
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 p-2 text-red-500 hover:bg-slate-800 rounded-lg transition"
          title="Logout"
        >
          <FiLogOut size={24} />
        </button>
      </div>
    </>
  );
};

export default NavbarBottom;
