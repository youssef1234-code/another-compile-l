/**
 * Avatar Picker Component
 * 
 * Allows users to:
 * 1. Select from preset abstract avatars (stored as IDs, not base64)
 * 2. Upload and crop their own image (circular crop like WhatsApp)
 * 
 * Features:
 * - Preset abstract geometric avatars (referenced by ID)
 * - Image upload with circular crop
 * - Drag to reposition
 * - Zoom control
 * - Clean shadcn neutral design
 */

import { useState, useCallback, useRef } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { PRESET_AVATAR_IDS, getAvatarSrc, type PresetAvatarId } from '@event-manager/shared';

// Helper to create image preview from crop
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return base64 string
  return canvas.toDataURL('image/jpeg', 0.95);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

export interface AvatarPickerProps {
  value?: {
    type: 'preset' | 'upload';
    data: string; // preset ID or base64 image
  };
  onChange: (value: { type: 'preset' | 'upload'; data: string }) => void;
  disabled?: boolean;
}

export function AvatarPicker({ value, onChange, disabled }: AvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>(
    value?.type || 'preset'
  );
  const [selectedPreset, setSelectedPreset] = useState<PresetAvatarId>(
    (value?.type === 'preset' ? value.data : PRESET_AVATAR_IDS[0]) as PresetAvatarId
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    value?.type === 'upload' ? value.data : null
  );
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleTabChange = (nextTab: string) => {
    if (nextTab === 'preset' || nextTab === 'upload') {
      setActiveTab(nextTab);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(uploadedImage, croppedAreaPixels);
      onChange({ type: 'upload', data: croppedImage });
      setIsCropping(false);
      setActiveTab('upload');
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handlePresetSelect = (presetId: PresetAvatarId) => {
    setSelectedPreset(presetId);
    onChange({ type: 'preset', data: presetId });
    setActiveTab('preset');
  };

  const handleRemoveUpload = () => {
    setUploadedImage(null);
    setIsCropping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
  <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preset">Preset Avatars</TabsTrigger>
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
        </TabsList>

        <TabsContent value="preset" className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {PRESET_AVATAR_IDS.map((presetId) => (
              <button
                key={presetId}
                type="button"
                onClick={() => handlePresetSelect(presetId)}
                disabled={disabled}
                className={cn(
                  'relative aspect-square rounded-full border-2 transition-all hover:scale-105',
                  selectedPreset === presetId && activeTab === 'preset'
                    ? 'border-neutral-900 ring-2 ring-neutral-900 ring-offset-2'
                    : 'border-neutral-200 hover:border-neutral-400'
                )}
              >
                <PresetAvatar id={presetId} />
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          {isCropping && uploadedImage ? (
            <div className="space-y-4">
              <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
                <Cropper
                  image={uploadedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  min={1}
                  max={3}
                  step={0.1}
                  className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCropConfirm}
                  className="flex-1"
                  disabled={disabled}
                >
                  Confirm Crop
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveUpload}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : uploadedImage && !isCropping ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={uploadedImage} />
                <AvatarFallback>Avatar</AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCropping(true)}
                  disabled={disabled}
                >
                  Re-crop
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveUpload}
                  disabled={disabled}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-neutral-400" />
                  <span className="text-sm text-neutral-600">
                    Click to upload image
                  </span>
                  <span className="text-xs text-neutral-400">
                    PNG, JPG up to 5MB
                  </span>
                </div>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Preset avatar component using shared SVG patterns
function PresetAvatar({ id }: { id: PresetAvatarId }) {
  const src = getAvatarSrc(id, 'preset');
  
  return (
    <img 
      src={src} 
      alt={`Preset avatar ${id}`}
      className="w-full h-full rounded-full object-cover"
    />
  );
}
