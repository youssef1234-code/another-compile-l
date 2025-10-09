import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: event, isLoading } = trpc.events.getEventById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  if (isLoading) {
    return <div>Loading event...</div>;
  }

  if (!event) {
    return <div>Event not found.</div>;
  }

  const canEdit = user?.role === "EVENT_OFFICE" && event.type === "BAZAAR";
  const hasStarted = new Date(event.startDate) <= new Date();

  const handleEdit = () => {
    if (event.type === "BAZAAR") {
      navigate(ROUTES.EDIT_BAZAAR.replace(':id', event.id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <p className="text-lg text-muted-foreground">{event.type}</p>
        </div>
        {canEdit && (
          <Button 
            onClick={handleEdit}
            disabled={hasStarted}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {hasStarted ? "Cannot Edit (Started)" : "Edit Bazaar"}
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-muted-foreground">{event.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Event Details</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Start:</strong> {new Date(event.startDate).toLocaleString()}</li>
              <li><strong>End:</strong> {new Date(event.endDate).toLocaleString()}</li>
              <li><strong>Location:</strong> {event.location}</li>
              {event.locationDetails && <li><strong>Location Details:</strong> {event.locationDetails}</li>}
              {event.capacity && <li><strong>Capacity:</strong> {event.capacity}</li>}
              {event.registrationDeadline && (
                <li><strong>Registration Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Status:</strong> {event.status}</li>
              {event.professorName && <li><strong>Professor:</strong> {event.professorName}</li>}
              {event.createdBy && (
                <li><strong>Created by:</strong> {event.createdBy.firstName} {event.createdBy.lastName}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
