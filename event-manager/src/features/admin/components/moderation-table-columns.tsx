import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate, formatDistanceToNow } from "date-fns";
import { CheckCircle2, ExternalLink, Flag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface FlaggedComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventName: string;
  eventType?: string;
  createdAt: Date | string;
  moderationStatus: string | null;
  moderationFlags: string[];
  moderationSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  moderationConfidence: number;
  moderationAiSuggestion?: 'approve' | 'remove';
}

interface GetModerationTableColumnsProps {
  onApprove?: (commentId: string) => void;
  onRemove?: (commentId: string) => void;
}

const FLAG_CONFIG: Record<string, { label: string; className: string; icon?: string }> = {
  profanity: { label: 'Profanity', className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-700' },
  harassment: { label: 'Harassment', className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-400 dark:border-red-700' },
  hate_speech: { label: 'Hate Speech', className: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-700' },
  spam: { label: 'Spam', className: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-700' },
  inappropriate: { label: 'Inappropriate', className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700' },
  toxicity: { label: 'Toxic', className: 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/50 dark:text-pink-400 dark:border-pink-700' },
};

export function getModerationTableColumns({
  onApprove,
  onRemove,
}: GetModerationTableColumnsProps): ColumnDef<FlaggedComment>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "content",
      accessorKey: "content",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Comment" />
      ),
      cell: ({ row }) => {
        return (
          <div className="max-w-[400px]">
            <p className="text-sm line-clamp-3 break-words whitespace-normal">
              {row.original.content}
            </p>
          </div>
        );
      },
      enableColumnFilter: true,
      size: 400,
      minSize: 300,
      maxSize: 500,
      meta: {
        label: "Comment",
        placeholder: "Filter comments...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne"],
      },
    },
    {
      id: "userName",
      accessorKey: "userName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{row.original.userName}</span>
          <span className="text-xs text-muted-foreground">{row.original.userEmail}</span>
        </div>
      ),
      enableColumnFilter: true,
      size: 180,
      meta: {
        label: "User Name",
        placeholder: "Filter by user...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne"],
      },
    },
    {
      id: "eventName",
      accessorKey: "eventName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Event" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Link 
            to={`/events/${row.original.eventId}`}
            className="text-sm text-primary hover:underline flex items-center gap-1 w-fit"
          >
            {row.original.eventName}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ),
      enableColumnFilter: true,
      size: 180,
      meta: {
        label: "Event",
        placeholder: "Filter by event...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne"],
      },
    },
    {
      id: "moderationSeverity",
      accessorKey: "moderationSeverity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Severity" />
      ),
      cell: ({ row }) => {
        const severity = row.original.moderationSeverity || 'none';
        const config = {
          none: { label: 'None', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400' },
          low: { label: 'Low', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' },
          medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
          high: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' },
          critical: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' },
        };
        
        return (
          <div className="flex items-center gap-2">
            <Badge className={config[severity].className}>
              {config[severity].label}
            </Badge>
          </div>
        );
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(String(row.getValue(id)));
      },
      sortingFn: (rowA, rowB, _columnId) => {
        const severityOrder = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
        const a = severityOrder[rowA.original.moderationSeverity || 'none'] || 0;
        const b = severityOrder[rowB.original.moderationSeverity || 'none'] || 0;
        return a - b;
      },
      size: 120,
      meta: {
        label: "Severity",
        variant: "select" as const,
        operators: ["eq", "ne", "inArray"],
        options: [
          { label: "None", value: "none" },
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Critical", value: "critical" },
        ],
      },
    },
    {
      id: "moderationFlags",
      accessorKey: "moderationFlags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Flags" />
      ),
      cell: ({ row }) => {
        const flags = row.original.moderationFlags || [];
        const confidence = Math.round((row.original.moderationConfidence || 0) * 100);
        
        if (flags.length === 0) {
          return <span className="text-xs text-muted-foreground">No flags</span>;
        }
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {flags.slice(0, 2).map((flag, i) => {
                const config = FLAG_CONFIG[flag] || { label: flag, className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-700' };
                return (
                  <Badge key={i} variant="outline" className={cn("text-[10px] font-medium", config.className)}>
                    <Flag className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                );
              })}
              {flags.length > 2 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-700">
                        +{flags.length - 2} more
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col gap-1">
                        {flags.slice(2).map((flag, i) => {
                          const config = FLAG_CONFIG[flag] || { label: flag, className: '' };
                          return (
                            <div key={i} className="flex items-center gap-1.5">
                              <Flag className="h-3 w-3" />
                              <span className="text-xs font-medium">{config.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {confidence > 0 && (
              <span className="text-[10px] text-muted-foreground">{confidence}% confidence</span>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        const flags = row.original.moderationFlags || [];
        if (!Array.isArray(value) || value.length === 0) return true;
        // Check if any selected flag is in the row's flags
        return value.some(selectedFlag => flags.includes(selectedFlag));
      },
      size: 220,
      meta: {
        label: "Flags",
        variant: "select" as const,
        operators: ["inArray", "notInArray"],
        options: [
          { label: "Profanity", value: "profanity" },
          { label: "Harassment", value: "harassment" },
          { label: "Hate Speech", value: "hate_speech" },
          { label: "Spam", value: "spam" },
          { label: "Inappropriate", value: "inappropriate" },
          { label: "Toxic", value: "toxicity" },
        ],
      },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground cursor-help">
                  {formatDistanceToNow(date, { addSuffix: true })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {formatDate(date, 'PPpp')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableColumnFilter: true,
      size: 150,
      meta: {
        label: "Created At",
        variant: "date" as const,
        operators: ["eq", "ne", "lt", "lte", "gt", "gte", "isBetween", "isRelativeToToday"],
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const comment = row.original;
        
        return (
          <div className="flex items-center gap-1">
            {onApprove && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      onClick={() => onApprove(comment.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Keep comment visible - no action taken against user</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onRemove && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => onRemove(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete & Warn
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Hide comment & send warning email to user</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 200,
    },
  ];
}
