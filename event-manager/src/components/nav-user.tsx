import { ChevronsUpDown, LogOut, Wallet, User, Bell, Sun, Moon, Monitor, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { trpc } from "@/lib/trpc"
import { useAuthStore } from "@/store/authStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import { ROUTES } from "@/lib/constants"
import { useTheme } from "@/hooks/useTheme"

export function NavUser({
  user,
  onLogout,
  isLoggingOut,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  onLogout: () => void
  isLoggingOut?: boolean
}) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { user: authUser } = useAuthStore()
  
  // Fetch wallet balance for students, staff, TAs, and professors
  const canHaveWallet = authUser?.role && ['STUDENT', 'STAFF', 'TA', 'PROFESSOR'].includes(authUser.role)
  const { data: walletData, isLoading: isWalletLoading } = trpc.payments.myWallet.useQuery(
    { page: 1, limit: 1 },
    { enabled: canHaveWallet, staleTime: 30000 } // Cache for 30s
  )
  
  const balance = walletData?.balance?.balanceMinor ?? 0
  const currency = walletData?.balance?.currency ?? 'EGP'
  const balanceDisplay = `${(balance / 100).toFixed(2)} ${currency}`

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={ROUTES.PROFILE}>
                <User className="mr-2 size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {canHaveWallet && (
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={ROUTES.WALLET} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet className="mr-2 size-4" />
                    <span>Wallet</span>
                  </div>
                  {isWalletLoading ? (
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-xs font-semibold text-primary ml-auto">
                      {balanceDisplay}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={ROUTES.NOTIFICATIONS}>
                <Bell className="mr-2 size-4" />
                Notifications
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* Theme Selector */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <Sun className="mr-2 size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute mr-2 size-4 left-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                  <Sun className="mr-2 size-4" />
                  <span>Light</span>
                  {theme === 'light' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                  <Moon className="mr-2 size-4" />
                  <span>Dark</span>
                  {theme === 'dark' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                  <Monitor className="mr-2 size-4" />
                  <span>System</span>
                  {theme === 'system' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 cursor-pointer"
            >
              <LogOut className="mr-2 size-4 text-destructive" />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
