import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import {
  LayoutDashboard, Building2, Users, DollarSign, HeartPulse,
  Ticket, LogOut, Shield, Tag,
} from 'lucide-react';

const ROLE_HIERARCHY: Record<string, number> = { superadmin: 3, admin: 2, viewer: 1 };

function hasMinRole(userRole: string | null | undefined, required: string): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[required] ?? 0);
}

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', minRole: 'viewer' },
  { to: '/tenants', icon: Building2, label: 'Tenants', minRole: 'admin' },
  { to: '/users', icon: Users, label: 'Users', minRole: 'admin' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue', minRole: 'admin' },
  { to: '/pricing', icon: Tag, label: 'Pricing', minRole: 'superadmin' },
  { to: '/health', icon: HeartPulse, label: 'Health', minRole: 'admin' },
  { to: '/tickets', icon: Ticket, label: 'Tickets', minRole: 'admin' },
];

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  superadmin: { label: 'Superadmin', color: 'bg-red-500/20 text-red-300' },
  admin: { label: 'Admin', color: 'bg-blue-500/20 text-blue-300' },
  viewer: { label: 'Viewer', color: 'bg-gray-500/20 text-gray-400' },
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const adminRole = user?.adminRole || (user?.isSuperadmin ? 'superadmin' : null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleLinks = links.filter((link) => hasMinRole(adminRole, link.minRole));
  const roleBadge = ROLE_BADGES[adminRole || ''] || null;

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
          {visibleLinks.map((link) => (
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
            {roleBadge && (
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            )}
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
