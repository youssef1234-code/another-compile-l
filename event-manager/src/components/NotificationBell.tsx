/**
 * Notification Bell Component
 *
 * Displays notification bell icon with badge count
 * Opens dropdown with recent notifications
 * Supports expansion to full dialog view with search/sort/filter
 */

import { useState, useMemo } from "react";
import { Bell, Check, CheckCheck, Trash2, Expand, Search, ArrowUpDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotificationSystem, useNotificationHistory } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

type SortOption = "newest" | "oldest";
type FilterOption = "all" | "unread" | "read";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  
  const {
    unreadNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    isLoading,
  } = useNotificationSystem();

  const { notifications: allNotifications } = useNotificationHistory(1, 100);

  const processedNotifications = useMemo(() => {
    let filtered = [...allNotifications];
    
    if (filterBy === "unread") {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filterBy === "read") {
      filtered = filtered.filter(n => n.isRead);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  }, [allNotifications, filterBy, searchQuery, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setFilterBy("all");
  };

  const hasActiveFilters = searchQuery || filterBy !== "all" || sortBy !== "newest";

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 md:w-96 p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-sm truncate">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs flex-shrink-0">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="h-7 text-xs px-2"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Mark all</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setExpandedOpen(true);
                }}
                className="h-7 text-xs px-2"
              >
                <Expand className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Expand</span>
              </Button>
            </div>
          </div>

          {unreadNotifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground/70 mt-1">No new notifications</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y">
                {unreadNotifications.slice(0, 8).map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-4 py-3 hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                            setTimeout(() => refresh(), 100);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {unreadNotifications.length > 8 && (
            <div className="px-4 py-3 border-t bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9 text-xs font-medium whitespace-nowrap"
                onClick={() => {
                  setOpen(false);
                  setExpandedOpen(true);
                }}
              >
                View all {unreadNotifications.length} notifications
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={expandedOpen} onOpenChange={setExpandedOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Notifications</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {unreadCount > 0 
                      ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                      : 'All notifications read'
                    }
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="h-8"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                  Mark all as read
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="px-6 py-3 border-b bg-muted/30 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg p-1 bg-muted/30 border flex-1">
                <Button 
                  variant="ghost"
                  size="sm" 
                  onClick={() => setFilterBy("all")}
                  className={cn(
                    'flex-1 text-xs h-7 transition-all',
                    filterBy === "all"
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  All
                </Button>
                <Button 
                  variant="ghost"
                  size="sm" 
                  onClick={() => setFilterBy("unread")}
                  className={cn(
                    'flex-1 text-xs h-7 gap-1.5 transition-all',
                    filterBy === "unread"
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button 
                  variant="ghost"
                  size="sm" 
                  onClick={() => setFilterBy("read")}
                  className={cn(
                    'flex-1 text-xs h-7 transition-all',
                    filterBy === "read"
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  Read
                </Button>
              </div>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <ArrowUpDown className="h-3 w-3 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">Newest first</SelectItem>
                  <SelectItem value="oldest" className="text-xs">Oldest first</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 max-h-[calc(85vh-200px)]">
            {processedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                {searchQuery || filterBy !== "all" ? (
                  <>
                    <p className="font-medium text-muted-foreground">No matching notifications</p>
                    <p className="text-sm text-muted-foreground/70 mt-1 text-center">
                      Try adjusting your search or filters
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-muted-foreground">No notifications yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1 text-center">
                      You'll see updates about events, registrations, and more here
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {processedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-6 py-4 hover:bg-muted/30 transition-colors",
                      !notification.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          notification.isRead ? "bg-transparent" : "bg-primary"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm leading-tight",
                              !notification.isRead ? "font-semibold" : "font-medium"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3">
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark as read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              deleteNotification(notification.id);
                              setTimeout(() => refresh(), 100);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {processedNotifications.length > 0 && (
            <div className="px-6 py-3 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Showing {processedNotifications.length} notification{processedNotifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}