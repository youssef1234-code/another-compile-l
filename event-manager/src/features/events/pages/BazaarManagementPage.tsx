import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { generateEditBazaarUrl, generateEventDetailsUrl, ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Eye, Plus } from "lucide-react";
import { useEffect } from "react";
import { usePageMeta } from '@/components/layout/page-meta-context';

export function BazaarManagementPage() {
  const { setPageMeta } = usePageMeta();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: events, isLoading } = trpc.events.getEvents.useQuery({
    type: "BAZAAR",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    setPageMeta({
      title: 'Bazaar Management',
      description: 'Manage bazaar events and vendor booths',
    });
  }, [setPageMeta]);

  // Only allow Events Office role
  if (!user || user.role !== "EVENT_OFFICE") {
    return <div>Access denied. Only Events Office can manage bazaars.</div>;
  }

  if (isLoading) {
    return <div>Loading bazaars...</div>;
  }

  const bazaars = events?.events || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bazaar Management</h1>
          <p className="text-muted-foreground">Create and manage bazaar events</p>
        </div>
        <Button 
          onClick={() => navigate(ROUTES.CREATE_BAZAAR)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Bazaar
        </Button>
      </div>

      {bazaars.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No bazaars found.</p>
            <Button onClick={() => navigate(ROUTES.CREATE_BAZAAR)}>
              Create Your First Bazaar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bazaars.map((bazaar) => {
            const hasStarted = new Date(bazaar.startDate) <= new Date();
            
            return (
              <Card key={bazaar.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{bazaar.name}</CardTitle>
                  <CardDescription>
                    {new Date(bazaar.startDate).toLocaleDateString()} - {bazaar.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {bazaar.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(generateEventDetailsUrl(bazaar.id))}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(generateEditBazaarUrl(bazaar.id))}
                      disabled={hasStarted}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      {hasStarted ? "Cannot Edit" : "Edit"}
                    </Button>
                  </div>
                  {hasStarted && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Event has started and cannot be edited
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}