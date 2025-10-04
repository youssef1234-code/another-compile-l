import * as React from "react"
import {
  IconCalendar,
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
  IconTicket,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/authStore"
import { UserRole } from "@event-manager/shared"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Events",
      url: "/events",
      icon: IconCalendar,
    },
    {
      title: "My Registrations",
      url: "/registrations",
      icon: IconTicket,
    },
    // Admin/Event Office only
    ...(user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_OFFICE ? [
      {
        title: "Manage Users",
        url: "/admin/users",
        icon: IconUsers,
      },
      {
        title: "Analytics",
        url: "/admin/analytics",
        icon: IconChartBar,
      },
    ] : []),
  ];

  const navSecondary = [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help",
      url: "/help",
      icon: IconHelp,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Event Manager</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user ? `${user.firstName} ${user.lastName}` : 'Guest',
          email: user?.email || '',
          avatar: user?.avatar || '',
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}
