/**
 * ImageGallery Component
 *
 * Multiple image upload with drag-drop reordering and deletion
 *
 * Features:
 * - Multiple file upload with drag-drop
 * - Reorder images by drag-drop
 * - Delete individual images
 * - First image is primary
 * - Max images limit (default: 10)
 * - Image preview thumbnails
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  X,
  Upload,
  GripVertical,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { trpc } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { formatValidationErrors } from "@/lib/format-errors";

// Component to load and display a single image thumbnail
function ImageThumbnail({ imageId, alt }: { imageId: string; alt: string }) {
  const { data: fileData, isLoading } = trpc.files.downloadPublicFile.useQuery(
    { fileId: imageId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 1,
    }
  );

  const imageUrl = useMemo(() => {
    if (!fileData) return null;
    return `data:${fileData.mimeType};base64,${fileData.data}`;
  }, [fileData]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
        Failed to load
      </div>
    );
  }

  return (
    <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
  );
}

interface ImageGalleryProps {
  value?: string[]; // Array of file IDs
  onChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageGallery({
  value = [],
  onChange,
  maxImages = 10,
  disabled = false,
  className,
}: ImageGalleryProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  // Track which images are currently uploading with their preview URLs
  const [uploadingPreviews, setUploadingPreviews] = useState<string[]>([]);
  // Map base64 to dataUrl for removal after upload
  const [uploadMap, setUploadMap] = useState<Record<string, string>>({});

  const uploadMutation = trpc.files.uploadFile.useMutation({
    onSuccess: (data, variables) => {
      // Get the dataUrl from the map and remove from uploading state
      const dataUrl = uploadMap[variables.file];
      if (dataUrl) {
        setUploadingPreviews((prev) => prev.filter((url) => url !== dataUrl));
        setUploadMap((prev) => {
          const newMap = { ...prev };
          delete newMap[variables.file];
          return newMap;
        });
      }

      // Add the uploaded file ID to the array
      const newImages = [...value, data.id];
      onChange(newImages);

      toast.success("Image uploaded successfully");
    },
    onError: (error, variables) => {
      // Get the dataUrl from the map and remove from uploading state
      const dataUrl = uploadMap[variables.file];
      if (dataUrl) {
        setUploadingPreviews((prev) => prev.filter((url) => url !== dataUrl));
        setUploadMap((prev) => {
          const newMap = { ...prev };
          delete newMap[variables.file];
          return newMap;
        });
      }
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: "pre-line" } });
    },
  });

  const uploadUnsecureMutation = trpc.files.uploadUnprotectedFile.useMutation({
    onSuccess: (data, variables) => {
      // Get the dataUrl from the map and remove from uploading state
      const dataUrl = uploadMap[variables.file];
      if (dataUrl) {
        setUploadingPreviews((prev) => prev.filter((url) => url !== dataUrl));
        setUploadMap((prev) => {
          const newMap = { ...prev };
          delete newMap[variables.file];
          return newMap;
        });
      }

      // Add the uploaded file ID to the array
      const newImages = [...value, data.id];
      onChange(newImages);

      toast.success("Image uploaded successfully");
    },
    onError: (error, variables) => {
      // Get the dataUrl from the map and remove from uploading state
      const dataUrl = uploadMap[variables.file];
      if (dataUrl) {
        setUploadingPreviews((prev) => prev.filter((url) => url !== dataUrl));
        setUploadMap((prev) => {
          const newMap = { ...prev };
          delete newMap[variables.file];
          return newMap;
        });
      }
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: "pre-line" } });
    },
  });

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || disabled) return;

      const remainingSlots = maxImages - value.length;
      if (remainingSlots <= 0) {
        toast.error(
          `Maximum images reached. You can only upload up to ${maxImages} images`
        );
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToUpload) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error("Invalid file type. Please upload only image files");
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File too large. Please upload images smaller than 5MB");
          continue;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          // Extract base64 part from data URL (remove "data:image/png;base64," prefix)
          const base64 = dataUrl.split(",")[1];

          // Add to uploading previews so we can show it immediately
          setUploadingPreviews((prev) => [...prev, dataUrl]);

          // Store mapping of base64 to dataUrl so we can remove it after upload
          setUploadMap((prev) => ({ ...prev, [base64]: dataUrl }));

          // Upload file
          uploadMutation.mutate({
            file: base64,
            filename: file.name,
            mimeType: file.type,
            entityType: "event",
            isPublic: true,
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [value.length, maxImages, disabled, uploadMutation]
  );

  const handleDelete = (index: number) => {
    if (disabled) return;
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || disabled) return;

    const newImages = [...value];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      {value.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-primary",
            (uploadMutation.isPending || uploadUnsecureMutation.isPending) &&
              "opacity-50 cursor-wait"
          )}
          onClick={() => {
            if (
              disabled ||
              uploadMutation.isPending ||
              uploadUnsecureMutation.isPending
            )
              return;
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.multiple = true;
            input.onchange = (e) =>
              handleFileSelect((e.target as HTMLInputElement).files);
            input.click();
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {uploadMutation.isPending || uploadUnsecureMutation.isPending
                  ? "Uploading..."
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 5MB (Max {maxImages} images,{" "}
                {maxImages - value.length} remaining)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {(value.length > 0 || uploadingPreviews.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Show uploaded images */}
          {value.map((imageId, index) => (
            <div
              key={imageId}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all",
                disabled
                  ? "cursor-default"
                  : "cursor-move hover:border-primary",
                draggedIndex === index && "opacity-50",
                index === 0 && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                  Primary
                </div>
              )}

              {/* Drag Handle */}
              {!disabled && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-background/80 backdrop-blur-sm rounded p-1">
                    <GripVertical className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Delete Button */}
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute bottom-2 right-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Image */}
              <ImageThumbnail
                imageId={imageId}
                alt={`Gallery image ${index + 1}`}
              />
            </div>
          ))}

          {/* Show uploading previews */}
          {uploadingPreviews.map((previewUrl, index) => (
            <div
              key={`uploading-${index}`}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary transition-all opacity-70"
            >
              {/* Uploading Badge */}
              <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium animate-pulse">
                Uploading...
              </div>

              {/* Preview Image */}
              <img
                src={previewUrl}
                alt={`Uploading ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 &&
        uploadingPreviews.length === 0 &&
        !uploadMutation.isPending && (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No images uploaded yet</p>
          </div>
        )}

      {/* Helper Text */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          First image will be used as the primary image. Drag to reorder.
        </p>
      )}
    </div>
  );
}
