/**
 * Front Office Layout
 * 
 * Clean, browsing-focused layout for Students, Staff, TAs, and Professors
 * Based on Pro Design principles:
 * - Low/Medium density (breathing room)
 * - Discovery-oriented
 * - Card-based content
 * - Simple navigation
 * 
 * Features:
 * - Top navigation bar
 * - Hero section for featured content
 * - Card-based layout
 * - Quick filters
 * - Mobile-friendly
 */

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Trophy,
  Dumbbell,
  CreditCard,
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
// Navigation Configuration
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  {
    label: 'Home',
    href: ROUTES.DASHBOARD,
    icon: Home,
  },
  {
    label: 'Events',
    href: ROUTES.EVENTS,
    icon: Calendar,
  },
  {
    label: 'My Events',
    href: ROUTES.MY_REGISTRATIONS,
    icon: Calendar,
  },
  {
    label: 'Favorites',
    href: ROUTES.FAVORITES,
    icon: Heart,
  },
  {
    label: 'Gym',
    href: '/gym',
    icon: Dumbbell,
  },
  {
    label: 'Courts',
    href: '/courts',
    icon: Trophy,
  },
];

// ============================================================================
// Main Layout Component
// ============================================================================

export function FrontOfficeLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">GUC</span>
              </div>
              <span className="hidden sm:block font-semibold text-lg">
                GUC Events
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* Wallet Balance (if applicable) */}
              {user?.role === 'STUDENT' && (
                <Link to="/wallet">
                  <Button variant="outline" size="sm" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Wallet</span>
                  </Button>
                </Link>
              )}

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getAvatarSrc(user?.avatar, user?.avatarType)} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.firstName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.PROFILE}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.MY_REGISTRATIONS}>
                      <Calendar className="mr-2 h-4 w-4" />
                      My Events
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.FAVORITES}>
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="font-semibold mb-3">GUC Events</h3>
              <p className="text-sm text-muted-foreground">
                Discover and register for workshops, trips, bazaars, and more at
                the German University in Cairo.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to={ROUTES.EVENTS} className="text-muted-foreground hover:text-foreground">
                    Browse Events
                  </Link>
                </li>
                <li>
                  <Link to="/gym" className="text-muted-foreground hover:text-foreground">
                    Gym Schedule
                  </Link>
                </li>
                <li>
                  <Link to="/courts" className="text-muted-foreground hover:text-foreground">
                    Court Reservations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-3">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Events Office</li>
                <li>events@guc.edu.eg</li>
                <li>+20 123 456 7890</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} German University in Cairo. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
