/**
 * Image Upload Component
 * 
 * Handles image upload with preview, drag-and-drop, and compression
 * Integrates with file.service for production-ready image management
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

interface ImageUploadProps {
  value?: string; // File ID or URL
  onChange: (fileId: string) => void;
  onRemove?: () => void;
  entityType?: 'user' | 'event' | 'vendor' | 'feedback' | 'registration' | 'other';
  entityId?: string;
  disabled?: boolean;
  maxSizeMB?: number;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto'; // 1:1, 16:9, 3:1, or auto
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  entityType = 'event',
  entityId,
  disabled = false,
  maxSizeMB = 5,
  aspectRatio = 'banner',
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize preview from value prop on mount
  useEffect(() => {
    if (value && !preview) {
      // Check if it's already a data URL or HTTP URL
      if (value.startsWith('data:') || value.startsWith('http')) {
        setPreview(value);
      }
    }
  }, []); // Only run on mount

  const uploadMutation = trpc.files.uploadFile.useMutation({
    onSuccess: (data) => {
      // Store file ID and keep preview
      onChange(data.id);
      toast.success('Image uploaded successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload image');
      setPreview(null);
    },
  });

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const base64 = await fileToBase64(file);
      await uploadMutation.mutateAsync({
        file: base64.split(',')[1], // Remove data:image/...;base64, prefix
        filename: file.name,
        mimeType: file.type,
        entityType,
        entityId,
        isPublic: true,
        skipCompression: false, // Let backend compress
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
    auto: 'aspect-auto min-h-[200px]',
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative w-full rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          aspectRatioClasses[aspectRatio],
          isDragging && 'border-primary bg-primary/5',
          !isDragging && !preview && 'border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/20',
          disabled && 'opacity-50 cursor-not-allowed',
          preview && 'border-transparent'
        )}
      >
        {uploadMutation.isPending ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Uploading image...</p>
          </div>
        ) : preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                <Upload className="h-4 w-4 mr-1" />
                Change
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
