/**
 * Command Menu (K-Bar)
 *
 * Quick navigation and search using ⌘K / Ctrl+K
 * Built with shadcn/ui Command component
 */

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTheme } from "@/hooks/useTheme";
import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";
import {
  Briefcase,
  Building2,
  Calendar,
  Car,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  Moon,
  Presentation,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  Ticket,
  Trophy,
  User,
  Users,
  Vote,
  Wallet
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  roles?: string[];
  description?: string;
}

interface CommandGroupType {
  heading: string;
  actions: CommandAction[];
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { setTheme } = useTheme();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runAction = useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  const userRole = user?.role || "";

  // Check if user has access to a route based on roles
  const hasAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.includes(userRole);
  };

  // Navigation commands - organized by feature area
  const navigationGroups: CommandGroupType[] = [
    {
      heading: "Quick Access",
      actions: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="size-4" />,
          action: () => navigate(ROUTES.DASHBOARD),
          keywords: ["home", "overview", "main", "start"],
          shortcut: "G D",
        },
        {
          id: "events",
          label: "Browse Events",
          icon: <Calendar className="size-4" />,
          action: () => navigate(ROUTES.EVENTS),
          keywords: ["workshops", "trips", "bazaars", "conferences", "all", "browse"],
          shortcut: "G E",
        },
        // Notifications are now accessed via the bell icon in header
        {
          id: "profile",
          label: "My Profile",
          icon: <User className="size-4" />,
          action: () => navigate(ROUTES.PROFILE),
          keywords: ["account", "settings", "me", "personal"],
          shortcut: "G P",
        },
        {
          id: "wallet",
          label: "My Wallet",
          icon: <Wallet className="size-4" />,
          action: () => navigate(ROUTES.WALLET),
          keywords: ["balance", "payments", "money", "funds", "credit"],
          roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"],
          shortcut: "G W",
        },
      ],
    },
    {
      heading: "Events",
      actions: [
        {
          id: "my-registrations",
          label: "My Registrations",
          icon: <Ticket className="size-4" />,
          action: () => navigate(`${ROUTES.EVENTS}?tab=registrations`),
          keywords: ["tickets", "bookings", "signed up", "registered", "my events"],
          roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"],
        },
        {
          id: "favorites",
          label: "Favorite Events",
          icon: <Heart className="size-4" />,
          action: () => navigate(`${ROUTES.EVENTS}?tab=favorites`),
          keywords: ["liked", "saved", "bookmarks", "wishlist"],
          roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"],
        },
        {
          id: "loyalty-program",
          label: "Loyalty Program",
          icon: <Trophy className="size-4" />,
          action: () => navigate(ROUTES.LOYALTY_PROGRAM),
          keywords: ["points", "rewards", "vendors", "discounts", "partners"],
          roles: ["STUDENT", "STAFF", "TA", "PROFESSOR", "ADMIN", "EVENT_OFFICE"],
        },
        {
          id: "vendor-polls",
          label: "Vendor Polls",
          icon: <Vote className="size-4" />,
          action: () => navigate(ROUTES.VENDOR_POLLS),
          keywords: ["voting", "surveys", "conflicts", "booth"],
          roles: ["STUDENT", "STAFF", "TA", "PROFESSOR", "ADMIN", "EVENT_OFFICE"],
        },
      ],
    },
    {
      heading: "Gym & Sports",
      actions: [
        {
          id: "gym-schedule",
          label: "Gym Schedule",
          icon: <Dumbbell className="size-4" />,
          action: () => navigate(ROUTES.GYM_SCHEDULE),
          keywords: ["fitness", "workout", "exercise", "calendar", "gym"],
          shortcut: "G G",
        },
        // My Sessions page was removed (Coming Soon placeholder)
        {
          id: "court-bookings",
          label: "Court Bookings",
          icon: <Trophy className="size-4" />,
          action: () => navigate(ROUTES.COURT_BOOKINGS),
          keywords: ["tennis", "basketball", "sports", "reserve", "football", "padel", "squash"],
          roles: ["STUDENT"],
        },
        {
          id: "manage-courts",
          label: "Manage Courts",
          icon: <LayoutGrid className="size-4" />,
          action: () => navigate(ROUTES.COURT_MANAGEMENT),
          keywords: ["sports", "admin", "configure", "courts"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        // My Sessions and Manage Sessions pages were removed (Coming Soon placeholders)
      ],
    },
    {
      heading: "Create Events",
      actions: [
        {
          id: "create-workshop",
          label: "Create Workshop",
          icon: <GraduationCap className="size-4" />,
          action: () => navigate(`${ROUTES.ADMIN_EVENTS}?createType=WORKSHOP`),
          keywords: ["new", "workshop", "class", "course", "professor"],
          roles: ["PROFESSOR", "EVENT_OFFICE", "ADMIN"],
        },
        {
          id: "create-trip",
          label: "Create Trip",
          icon: <Car className="size-4" />,
          action: () => navigate(`${ROUTES.ADMIN_EVENTS}?createType=TRIP`),
          keywords: ["new", "trip", "excursion", "travel"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        {
          id: "create-bazaar",
          label: "Create Bazaar",
          icon: <Store className="size-4" />,
          action: () => navigate(`${ROUTES.ADMIN_EVENTS}?createType=BAZAAR`),
          keywords: ["new", "bazaar", "market", "vendors"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        {
          id: "create-conference",
          label: "Create Conference",
          icon: <Presentation className="size-4" />,
          action: () => navigate(`${ROUTES.ADMIN_EVENTS}?createType=CONFERENCE`),
          keywords: ["new", "conference", "seminar", "talk"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
      ],
    },
    {
      heading: "Professor",
      actions: [
        {
          id: "my-workshops",
          label: "My Workshops",
          icon: <GraduationCap className="size-4" />,
          action: () => navigate(ROUTES.MY_WORKSHOPS),
          keywords: ["workshops", "classes", "courses", "teaching"],
          roles: ["PROFESSOR"],
        },
        {
          id: "manage-events",
          label: "Manage My Events",
          icon: <Settings className="size-4" />,
          action: () => navigate(ROUTES.ADMIN_EVENTS),
          keywords: ["backoffice", "approve", "create", "edit", "admin"],
          roles: ["PROFESSOR"],
        },
      ],
    },
    {
      heading: "Vendor",
      actions: [
        {
          id: "browse-bazaars",
          label: "Browse Bazaars",
          icon: <ShoppingBag className="size-4" />,
          action: () => navigate(ROUTES.BROWSE_BAZAARS),
          keywords: ["shops", "stalls", "market", "vendor", "booths"],
          roles: ["VENDOR"],
        },
        {
          id: "my-applications",
          label: "My Booth Applications",
          icon: <ClipboardList className="size-4" />,
          action: () => navigate(ROUTES.VENDOR_APPLICATIONS),
          keywords: ["booth", "requests", "status", "applied"],
          roles: ["VENDOR"],
        },
        {
          id: "apply-booth",
          label: "Apply for Platform Booth",
          icon: <MapPin className="size-4" />,
          action: () => navigate(ROUTES.APPLY_PLATFORM_BOOTH),
          keywords: ["register", "booth", "new", "application", "platform"],
          roles: ["VENDOR"],
        },
        {
          id: "vendor-loyalty",
          label: "My Vendor Loyalty",
          icon: <Trophy className="size-4" />,
          action: () => navigate(ROUTES.VENDOR_LOYALTY),
          keywords: ["points", "rewards", "tier", "benefits"],
          roles: ["VENDOR"],
        },
      ],
    },
    {
      heading: "Events Office",
      actions: [
        {
          id: "manage-events",
          label: "Manage All Events",
          icon: <Settings className="size-4" />,
          action: () => navigate(ROUTES.ADMIN_EVENTS),
          keywords: ["backoffice", "approve", "create", "edit", "admin", "events"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        {
          id: "platform-setup",
          label: "Platform Booth Setup",
          icon: <LayoutGrid className="size-4" />,
          action: () => navigate(ROUTES.PLATFORM_SETUP),
          keywords: ["configure", "settings", "booths", "locations", "map"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        {
          id: "vendor-requests",
          label: "Vendor Requests",
          icon: <ClipboardList className="size-4" />,
          action: () => navigate(ROUTES.VENDOR_REQUESTS),
          keywords: ["applications", "approve", "pending", "review", "booths"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        {
          id: "all-vendor-applications",
          label: "All Vendor Applications",
          icon: <Briefcase className="size-4" />,
          action: () => navigate(ROUTES.ALL_APPLICATIONS),
          keywords: ["vendors", "all", "applications", "history"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        // QR Codes page was removed (Coming Soon placeholder)
        {
          id: "bazaar-management",
          label: "Bazaar Management",
          icon: <Building2 className="size-4" />,
          action: () => navigate(ROUTES.BAZAAR_MANAGEMENT),
          keywords: ["markets", "stalls", "vendors", "organize"],
          roles: ["EVENT_OFFICE"],
        },
        {
          id: "workshop-approvals",
          label: "Workshop Approvals",
          icon: <GraduationCap className="size-4" />,
          action: () => navigate(ROUTES.WORKSHOP_APPROVALS),
          keywords: ["approve", "workshops", "pending", "professor"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
      ],
    },
    {
      heading: "Administration",
      actions: [
        {
          id: "admin-users",
          label: "Manage Users",
          icon: <Users className="size-4" />,
          action: () => navigate(ROUTES.ADMIN_USERS),
          keywords: ["accounts", "members", "roles", "permissions", "users"],
          roles: ["ADMIN"],
        },
        {
          id: "admin-loyalty",
          label: "Manage Loyalty Program",
          icon: <Trophy className="size-4" />,
          action: () => navigate(ROUTES.ADMIN_LOYALTY),
          keywords: ["rewards", "tiers", "configure", "vendors"],
          roles: ["ADMIN"],
        },
      ],
    },
    {
      heading: "Reports & Analytics",
      actions: [
        {
          id: "events-report",
          label: "Events Report",
          icon: <FileText className="size-4" />,
          action: () => navigate(ROUTES.EVENTS_REPORTS),
          keywords: ["analytics", "statistics", "attendance", "events"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        {
          id: "sales-report",
          label: "Sales Report",
          icon: <CreditCard className="size-4" />,
          action: () => navigate(ROUTES.SALES_REPORTS),
          keywords: ["revenue", "transactions", "income", "money"],
          roles: ["EVENT_OFFICE", "ADMIN"],
        },
        // Event Office Reports page was removed (Coming Soon placeholder)
      ],
    },
  ];

  // Theme and action commands
  const actionGroups: CommandGroupType[] = [
    {
      heading: "Appearance",
      actions: [
        {
          id: "theme-light",
          label: "Light Mode",
          icon: <Sun className="size-4" />,
          action: () => setTheme("light"),
          keywords: ["bright", "day", "white"],
        },
        {
          id: "theme-dark",
          label: "Dark Mode",
          icon: <Moon className="size-4" />,
          action: () => setTheme("dark"),
          keywords: ["night", "black"],
        },
        {
          id: "theme-system",
          label: "System Theme",
          icon: <Settings className="size-4" />,
          action: () => setTheme("system"),
          keywords: ["auto", "default", "os"],
        },
      ],
    },
    {
      heading: "Account",
      actions: [
        {
          id: "logout",
          label: "Sign Out",
          icon: <LogOut className="size-4" />,
          action: () => {
            logout();
            navigate(ROUTES.LOGIN);
          },
          keywords: ["exit", "leave", "signout", "logout"],
        },
      ],
    },
  ];

  // Filter groups to only show accessible items
  const filterGroups = (groups: CommandGroupType[]) => {
    return groups
      .map((group) => ({
        ...group,
        actions: group.actions.filter((action) => hasAccess(action.roles)),
      }))
      .filter((group) => group.actions.length > 0);
  };

  const filteredNavGroups = filterGroups(navigationGroups);
  const filteredActionGroups = filterGroups(actionGroups);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64 xl:w-72"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 size-4" />
        <span className="hidden lg:inline-flex">Search anything...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.4rem] top-[0.4rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, actions, settings..." />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try searching for pages, actions or settings
              </p>
            </div>
          </CommandEmpty>

          {filteredNavGroups.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.actions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={`${action.label} ${action.keywords?.join(" ") || ""}`}
                  onSelect={() => runAction(action.action)}
                  className="gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                    {action.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{action.label}</span>
                    {action.description && (
                      <span className="text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    )}
                  </div>
                  {action.shortcut && (
                    <CommandShortcut>{action.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          <CommandSeparator />

          {filteredActionGroups.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.actions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={`${action.label} ${action.keywords?.join(" ") || ""}`}
                  onSelect={() => runAction(action.action)}
                  className="gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                    {action.icon}
                  </div>
                  <span className="font-medium">{action.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
