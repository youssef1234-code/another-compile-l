/**
 * Application Sidebar (Sidebar-08 Style)
 * Inset sidebar with secondary navigation
 * Organized by user roles and features from requirements
 */

import {
  Calendar,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Users,
  FileText,
  Trophy,
  Dumbbell,
  Building2,
  Bell,
  Heart,
  CreditCard,
  BarChart3,
  UserCheck,
  CheckSquare,
  Package,
  ClipboardList,
  Vote,
  MapPin,
  LogOut,
  type LucideIcon,
} from "lucide-react"

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
} from "@/components/ui/sidebar"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { ROUTES } from "@/lib/constants"
import { getAvatarSrc } from "@event-manager/shared"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Navigation structure based on user roles and requirements
interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  items?: NavItem[]
  badge?: string
  roles?: string[] // Which roles can see this item
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
      { title: "Browse Events", url: ROUTES.EVENTS, icon: Calendar },
      { title: "My Registrations", url: ROUTES.MY_REGISTRATIONS, icon: CheckSquare, roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"] },
      { title: "Favorites", url: ROUTES.FAVORITES, icon: Heart, roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"] },
      { title: "Create Workshop", url: ROUTES.CREATE_WORKSHOP, icon: GraduationCap, roles: ["PROFESSOR"] },
      { title: "My Workshops", url: ROUTES.MY_WORKSHOPS, icon: FileText, roles: ["PROFESSOR"] },
      { title: "Create Trip", url: ROUTES.CREATE_TRIP, icon: MapPin, roles: ["EVENT_OFFICE"] },
      { title: "Create Bazaar", url: ROUTES.CREATE_BAZAAR, icon: ShoppingBag, roles: ["EVENT_OFFICE"] },
      { title: "Create Conference", url: ROUTES.CREATE_CONFERENCE, icon: Building2, roles: ["EVENT_OFFICE"] },
    ],
  },
  {
    title: "Vendors",
    icon: ShoppingBag,
    url: ROUTES.BROWSE_BAZAARS,
    roles: ["VENDOR", "ADMIN", "EVENT_OFFICE", "STUDENT", "STAFF", "TA", "PROFESSOR"],
    items: [
      { title: "Browse Bazaars", url: ROUTES.BROWSE_BAZAARS, icon: ShoppingBag, roles: ["VENDOR"] },
      { title: "My Applications", url: ROUTES.VENDOR_APPLICATIONS, icon: ClipboardList, roles: ["VENDOR"] },
      { title: "Loyalty Program", url: ROUTES.LOYALTY_PROGRAM, icon: Trophy },
      { title: "Vendor Requests", url: ROUTES.VENDOR_REQUESTS, icon: Package, roles: ["ADMIN", "EVENT_OFFICE"] },
    ],
  },
  {
    title: "Gym & Sports",
    icon: Dumbbell,
    url: ROUTES.GYM_SCHEDULE,
    items: [
      { title: "Gym Schedule", url: ROUTES.GYM_SCHEDULE, icon: Calendar },
      { title: "My Sessions", url: ROUTES.MY_SESSIONS, icon: CheckSquare, roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"] },
      { title: "Court Bookings", url: ROUTES.COURT_BOOKINGS, icon: Trophy, roles: ["STUDENT"] },
      { title: "Manage Sessions", url: ROUTES.MANAGE_SESSIONS, icon: Settings, roles: ["EVENT_OFFICE"] },
    ],
  },
  {
    title: "Admin",
    icon: Users,
    url: ROUTES.ADMIN_USERS,
    roles: ["ADMIN"],
    items: [
      { title: "All Users", url: ROUTES.ADMIN_USERS, icon: Users },
      { title: "Role Approvals", url: ROUTES.ADMIN_ROLE_APPROVALS, icon: UserCheck },
      { title: "Vendor Approvals", url: ROUTES.ADMIN_VENDOR_APPROVALS, icon: CheckSquare },
      { title: "Manage Accounts", url: ROUTES.ADMIN_MANAGE_ACCOUNTS, icon: Settings },
      { title: "Reports", url: ROUTES.ADMIN_REPORTS, icon: BarChart3 },
      { title: "Comments", url: ROUTES.ADMIN_COMMENTS, icon: FileText },
    ],
  },
  {
    title: "Events Office",
    icon: Building2,
    url: ROUTES.WORKSHOP_APPROVALS,
    roles: ["EVENT_OFFICE"],
    items: [
      { title: "Workshop Approvals", url: ROUTES.WORKSHOP_APPROVALS, icon: GraduationCap },
      { title: "Vendor Polls", url: ROUTES.VENDOR_POLLS, icon: Vote },
      { title: "Reports", url: ROUTES.EVENT_OFFICE_REPORTS, icon: BarChart3 },
      { title: "QR Codes", url: ROUTES.QR_CODES, icon: Package },
    ],
  },
  {
    title: "Wallet",
    url: ROUTES.WALLET,
    icon: CreditCard,
    roles: ["STUDENT", "STAFF", "TA", "PROFESSOR"],
  },
  {
    title: "Notifications",
    url: ROUTES.NOTIFICATIONS,
    icon: Bell,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const logoutMutation = trpc.auth.logout.useMutation()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      logout()
      toast.success("Logged out successfully")
      navigate(ROUTES.LOGIN)
    } catch (error: any) {
      toast.error(error.message || "Failed to logout")
    }
  }

  // Filter navigation based on user role
  const filteredNav = navigationConfig.filter(item => {
    if (!item.roles) return true
    return user?.role && item.roles.includes(user.role)
  })

  const getInitials = () => {
    if (!user) return "U"
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }

  const avatarSrc = user?.avatar ? getAvatarSrc(user.avatar, user.avatarType as 'upload' | 'preset') : undefined

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-neutral-900 text-neutral-50">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">GUC Events</span>
                  <span className="truncate text-xs text-neutral-500">Event Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/")
              
              if (item.items && item.items.length > 0) {
                // Filter sub-items based on role
                const filteredItems = item.items.filter(subItem => {
                  if (!subItem.roles) return true
                  return user?.role && subItem.roles.includes(user.role)
                })

                if (filteredItems.length === 0) return null

                return (
                  <Collapsible key={item.title} asChild defaultOpen={isActive}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon className="size-4" />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {filteredItems.map((subItem) => {
                            const isSubActive = location.pathname === subItem.url
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={isSubActive}>
                                  <Link to={subItem.url}>
                                    {subItem.icon && <subItem.icon className="size-4" />}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link to={item.url}>
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/profile">
                <Avatar className="size-8">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="bg-neutral-100 text-neutral-900">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="truncate text-xs text-neutral-500">{user?.email}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-4" />
              <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
