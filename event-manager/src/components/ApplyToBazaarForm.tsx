// src/features/vendor/components/ApplyToBazaarForm.tsx
import { z } from "zod";
import { GenericForm } from "@/components/generic/GenericForm";
import { trpc } from "@/lib/trpc";
import { toast } from "react-hot-toast";

const BoothUi = ["2x2", "4x4"] as const;
type BoothUi = typeof BoothUi[number];
const schema = z.object({
  attendeesCsv: z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .refine((arr) => arr.length <= 5, "Maximum 5 attendees"),
  boothUi: z.enum(BoothUi),
});

function mapBoothToBackend(v: BoothUi): "SMALL" | "LARGE" {
  return v === "2x2" ? "SMALL" : "LARGE";
}

export type ApplyToBazaarFormProps = {
  vendorId: string;
  eventId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ApplyToBazaarForm({
  vendorId,
  eventId,
  onSuccess,
  onCancel,
}: ApplyToBazaarFormProps) {
  const utils = trpc.useUtils();
  const applyM = trpc.vendor.applyToBazaar.useMutation({
    onSuccess: () => {
      toast.success("Application submitted");
      utils.vendor.getMyApplications.invalidate();
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || "Failed to apply"),
  });

  return (
    <div className="space-y-3">
      <GenericForm
        schema={schema}
        defaultValues={{ attendeesCsv: "", boothUi: "2x2" }}
        onSubmit={(values) => {
          const attendees = (values.attendeesCsv as unknown as string[]) ?? [];
          applyM.mutate({
            vendorId,
            eventId,
            attendees,
            boothSize: mapBoothToBackend(values.boothUi),
          });
        }}
        fields={[
          {
            name: "attendeesCsv",
            label: "Attendees (comma separated, max 5)",
            type: "text",
            placeholder: "Alice, Bob, Charlie",
          },
          {
            name: "boothUi",
            label: "Booth Size",
            type: "select",
            options: [
              { value: "2x2", label: "2 x 2 m (Small)" },
              { value: "4x4", label: "4 x 4 m (Large)" },
            ],
          },
        ]}
      />

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted-foreground underline"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
