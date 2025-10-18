/**
 * Platform Setup Page - Enhanced Version
 * 
 * Admin/Event Office can design the platform layout by placing booths on a grid
 * Requirements: #61 - Platform booth setup with location selection on map
 */

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { trpc } from '@/lib/trpc';
import {
    AlertTriangle,
    Check,
    Edit2,
    Grid3x3,
    Info,
    Loader2,
    Maximize2,
    Minimize2,
    RotateCcw,
    Save,
    Trash2,
    X,
    ZoomIn, ZoomOut
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';
import { toast } from 'react-hot-toast';
import { usePageMeta } from '@/components/layout/AppLayout';

interface Booth {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOccupied: boolean;
  applicationId?: string;
  label?: string;
}

interface PlatformMap {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  booths: Booth[];
  isActive: boolean;
}

export function PlatformSetupPage() {
  const { setPageMeta } = usePageMeta();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [platform, setPlatform] = useState<PlatformMap | null>(null);
  const [selectedBoothSize, setSelectedBoothSize] = useState<'2x2' | '4x4'>('2x2');
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 1200, height: 700 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [hoveredBooth, setHoveredBooth] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedBooth, setDraggedBooth] = useState<string | null>(null);
  const [isDraggingBooth, setIsDraggingBooth] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Platform Setup',
      description: 'Design the campus platform layout by placing vendor booths on the grid',
    });
  }, [setPageMeta]);

  const { data, isLoading, refetch } = trpc.platformMaps.getActivePlatform.useQuery();
  const updatePlatform = trpc.platformMaps.updatePlatform.useMutation({
    onSuccess: () => {
      toast.success('Platform layout saved successfully!');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  useEffect(() => {
    if (data) {
      setPlatform(data as PlatformMap);
      setEditedName((data as PlatformMap).name);
      updateStageSize(isFullscreen);
    }
  }, [data, isFullscreen]);

  useEffect(() => {
    const handleResize = () => {
      updateStageSize(isFullscreen);
    };
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver to watch container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (!isFullscreen) {
        updateStageSize(false);
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [isFullscreen, data]);

  const updateStageSize = (fullscreen: boolean) => {
    if (!data) return;
    if (fullscreen) {
      setStageSize({ 
        width: window.innerWidth - 100, 
        height: window.innerHeight - 250 
      });
    } else {
      // Use container width if available, otherwise use a default
      const containerWidth = containerRef.current?.offsetWidth || 1200;
      const gridHeight = (data as PlatformMap).gridHeight * (data as PlatformMap).cellSize;
      // Subtract padding from container width (32px = 2 * 16px padding)
      setStageSize({ 
        width: containerWidth - 32, 
        height: Math.max(gridHeight, 600)
      });
    }
  };

  const handleStageClick = (e: any) => {
    if (!platform || isDraggingBooth) return;

    // Only handle clicks on the stage background, not on booths
    if (e.target !== e.target.getStage()) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Account for stage position and zoom
    const x = (pointerPosition.x - stage.x()) / zoom;
    const y = (pointerPosition.y - stage.y()) / zoom;
    
    const clickX = Math.floor(x / platform.cellSize);
    const clickY = Math.floor(y / platform.cellSize);

    // Deselect any selected booth
    setSelectedBooth(null);
    const boothWidth = selectedBoothSize === '2x2' ? 2 : 4;
    const boothHeight = selectedBoothSize === '2x2' ? 2 : 4;

    // Check if booth fits in grid
    if (clickX + boothWidth > platform.gridWidth || clickY + boothHeight > platform.gridHeight) {
      toast.error('Booth does not fit - exceeds grid boundaries');
      return;
    }

    // Check for overlap
    const overlaps = platform.booths.some(
      (b) =>
        !(
          clickX + boothWidth <= b.x ||
          clickX >= b.x + b.width ||
          clickY + boothHeight <= b.y ||
          clickY >= b.y + b.height
        )
    );

    if (overlaps) {
      toast.error('Space occupied - overlaps with existing booth');
      return;
    }

    // Add booth
    const newBooth: Booth = {
      id: `booth-${Date.now()}`,
      x: clickX,
      y: clickY,
      width: boothWidth,
      height: boothHeight,
      isOccupied: false,
      label: `B${platform.booths.length + 1}`,
    };

    setPlatform({
      ...platform,
      booths: [...platform.booths, newBooth],
    });
    
    toast.success(`Booth added! ${boothWidth}x${boothHeight} at position (${clickX}, ${clickY})`);
  };

  const handleRemoveBooth = () => {
    if (!platform || !selectedBooth) return;

    const booth = platform.booths.find((b) => b.id === selectedBooth);
    if (booth?.isOccupied) {
      toast.error('Cannot remove occupied booth - assigned to vendor application');
      return;
    }

    setShowRemoveDialog(true);
  };

  const confirmRemoveBooth = () => {
    if (!platform || !selectedBooth) return;

    setPlatform({
      ...platform,
      booths: platform.booths.filter((b) => b.id !== selectedBooth),
    });
    setSelectedBooth(null);
    setShowRemoveDialog(false);
    toast.success('Booth removed successfully');
  };

  const handleClearAll = () => {
    if (!platform) return;
    
    const occupiedCount = platform.booths.filter((b) => b.isOccupied).length;
    if (occupiedCount > 0) {
      toast.error(`Cannot clear platform - ${occupiedCount} booth(s) occupied`);
      return;
    }

    setShowClearDialog(true);
  };

  const confirmClearAll = () => {
    if (!platform) return;

    setPlatform({
      ...platform,
      booths: [],
    });
    setSelectedBooth(null);
    setShowClearDialog(false);
    toast.success('All booths cleared successfully');
  };

  const handleSave = () => {
    if (!platform) return;

    updatePlatform.mutate({
      id: platform.id,
      data: {
        name: editedName,
        booths: platform.booths.map((b) => ({
          id: b.id,
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          isOccupied: b.isOccupied,
          applicationId: b.applicationId,
          label: b.label,
        })),
      },
    });
  };

  const handleSaveName = () => {
    if (!platform) return;
    setPlatform({ ...platform, name: editedName });
    setIsEditingName(false);
    toast.success('Name updated');
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.2, 2);
    setZoom(newZoom);
    toast(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 0.5);
    setZoom(newZoom);
    toast(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  const handleResetZoom = () => {
    setZoom(1);
    toast('Zoom reset to 100%');
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.2, Math.min(5, newScale));

    setZoom(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setStagePos(newPos);
  };

  const handleBoothDragStart = () => {
    setIsDraggingBooth(true);
  };

  const handleBoothDragEnd = (boothId: string, e: any) => {
    if (!platform) return;
    
    setTimeout(() => setIsDraggingBooth(false), 100);
    
    const newX = Math.round(e.target.x() / platform.cellSize);
    const newY = Math.round(e.target.y() / platform.cellSize);

    const booth = platform.booths.find(b => b.id === boothId);
    if (!booth) return;

    // Snap to grid immediately
    e.target.position({
      x: newX * platform.cellSize,
      y: newY * platform.cellSize,
    });

    // Check if booth actually moved
    if (newX === booth.x && newY === booth.y) {
      setDraggedBooth(null);
      return;
    }

    // Check if new position is valid
    if (newX < 0 || newY < 0 || newX >= platform.gridWidth || newY >= platform.gridHeight) {
      e.target.to({ 
        x: booth.x * platform.cellSize, 
        y: booth.y * platform.cellSize, 
        duration: 0.2 
      });
      toast.error('Invalid position');
      setDraggedBooth(null);
      return;
    }

    // Check if booth fits in new position
    if (newX + booth.width > platform.gridWidth || newY + booth.height > platform.gridHeight) {
      e.target.to({ 
        x: booth.x * platform.cellSize, 
        y: booth.y * platform.cellSize, 
        duration: 0.2 
      });
      toast.error('Booth doesn\'t fit in that position');
      setDraggedBooth(null);
      return;
    }

    // Check for overlaps with other booths
    const overlaps = platform.booths.some(b => {
      if (b.id === boothId) return false;
      return !(
        newX + booth.width <= b.x ||
        newX >= b.x + b.width ||
        newY + booth.height <= b.y ||
        newY >= b.y + b.height
      );
    });

    if (overlaps) {
      e.target.to({ 
        x: booth.x * platform.cellSize, 
        y: booth.y * platform.cellSize, 
        duration: 0.2 
      });
      toast.error('Position overlaps with another booth');
      setDraggedBooth(null);
      return;
    }

    // Update booth position in state
    setPlatform({
      ...platform,
      booths: platform.booths.map(b => 
        b.id === boothId ? { ...b, x: newX, y: newY } : b
      ),
    });

    toast.success(`Booth moved to position (${newX}, ${newY})`);
    setDraggedBooth(null);
  };

  const handleBoothClick = (boothId: string, e: any) => {
    if (isDraggingBooth) return;
    e.cancelBubble = true;
    setSelectedBooth(boothId);
    const booth = platform?.booths.find(b => b.id === boothId);
    if (booth) {
      toast(`Selected: ${booth.label || 'Booth'}`);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    updateStageSize(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading platform configuration...</p>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>No Platform Found</AlertTitle>
          <AlertDescription>
            No platform layout exists. Contact system administrator to create the main platform.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedBoothData = platform.booths.find((b) => b.id === selectedBooth);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" />
              Controls
            </CardTitle>
            <CardDescription>Configure booth placement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Platform Name */}
            <div className="space-y-2">
              <Label>Platform Name</Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Platform name"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    setIsEditingName(false);
                    setEditedName(platform.name);
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium flex-1">{platform.name}</p>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Badge variant="secondary" className="w-full justify-center">
                Main Platform
              </Badge>
            </div>

            <Separator />

            {/* Grid Dimensions */}
            <div className="space-y-2">
              <Label>Grid Dimensions</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    min="10"
                    max="100"
                    value={platform.gridWidth}
                    onChange={(e) => setPlatform({...platform, gridWidth: parseInt(e.target.value) || 20})}
                  />
                </div>
                <div>
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    min="10"
                    max="100"
                    value={platform.gridHeight}
                    onChange={(e) => setPlatform({...platform, gridHeight: parseInt(e.target.value) || 15})}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: {platform.gridWidth} × {platform.gridHeight}
              </p>
            </div>

            <Separator />

            {/* Booth Size Selection */}
            <div className="space-y-2">
              <Label>New Booth Size</Label>
              <Select value={selectedBoothSize} onValueChange={(v) => setSelectedBoothSize(v as '2x2' | '4x4')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded" />
                      2x2 Small
                    </div>
                  </SelectItem>
                  <SelectItem value="4x4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-500 rounded" />
                      4x4 Large
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Click on grid to place booth
              </p>
            </div>

            <Separator />

            {/* Zoom Controls */}
            <div className="space-y-2">
              <Label>Zoom Level</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleResetZoom}>
                        {Math.round(zoom * 100)}%
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset zoom</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Selected Booth Info */}
            {selectedBoothData && (
              <div className="space-y-2 p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-primary">Selected Booth</Label>
                  {selectedBoothData.isOccupied && (
                    <Badge variant="secondary">Occupied</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Label:</strong> {selectedBoothData.label || 'N/A'}</p>
                  <p><strong>Size:</strong> {selectedBoothData.width}x{selectedBoothData.height}</p>
                  <p><strong>Position:</strong> ({selectedBoothData.x}, {selectedBoothData.y})</p>
                </div>
                {!selectedBoothData.isOccupied && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleRemoveBooth}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Booth
                  </Button>
                )}
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={updatePlatform.isPending}
              >
                {updatePlatform.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Layout
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearAll}
                disabled={platform.booths.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All Booths
              </Button>
            </div>

            {/* Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Instructions</AlertTitle>
              <AlertDescription className="text-xs space-y-1 mt-2">
                <p>• Click on grid to place booth</p>
                <p>• Drag booths to move them</p>
                <p>• Mouse wheel to zoom in/out</p>
                <p>• Click booth to select it</p>
                <p>• Blue = Available, Gray = Occupied</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Canvas Area */}
        <Card className={isFullscreen ? "fixed inset-4 z-50 lg:col-span-4" : "lg:col-span-3"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5 text-primary" />
                  Platform Grid
                </CardTitle>
                <CardDescription>
                  {platform.gridWidth} × {platform.gridHeight} grid ({platform.booths.length} booths placed)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Zoom: {Math.round(zoom * 100)}%
                </Badge>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              ref={containerRef}
              className="border-2 border-dashed rounded-lg m-4 p-4 bg-gray-50 w-auto overflow-hidden"
            >
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                scaleX={zoom}
                scaleY={zoom}
                x={stagePos.x}
                y={stagePos.y}
                onClick={handleStageClick}
                onWheel={handleWheel}
                className="w-full"
                draggable={true}
                onDragEnd={(e) => {
                  setStagePos({ x: e.target.x(), y: e.target.y() });
                }}
              >
                <Layer>
                  {/* Grid lines */}
                  {Array.from({ length: platform.gridWidth + 1 }).map((_, i) => (
                    <Line
                      key={`v-${i}`}
                      points={[i * platform.cellSize, 0, i * platform.cellSize, platform.gridHeight * platform.cellSize]}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                    />
                  ))}
                  {Array.from({ length: platform.gridHeight + 1 }).map((_, i) => (
                    <Line
                      key={`h-${i}`}
                      points={[0, i * platform.cellSize, platform.gridWidth * platform.cellSize, i * platform.cellSize]}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                    />
                  ))}

                  {/* Booths */}
                  {platform.booths.map((booth) => {
                    const isSelected = booth.id === selectedBooth;
                    const isHovered = booth.id === hoveredBooth;
                    const isDragging = booth.id === draggedBooth;
                    const is4x4 = booth.width === 4 && booth.height === 4;
                    
                    // Colors: Gray for occupied, purple for 4x4, blue for 2x2
                    const fillColor = booth.isOccupied 
                      ? '#94a3b8' 
                      : isSelected 
                        ? (is4x4 ? '#9333ea' : '#3b82f6')
                        : (is4x4 ? '#a855f7' : '#60a5fa');
                    const strokeColor = isSelected 
                      ? (is4x4 ? '#7e22ce' : '#1d4ed8')
                      : (is4x4 ? '#9333ea' : '#2563eb');

                    return (
                      <Group 
                        key={booth.id}
                        draggable={!booth.isOccupied}
                        x={booth.x * platform.cellSize}
                        y={booth.y * platform.cellSize}
                        dragBoundFunc={(pos) => {
                          // Snap to grid while dragging
                          const newX = Math.round(pos.x / platform.cellSize) * platform.cellSize;
                          const newY = Math.round(pos.y / platform.cellSize) * platform.cellSize;
                          return { x: newX, y: newY };
                        }}
                        onDragStart={() => {
                          setDraggedBooth(booth.id);
                          handleBoothDragStart();
                        }}
                        onDragEnd={(e) => handleBoothDragEnd(booth.id, e)}
                        onClick={(e) => handleBoothClick(booth.id, e)}
                        onTap={(e) => handleBoothClick(booth.id, e)}
                        opacity={isDragging ? 0.7 : 1}
                      >
                        <Rect
                          width={booth.width * platform.cellSize}
                          height={booth.height * platform.cellSize}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isSelected ? 3 : 2}
                          shadowBlur={isHovered || isDragging ? 10 : 0}
                          shadowColor="rgba(0,0,0,0.3)"
                          cornerRadius={4}
                          onMouseEnter={() => setHoveredBooth(booth.id)}
                          onMouseLeave={() => setHoveredBooth(null)}
                        />
                        <Text
                          x={0}
                          y={0}
                          width={booth.width * platform.cellSize}
                          height={booth.height * platform.cellSize}
                          text={booth.label || `${booth.width}x${booth.height}`}
                          fontSize={14}
                          fontStyle="bold"
                          fill="#ffffff"
                          align="center"
                          verticalAlign="middle"
                          listening={false}
                        />
                        {booth.isOccupied && (
                          <Text
                            x={0}
                            y={(booth.height * platform.cellSize) - 20}
                            width={booth.width * platform.cellSize}
                            text="OCCUPIED"
                            fontSize={10}
                            fill="#ffffff"
                            align="center"
                            listening={false}
                          />
                        )}
                      </Group>
                    );
                  })}
                </Layer>
              </Stage>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remove Booth Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Remove Booth
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this booth? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveBooth}
            >
              Remove Booth
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Booths Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Clear All Booths
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all booths from the platform? This will remove all unoccupied booths and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearAll}
            >
              Clear All Booths
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
