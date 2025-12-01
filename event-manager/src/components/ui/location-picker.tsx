/**
 * Location Picker Component
 * 
 * A reusable map component for selecting and displaying locations using Leaflet.
 * Supports:
 * - Click to select location
 * - Draggable marker
 * - Preview mode (read-only)
 * - Custom default location (GUC Campus)
 */

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { MapPin, Locate, Search, X } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// GUC Campus coordinates (default)
const GUC_COORDS = { lat: 29.9867, lng: 31.4406 };

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationPickerProps {
  value?: LocationData | null;
  onChange?: (location: LocationData | null) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  showPreview?: boolean;
  height?: string;
}

// Component to handle map clicks
function LocationMarker({ 
  position, 
  onPositionChange,
  readOnly 
}: { 
  position: L.LatLng | null;
  onPositionChange: (pos: L.LatLng) => void;
  readOnly?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onPositionChange(e.latlng);
      }
    },
  });

  return position ? (
    <Marker 
      position={position}
      draggable={!readOnly}
      eventHandlers={{
        dragend: (e) => {
          if (!readOnly) {
            const marker = e.target;
            const pos = marker.getLatLng();
            onPositionChange(pos);
          }
        },
      }}
    />
  ) : null;
}

// Component to recenter map
function MapController({ center }: { center: L.LatLngExpression }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

// Preview map component
function PreviewMap({ location }: { location: LocationData }) {
  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[location.lat, location.lng]} />
    </MapContainer>
  );
}

