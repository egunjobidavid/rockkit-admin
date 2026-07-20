import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import {
  LayoutDashboard, Building2, Users, DollarSign, HeartPulse,
  Ticket, LogOut, Shield,
} from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tenants', icon: Building2, label: 'Tenants' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
  { to: '/health', icon: HeartPulse, label: 'Health' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800 flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary-400" />
          <div>
            <h1 className="text-lg font-bold leading-tight">CopiaOS</h1>
            <p className="text-xs text-gray-400">Platform Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="px-3 mb-3">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm text-gray-300 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
