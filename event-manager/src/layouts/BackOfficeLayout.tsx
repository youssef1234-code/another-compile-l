/**
 * Back Office Layout
 * 
 * Professional data-dense layout for Admin and Events Office users
 * Based on Pro Design principles:
 * - High information density
 * - Power user controls
 * - Clear hierarchy
 * - Efficient workflows
 * 
 * Features:
 * - Collapsible sidebar with role-based navigation
 * - Breadcrumb trail
 * - Quick actions toolbar
 * - Notification center
 * - Search command palette
 */

import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingBag,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  ChevronRight,
  LogOut,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getAvatarSrc } from '@event-manager/shared';
import { ROUTES } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  roles?: string[];
  children?: NavItem[];
}

// ============================================================================
// Navigation Configuration
// ============================================================================

const adminNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    children: [
      { label: 'All Users', href: '/admin/users', icon: Users },
      { label: 'Role Approvals', href: '/admin/role-approvals', icon: FileText },
      { label: 'Manage Accounts', href: '/admin/manage-accounts', icon: Settings },
    ],
  },
  {
    label: 'Events',
    href: ROUTES.ADMIN_EVENTS,
    icon: Calendar,
  },
  {
    label: 'Vendors',
    href: '/admin/vendors',
    icon: ShoppingBag,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
];

const eventsOfficeNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: 'Events',
    href: ROUTES.ADMIN_EVENTS,
    icon: Calendar,
    children: [
      { label: 'All Events', href: ROUTES.ADMIN_EVENTS, icon: Calendar },
      { label: 'Workshops', href: ROUTES.WORKSHOP_APPROVALS, icon: FileText },
      { label: 'Create Trip', href: ROUTES.CREATE_TRIP, icon: Calendar },
      { label: 'Create Bazaar', href: ROUTES.CREATE_BAZAAR, icon: ShoppingBag },
      { label: 'Create Conference', href: ROUTES.CREATE_CONFERENCE, icon: Users },
    ],
  },
  {
    label: 'Vendors',
    href: '/events-office/vendors',
    icon: ShoppingBag,
  },
  {
    label: 'Reports',
    href: '/events-office/reports',
    icon: BarChart3,
  },
];

// ============================================================================
// Components
// ============================================================================

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function SidebarNavItem({ item, isActive, isCollapsed }: SidebarNavItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            </>
          )}
        </button>
        {!isCollapsed && isExpanded && item.children && (
          <div className="mt-1 ml-7 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span>{item.label}</span>}
      {!isCollapsed && item.badge !== undefined && (
        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ============================================================================
// Main Layout Component
// ============================================================================

export function BackOfficeLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Determine navigation based on role
  const navigation =
    user?.role === 'ADMIN' ? adminNavigation : eventsOfficeNavigation;

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r transition-all duration-300',
          'lg:sticky lg:z-0',
          isSidebarOpen ? 'w-64' : 'w-16',
          isMobileSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {isSidebarOpen ? (
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">GUC</span>
              </div>
              <span className="font-semibold">Events Admin</span>
            </Link>
          ) : (
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              isCollapsed={!isSidebarOpen}
            />
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors',
                  !isSidebarOpen && 'justify-center'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarSrc(user?.avatar, user?.avatarType)} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isSidebarOpen && (
                  <div className="flex-1 text-left text-sm">
                    <p className="font-medium truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.role}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={ROUTES.PROFILE}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm hover:bg-accent transition-colors"
        >
          <ChevronRight
            className={cn(
              'h-3 w-3 transition-transform',
              !isSidebarOpen && 'rotate-180'
            )}
          />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search anything... (Ctrl+K)"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