export function LocationPicker({
  value,
  onChange,
  readOnly = false,
  className,
  placeholder = "Select location on map",
  showPreview = true,
  height,
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(
    value ? new L.LatLng(value.lat, value.lng) : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    value ? [value.lat, value.lng] : [GUC_COORDS.lat, GUC_COORDS.lng]
  );
  const mapRef = useRef<L.Map>(null);

  // Update marker when value changes externally
  useEffect(() => {
    if (value) {
      setMarkerPosition(new L.LatLng(value.lat, value.lng));
      setMapCenter([value.lat, value.lng]);
    } else {
      setMarkerPosition(null);
    }
  }, [value]);

  const handlePositionChange = (pos: L.LatLng) => {
    setMarkerPosition(pos);
  };

  const handleSave = async () => {
    if (markerPosition && onChange) {
      // Try to get address from coordinates
      let address = '';
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${markerPosition.lat}&lon=${markerPosition.lng}`
        );
        const data = await response.json();
        address = data.display_name || '';
      } catch {
        // Ignore geocoding errors
      }
      
      onChange({
        lat: markerPosition.lat,
        lng: markerPosition.lng,
        address,
      });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setMarkerPosition(null);
    if (onChange) {
      onChange(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newPos = new L.LatLng(parseFloat(result.lat), parseFloat(result.lon));
        setMarkerPosition(newPos);
        setMapCenter([newPos.lat, newPos.lng]);
      }
    } catch {
      // Ignore search errors
    }
    setIsSearching(false);
  };

  const handleLocateGUC = () => {
    setMapCenter([GUC_COORDS.lat, GUC_COORDS.lng]);
    setMarkerPosition(new L.LatLng(GUC_COORDS.lat, GUC_COORDS.lng));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Location display/button */}
      <div className="flex items-start gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 justify-start h-auto min-h-[2.5rem] py-2 whitespace-normal text-left"
          onClick={() => !readOnly && setIsOpen(true)}
          disabled={readOnly && !value}
        >
          <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
          {value ? (
            <span className="break-words">
              {value.address || `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
        {value && !readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preview map */}
      {showPreview && value && (
        <div 
          className="rounded-lg overflow-hidden border cursor-pointer"
          style={{ height: height || '128px' }}
          onClick={() => setIsOpen(true)}
        >
          <PreviewMap location={value} />
        </div>
      )}

      {/* Full map dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {readOnly ? 'View Location' : 'Select Location'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search bar */}
            {!readOnly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocateGUC}
                  title="Go to GUC Campus"
                >
                  <Locate className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Map */}
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <MapContainer
                ref={mapRef}
                center={mapCenter}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                  position={markerPosition} 
                  onPositionChange={handlePositionChange}
                  readOnly={readOnly}
                />
                <MapController center={mapCenter} />
              </MapContainer>
            </div>

            {/* Coordinates display */}
            {markerPosition && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Coordinates:</span>{' '}
                {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
              </div>
            )}

            {!readOnly && (
              <p className="text-xs text-muted-foreground">
                Click on the map to select a location, or drag the marker to adjust.
              </p>
            )}
          </div>

          {!readOnly && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!markerPosition}>
                Save Location
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Compact inline map display for previews
export function LocationPreview({ 
  location,
  className,
  onClick,
  height = '96px',
}: { 
  location: LocationData;
  className?: string;
  onClick?: () => void;
  height?: string;
}) {
  return (
    <div 
      className={cn(
        "rounded-lg overflow-hidden border cursor-pointer hover:border-primary transition-colors",
        className
      )}
      style={{ height }}
      onClick={onClick}
    >
      <PreviewMap location={location} />
    </div>
  );
}

// Custom numbered marker icon
function createNumberedIcon(number: string, isOccupied: boolean = false) {
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `
      <div style="
        background-color: ${isOccupied ? '#6b7280' : '#3b82f6'};
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isOccupied ? 'opacity: 0.7;' : ''}
      ">${number}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Booth marker interface
export interface BoothMarkerData {
  id: string;
  label: string;
  lat: number;
  lng: number;
  isOccupied?: boolean;
  isVIP?: boolean;
  size?: string;
}

// Multiple booth markers map component
function BoothMarkersMap({ 
  booths,
  onBoothClick,
}: { 
  booths: BoothMarkerData[];
  onBoothClick?: (booth: BoothMarkerData) => void;
}) {
  // Calculate bounds to fit all markers
  const bounds = booths.length > 0 
    ? L.latLngBounds(booths.map(b => [b.lat, b.lng]))
    : L.latLngBounds([[GUC_COORDS.lat, GUC_COORDS.lng]]);
  
  // Add some padding to bounds
  const paddedBounds = bounds.pad(0.1);
  const center = paddedBounds.getCenter();

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      bounds={paddedBounds}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {booths.map((booth) => (
        <Marker
          key={booth.id}
          position={[booth.lat, booth.lng]}
          icon={createNumberedIcon(booth.label, booth.isOccupied)}
          eventHandlers={{
            click: () => onBoothClick?.(booth),
          }}
        />
      ))}
    </MapContainer>
  );
}

// Dialog component for viewing all booths on map with numbered markers
export interface BoothMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booths: BoothMarkerData[];
  title?: string;
  description?: string;
}

export function BoothMapDialog({
  open,
  onOpenChange,
  booths,
  title = 'All Booth Locations',
  description = 'View all booths on the map. Each marker shows the booth number.',
}: BoothMapDialogProps) {
  const boothsWithCoords = booths.filter(b => b.lat && b.lng);
  const [selectedBooth, setSelectedBooth] = useState<BoothMarkerData | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary" />
              <span>Available: {boothsWithCoords.filter(b => !b.isOccupied).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500" />
              <span>Occupied: {boothsWithCoords.filter(b => b.isOccupied).length}</span>
            </div>
          </div>
          
          {/* Map */}
          <div className="h-[500px] rounded-lg overflow-hidden border">
            {boothsWithCoords.length > 0 ? (
              <BoothMarkersMap 
                booths={boothsWithCoords} 
                onBoothClick={setSelectedBooth}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No booths with map locations yet
              </div>
            )}
          </div>

          {/* Selected booth info */}
          {selectedBooth && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedBooth.label}</span>
                {selectedBooth.isVIP && <span className="text-amber-500">⭐ VIP</span>}
                {selectedBooth.isOccupied ? (
                  <span className="text-xs px-2 py-0.5 bg-gray-500 text-white rounded-full">Occupied</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full">Available</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedBooth.lat.toFixed(6)}, {selectedBooth.lng.toFixed(6)}
                {selectedBooth.size && ` • Size: ${selectedBooth.size}`}
              </p>
            </div>
          )}

          {/* Booths list */}
          <div className="max-h-[150px] overflow-y-auto">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {boothsWithCoords.map(booth => (
                <button
                  key={booth.id}
                  onClick={() => setSelectedBooth(booth)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors",
                    selectedBooth?.id === booth.id 
                      ? "bg-primary/10 border border-primary" 
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div 
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0",
                      booth.isOccupied ? "bg-gray-500" : "bg-primary"
                    )}
                  >
                    {booth.label.replace(/[^\d]/g, '').slice(0, 2) || booth.label.slice(0, 2)}
                  </div>
                  <span className="truncate text-xs">{booth.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
