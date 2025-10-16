/**
 * Event Image Carousel
 * 
 * Display multiple event images with navigation
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

// Component to load and display carousel image
function CarouselImage({ imageId, alt, index, total }: { imageId: string; alt: string; index: number; total: number }) {
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
      <div className="w-full h-full flex items-center justify-center bg-black/60">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-2" />
          <p className="text-white text-sm">Loading image {index + 1} of {total}...</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/60">
        <div className="text-center text-white">
          <p className="text-lg font-medium mb-1">Failed to load image</p>
          <p className="text-sm opacity-75">Image {index + 1} of {total}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`${alt} - Image ${index + 1}`}
      className="w-full h-full object-cover transition-opacity duration-300"
    />
  );
}

interface EventImageCarouselProps {
  images: string[]; // Array of file IDs
  alt: string;
  className?: string;
}

export function EventImageCarousel({ images, alt, className }: EventImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={cn('relative w-full h-full group', className)}>
      {/* Main Image */}
      <CarouselImage 
        imageId={images[currentIndex]} 
        alt={alt}
        index={currentIndex}
        total={images.length}
      />

      {/* Navigation Arrows - Show only if multiple images */}
      {images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToImage(index);
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                )}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
