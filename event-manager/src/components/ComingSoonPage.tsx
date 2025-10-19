/**
 * Coming Soon Page Component
 * Professional placeholder for features under development
 */

import { usePageMeta } from '@/components/layout/page-meta-context';
import { useEffect } from 'react';
import { Construction, Calendar, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComingSoonPageProps {
  title: string;
  description: string;
  features?: string[];
}

export function ComingSoonPage({ title, description, features }: ComingSoonPageProps) {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title,
      description,
    });
  }, [setPageMeta, title, description]);

  return (
    <div className="flex flex-col h-full p-6">
      {/* Hero Section */}
      <Card className="relative overflow-hidden border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background flex-1 flex flex-col">
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center overflow-y-auto">
          {/* Icon */}
          <div className="relative mb-4">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Construction className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Badge */}
          <Badge variant="default" className="mb-3 text-sm px-4 py-1">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Coming Soon
          </Badge>

          {/* Title */}
          <h2 className="text-2xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h2>

          {/* Description */}
          <p className="text-base text-muted-foreground max-w-2xl mb-6">
            {description}
          </p>

          {/* Features List */}
          {features && features.length > 0 && (
            <div className="w-full max-w-3xl">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                <span className="text-sm font-medium text-muted-foreground">
                  Planned Features
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
              </div>
              
              <div className="grid gap-2 md:grid-cols-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 rounded-lg border bg-card/50 px-3 py-2 text-left transition-colors hover:bg-card"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Message */}
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span>We're working hard to bring this feature to you</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
