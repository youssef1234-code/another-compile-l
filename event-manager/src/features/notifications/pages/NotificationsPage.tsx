/**
 * Notifications Page
 *
 * Full page view of all notifications with pagination
 */

import { useState } from "react";
import { Bell, CheckCheck, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useNotificationHistory,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@event-manager/shared";

export function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");

  const {
    unreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    refresh,
    isLoading,
  } = useNotifications();

  const {
    notifications: allNotifications,
    total,
    hasMore,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useNotificationHistory(page, 20);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_EVENT":
        return "🎉";
      case "EVENT_REMINDER":
        return "⏰";
      case "WORKSHOP_STATUS_UPDATE":
        return "📝";
      case "VENDOR_REQUEST_UPDATE":
        return "✅";
      case "VENDOR_PENDING":
        return "📋";
      case "VENDOR_POLL_CREATED":
        return "🗳️";
      case "COMMENT_DELETED_WARNING":
        return "⚠️";
      case "GYM_SESSION_UPDATE":
        return "🏋️";
      case "NEW_LOYALTY_PARTNER":
        return "🎁";
      default:
        return "🔔";
    }
  };

  const renderNotificationCard = (notification: Notification) => (
    <Card
      key={notification.id}
      className={cn(
        "mb-4 transition-all",
        !notification.isRead && "border-primary/50 bg-accent/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl">
              {getNotificationIcon(notification.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                {!notification.isRead && (
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification.id);
                }}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
                // Force refresh both unread and all notifications
                setTimeout(() => {
                  refresh();
                  refetchHistory();
                }, 100);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refresh();
            refetchHistory();
          }}
          disabled={isLoading || isLoadingHistory}
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "unread" | "all")}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="unread">
              Unread
              {unreadNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">
              All
              {total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {total}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === "unread" && unreadNotifications.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  deleteAll();
                  // Force refresh both unread and all notifications
                  setTimeout(() => {
                    refresh();
                    refetchHistory();
                  }, 100);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete all
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="unread">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-center">
                  You have no unread notifications
                </p>
              </CardContent>
            </Card>
          ) : (
            <div>{unreadNotifications.map(renderNotificationCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {isLoadingHistory ? (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Loading notifications...
                </p>
              </CardContent>
            </Card>
          ) : allNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No notifications yet
                </h3>
                <p className="text-muted-foreground text-center">
                  You'll see notifications here when you have them
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div>{allNotifications.map(renderNotificationCard)}</div>

              {/* Pagination */}
              {(page > 1 || hasMore) && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
