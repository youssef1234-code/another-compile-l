/**
 * Sidebar Navigation Component
 * 
 * @module components/layout/Sidebar
 */

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Heart,
  ListTodo,
  Users,
  Settings,
  ChevronLeft,
  Dumbbell,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../lib/constants';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { user } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Events', href: ROUTES.EVENTS, icon: Calendar },
    { name: 'My Events', href: ROUTES.MY_EVENTS, icon: ListTodo },
    { name: 'Favorites', href: ROUTES.FAVORITES, icon: Heart },
    { name: 'Gym Schedule', href: '/gym', icon: Dumbbell },
  ];

  // Add admin navigation if user is admin
  if (user?.role === 'ADMIN' || user?.role === 'EVENT_OFFICE') {
    navigation.push({
      name: 'Manage Users',
      href: ROUTES.ADMIN_USERS,
      icon: Users,
    });
  }

  navigation.push({
    name: 'Settings',
    href: ROUTES.SETTINGS,
    icon: Settings,
  });

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Event Manager
              </span>
            </motion.div>
          )}

          <button
            onClick={toggleSidebarCollapse}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 transition-transform duration-300',
                sidebarCollapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.name}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        {!sidebarCollapsed && user && (
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-medium">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
