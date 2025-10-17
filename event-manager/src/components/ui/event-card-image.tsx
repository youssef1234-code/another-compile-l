/**
 * Event Card Image Component
 * 
 * Displays event images using tRPC file download
 * with loading and error states
 */

import { useMemo } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface EventCardImageProps {
  imageId: string;
  alt: string;
  className?: string;
}

export function EventCardImage({ imageId, alt, className = '' }: EventCardImageProps) {
  const { data: fileData, isLoading, isError } = trpc.files.downloadPublicFile.useQuery(
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
      <div className={`w-full h-full flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !imageUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-muted ${className}`}>
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}
