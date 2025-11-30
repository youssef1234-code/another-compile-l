/**
 * Application Sidebar (Sidebar-08 Style)
 * Inset sidebar with secondary navigation
 * Organized by user roles and features from requirements
 */

import {
  Calendar,
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  Users,
  FileText,
  Trophy,
  Dumbbell,
  Building2,
  Heart,
  CreditCard,
  BarChart3,
  Clipboard,
  ClipboardList,
  Vote,
  MapPin,
  LayoutGrid,
  Settings,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { trpc } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { ROUTES } from "@/lib/constants";
import { getAvatarSrc } from "@event-manager/shared";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavUser } from "@/components/nav-user";

// Navigation structure based on user roles and requirements
interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavItem[];
  badge?: string;
  roles?: string[]; // Which roles can see this item
}

const navigationConfig: NavItem[] = [
  {
    title: "Dashboard",
    url: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    title: "Events",
    icon: Calendar,
    url: ROUTES.EVENTS,
    items: [
      {
        title: "Browse Events",
        url: ROUTES.EVENTS,
        icon: Calendar,
        roles: ["STUDENT", "STAFF", "TA", "PROFESSOR", "ADMIN", "EVENT_OFFICE"],
      },
      {
        title: "My Registrations",
        url: ROUTES.MY_REGISTRATIONS,
        icon: ClipboardList,
        roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"],
      },
      {
        title: "Manage Events",
        url: ROUTES.ADMIN_EVENTS,
        icon: Settings,
        roles: ["ADMIN", "EVENT_OFFICE", "PROFESSOR"],
      },
      {
        title: "Favorites",
        url: ROUTES.FAVORITES,
        icon: Heart,
        roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"],
      },
    ],
  },
  {
    title: "Browse Bazaars",
    url: ROUTES.BROWSE_BAZAARS,
    icon: ShoppingBag,
    roles: ["VENDOR"],
  },
  {
    title: "Apply Platform Booth",
    url: ROUTES.APPLY_PLATFORM_BOOTH,
    icon: MapPin,
    roles: ["VENDOR"],
  },
  {
    title: "My Applications",
    url: ROUTES.VENDOR_APPLICATIONS,
    icon: ClipboardList,
    roles: ["VENDOR"],
  },
  {
    title: "Loyalty Program",
    url: ROUTES.VENDOR_LOYALTY,
    icon: Trophy,
    roles: ["VENDOR"],
  },
  {
    title: "Loyalty Program",
    url: ROUTES.LOYALTY_PROGRAM,
    icon: Trophy,
    roles: ["STUDENT", "STAFF", "TA", "PROFESSOR", "ADMIN", "EVENT_OFFICE"],
  },
  {
    title: "Vendors",
    icon: ShoppingBag,
    url: ROUTES.BROWSE_BAZAARS,
    roles: ["ADMIN", "EVENT_OFFICE", "STUDENT", "STAFF", "TA", "PROFESSOR"],
    items: [
      {
        title: "Manage Requests",
        url: ROUTES.VENDOR_REQUESTS,
        icon: Clipboard,
        roles: ["ADMIN", "EVENT_OFFICE"],
      },
      {
        title: "Vendor Polls",
        url: ROUTES.VENDOR_POLLS,
        icon: Vote,
        roles: ["STUDENT", "STAFF", "TA", "PROFESSOR", "ADMIN", "EVENT_OFFICE"],
      },
    ],
  },
  {
    title: "Gym & Sports",
    icon: Dumbbell,
    url: ROUTES.GYM_SCHEDULE,
    items: [
      {
        title: "Gym Schedule",
        url: ROUTES.GYM_SCHEDULE,
        icon: Calendar,
      },
      {
        title: "Court Bookings",
        url: ROUTES.COURT_BOOKINGS,
        icon: Trophy,
        roles: ["STUDENT"],
      },
      {
        title: "Manage Courts",
        url: ROUTES.COURT_MANAGEMENT,
        icon: Trophy,
        roles: ["EVENT_OFFICE", "ADMIN"],
      },
    ],
  },
  {
    title: "Manage Users",
    icon: Users,
    url: ROUTES.ADMIN_USERS,
    roles: ["ADMIN"],
  },
  {
    title: "Events Office",
    icon: Building2,
    url: ROUTES.ADMIN_EVENTS,
    roles: ["EVENT_OFFICE", "ADMIN"],
    items: [
      { title: "Platform Setup", url: ROUTES.PLATFORM_SETUP, icon: LayoutGrid },
      { title: "Vendor Polls", url: ROUTES.VENDOR_POLLS, icon: Vote },
    ],
  },
  {
    title: "Reports",
    url: ROUTES.EVENT_OFFICE_REPORTS,
    icon: BarChart3,
    roles: ["EVENT_OFFICE", "ADMIN"],
    items: [
      {
        title: "Events Report",
        url: ROUTES.EVENTS_REPORTS,
        icon: FileText,
      },
      {
        title: "Sales Report",
        url: ROUTES.SALES_REPORTS,
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Wallet",
    url: ROUTES.WALLET,
    icon: CreditCard,
    roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { state } = useSidebar();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      toast.success("Logged out successfully");
      navigate(ROUTES.LOGIN);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to logout";
      toast.error(message);
    }
  };

  // Filter navigation based on user role
  const filteredNav = navigationConfig.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  const avatarSrc = user?.avatar
    ? getAvatarSrc(user.avatar, user.avatarType as "upload" | "preset")
    : undefined;

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="border-r bg-gradient-to-b from-sidebar/95 via-sidebar to-sidebar/98"
      {...props}
    >
      <SidebarHeader className="p-2 pb-4 overflow-hidden">
        <Link to={ROUTES.DASHBOARD} className="block">
          <img
            src={state === "collapsed" ? "/favicon.png" : "/logo.png"}
            alt="Another Compile L"
            className={`w-full h-auto max-h-12 object-contain transition-transform duration-300 ${state === "collapsed" ? "scale-100" : "scale-320"}`}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNav.map((item) => {
              const isActive =
                location.pathname === item.url ||
                location.pathname.startsWith(item.url + "/");

              if (item.items && item.items.length > 0) {
                // Filter sub-items based on role
                const filteredItems = item.items.filter((subItem) => {
                  if (!subItem.roles) return true;
                  return user?.role && subItem.roles.includes(user.role);
                });

                if (filteredItems.length === 0) return null;

                // Check if any sub-item is active
                const hasActiveChild = filteredItems.some(
                  (subItem) => location.pathname === subItem.url
                );
                const isMainOrChildActive = isActive || hasActiveChild;

                // In collapsed mode, use DropdownMenu
                if (state === "collapsed") {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            className={
                              isMainOrChildActive
                                ? "!bg-primary/10 !text-primary hover:!bg-primary/15 hover:!text-primary [&>svg]:!text-primary"
                                : ""
                            }
                          >
                            {item.icon && <item.icon className="size-4" />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto size-4" />
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          className="min-w-48"
                        >
                          {filteredItems.map((subItem) => {
                            const isSubActive =
                              location.pathname === subItem.url;
                            return (
                              <DropdownMenuItem key={subItem.title} asChild>
                                <Link
                                  to={subItem.url}
                                  className={
                                    isSubActive
                                      ? "!bg-primary/10 !text-primary font-medium [&>svg]:!text-primary"
                                      : ""
                                  }
                                >
                                  {subItem.icon && (
                                    <subItem.icon className="mr-2 size-4" />
                                  )}
                                  <span>{subItem.title}</span>
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                }

                // In expanded mode, use Collapsible - only highlight sub-items, not parent
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isMainOrChildActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          size="default"
                          className="h-10"
                        >
                          {item.icon && <item.icon className="size-4" />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden transition-all duration-200 data-[state=closed]:animate-[collapsible-up_200ms_ease-out] data-[state=open]:animate-[collapsible-down_200ms_ease-out]">
                        <SidebarMenuSub>
                          {filteredItems.map((subItem) => {
                            const isSubActive =
                              location.pathname === subItem.url;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubActive}
                                  className={
                                    isSubActive
                                      ? "!bg-primary/10 !text-primary hover:!bg-primary/15 hover:!text-primary h-9 [&>svg]:!text-primary font-medium"
                                      : "h-9"
                                  }
                                >
                                  <Link to={subItem.url}>
                                    {subItem.icon && (
                                      <subItem.icon className="size-4" />
                                    )}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    size="default"
                    className={
                      isActive
                        ? "!bg-primary/10 !text-primary hover:!bg-primary/15 hover:!text-primary h-10 [&>svg]:!text-primary font-medium"
                        : "h-10"
                    }
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name:
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "User",
            email: user?.email || "",
            avatar: avatarSrc || "",
          }}
          onLogout={handleLogout}
          isLoggingOut={logoutMutation.isPending}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
