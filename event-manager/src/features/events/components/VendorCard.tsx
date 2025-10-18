import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Building2, ChevronDown, ChevronRight, Users } from "lucide-react";
import { useState } from "react";

interface VendorCardProps {
  vendor: {
    id: string;
    companyName: string;
    email: string;
    boothSize?: string;
    names?: string[];
    emails?: string[];
  };
  showParticipants?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function VendorCard({ 
  vendor, 
  showParticipants = true, 
  defaultExpanded = false,
  className 
}: VendorCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const participantCount = vendor.names?.length || 0;

  const getBoothSizeLabel = (size?: string) => {
    switch (size) {
      case "TWO_BY_TWO":
        return "2×2";
      case "FOUR_BY_FOUR":
        return "4×4";
      default:
        return size;
    }
  };

  return (
    <div className={cn("border rounded-lg p-3 hover:bg-muted/30 transition-colors", className)}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-sm">{vendor.companyName}</h4>
            {vendor.boothSize && (
              <Badge variant="outline" className="text-xs">
                {getBoothSizeLabel(vendor.boothSize)}
              </Badge>
            )}
            {!showParticipants && participantCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {participantCount}
              </Badge>
            )}
          </div>
          
          {showParticipants && participantCount > 0 && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <Users className="h-3.5 w-3.5" />
                <span>
                  {participantCount} {participantCount === 1 ? "Participant" : "Participants"}
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2">
                <div className="space-y-1.5 pl-5 border-l-2 border-muted ml-1">
                  {vendor.names?.map((name, index) => (
                    <div key={index} className="text-xs">
                      <div className="font-medium text-foreground">{name}</div>
                      {vendor.emails?.[index] && (
                        <div className="text-muted-foreground truncate">
                          {vendor.emails[index]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
