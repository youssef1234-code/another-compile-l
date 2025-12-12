/**
 * Enhanced Platform Setup Page
 * 
 * Features:
 * - Tool palette (Hand, Pointer, Resizer, Objects, Text)
 * - Landmarks (Entrance, Exit, Special places)
 * - VIP booth designation with visual styling
 * - Improved drag-and-drop functionality
 * - Loading state management (no flash)
 */

import { usePageMeta } from '@/components/layout/page-meta-context';
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
import { LocationPicker, LocationPreview, BoothMapDialog, type LocationData, type BoothMarkerData } from '@/components/ui/location-picker';
import { useTheme } from '@/hooks/useTheme';
import { formatValidationErrors } from '@/lib/format-errors';
import { trpc } from '@/lib/trpc';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  AlertTriangle,
  Circle,
  DoorOpen,
  Grid3x3,
  Hand,
  Info,
  Loader2,
  LogOut,
  MapPin,
  Maximize2,
  Minimize2,
  MousePointer,
  Redo,
  RotateCcw,
  Save,
  Square,
  Star,
  Trash2,
  Type,
  Undo,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Group, Circle as KonvaCircle, Text as KonvaText, Layer, Line, Rect, Stage } from 'react-konva';

type ToolType = 'hand' | 'pointer' | 'booth' | 'landmark' | 'text' | 'object';
type LandmarkType = 'ENTRANCE' | 'EXIT' | 'SPECIAL_PLACE';
type ObjectType = 'circle' | 'square';

interface BoothCoordinates {
  lat: number;
  lng: number;
}

interface Booth {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOccupied: boolean;
  applicationId?: string;
  label?: string;
  isVIP?: boolean;
  coordinates?: BoothCoordinates; // Real-world map coordinates
}

interface Landmark {
  id: string;
  x: number;
  y: number;
  type: LandmarkType;
  label: string;
  rotation?: number; // Rotation in degrees (0, 90, 180, 270)
}

interface CustomText {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

interface CustomObject {
  id: string;
  x: number;
  y: number;
  type: ObjectType;
  size: number;
  color: string;
}

interface PlatformMap {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  booths: Booth[];
  landmarks?: Landmark[];
  customTexts?: CustomText[];
  customObjects?: CustomObject[];
  isActive: boolean;
}

interface HistoryState {
  booths: Booth[];
  landmarks: Landmark[];
  texts: CustomText[];
  objects: CustomObject[];
}

export function PlatformSetupPage() {
  const { setPageMeta } = usePageMeta();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  // Platform state
  const [platform, setPlatform] = useState<PlatformMap | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);
  
  // Tool state
  const [activeTool, setActiveTool] = useState<ToolType>('pointer');
  const [selectedBoothSize, setSelectedBoothSize] = useState<'2x2' | '4x4'>('2x2');
  const [selectedLandmarkType, setSelectedLandmarkType] = useState<LandmarkType>('ENTRANCE');
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectType>('circle');
  
  // Selection state
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 1200, height: 700 });
  const [hoveredBooth, setHoveredBooth] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Custom elements
  const [customTexts, setCustomTexts] = useState<CustomText[]>([]);
  const [customObjects, setCustomObjects] = useState<CustomObject[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  
  // Edit state
  const [editedName, setEditedName] = useState('');
  
  // Dialog state
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showAddTextDialog, setShowAddTextDialog] = useState(false);
  const [showAddLandmarkDialog, setShowAddLandmarkDialog] = useState(false);
  const [showAllBoothsMapDialog, setShowAllBoothsMapDialog] = useState(false);
  const [newTextValue, setNewTextValue] = useState('');
  const [newTextPosition, setNewTextPosition] = useState({ x: 0, y: 0 });
  const [newLandmarkLabel, setNewLandmarkLabel] = useState('');
  const [newLandmarkPosition, setNewLandmarkPosition] = useState({ x: 0, y: 0 });
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Theme-aware colors
  const isDark = resolvedTheme === 'dark';
  const colors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    occupied: isDark ? '#64748b' : '#94a3b8',
    booth4x4: isDark ? '#a855f7' : '#c084fc',
    booth4x4Selected: isDark ? '#9333ea' : '#a855f7',
    booth4x4Stroke: isDark ? '#7e22ce' : '#9333ea',
    booth2x2: isDark ? '#60a5fa' : '#93c5fd',
    booth2x2Selected: isDark ? '#3b82f6' : '#60a5fa',
    booth2x2Stroke: isDark ? '#2563eb' : '#3b82f6',
    vip: isDark ? '#fbbf24' : '#fcd34d',
    vipStroke: isDark ? '#f59e0b' : '#f59e0b',
    entrance: isDark ? '#34d399' : '#6ee7b7',
    exit: isDark ? '#f87171' : '#fca5a5',
    special: isDark ? '#60a5fa' : '#93c5fd',
    text: isDark ? '#ffffff' : '#000000',
    landmarkText: isDark ? '#1f2937' : '#ffffff',
  };

  useEffect(() => {
    setPageMeta({
      title: 'Platform Setup',
      description: 'Design the campus platform layout with advanced tools',
    });
  }, [setPageMeta]);

  const utils = trpc.useUtils();
  
  const { data, isLoading } = trpc.platformMaps.getActivePlatform.useQuery(undefined, {
    staleTime: 5000, // Prevent flash by caching for 5 seconds
    refetchOnMount: 'always', // Always refetch when component mounts
  });
  
  const updatePlatform = trpc.platformMaps.updatePlatform.useMutation({
    onSuccess: () => {
      toast.success('Platform layout saved successfully!');
      // Invalidate cache and refetch to get latest data
      utils.platformMaps.getActivePlatform.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const updateStageSize = useCallback((fullscreen: boolean) => {
    if (!data) return;
    if (fullscreen) {
      setStageSize({
        width: window.innerWidth - 100,
        height: window.innerHeight - 250,
      });
    } else {
      const containerWidth = containerRef.current?.offsetWidth || 1200;
      const gridHeight = (data as PlatformMap).gridHeight * (data as PlatformMap).cellSize;
      setStageSize({
        width: containerWidth - 32,
        height: Math.max(gridHeight, 600),
      });
    }
  }, [data]);

  // Initialize platform data once loaded or when it changes
  useEffect(() => {
    if (data && !isLoading) {
      const platformData = data as PlatformMap;
      
      // Reinitialize if this is new data (different ID or first load)
      if (!isInitialized || lastLoadedId !== platformData.id) {
        setPlatform(platformData);
        setEditedName(platformData.name);
        setLandmarks(platformData.landmarks || []);
        setCustomTexts(platformData.customTexts || []);
        setCustomObjects(platformData.customObjects || []);
        updateStageSize(isFullscreen);
        setIsInitialized(true);
        setLastLoadedId(platformData.id);
        
        // Initialize history
        const initialState: HistoryState = {
          booths: platformData.booths,
          landmarks: platformData.landmarks || [],
          texts: platformData.customTexts || [],
          objects: platformData.customObjects || [],
        };
        setHistory([initialState]);
        setHistoryIndex(0);
      }
    }
  }, [data, isLoading, isInitialized, lastLoadedId, isFullscreen, updateStageSize]);

  useEffect(() => {
    const handleResize = () => {
      updateStageSize(isFullscreen);
    };
    window.addEventListener('resize', handleResize);

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
  }, [isFullscreen, updateStageSize]);

  // Save to history
  const saveToHistory = useCallback(() => {
    if (!platform) return;
    
    const newState: HistoryState = {
      booths: [...platform.booths],
      landmarks: [...landmarks],
      texts: [...customTexts],
      objects: [...customObjects],
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [platform, landmarks, customTexts, customObjects, history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      setPlatform(prev => prev ? { ...prev, booths: prevState.booths } : null);
      setLandmarks(prevState.landmarks);
      setCustomTexts(prevState.texts);
      setCustomObjects(prevState.objects);
      setHistoryIndex(prevIndex);
      toast('Undo');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setPlatform(prev => prev ? { ...prev, booths: nextState.booths } : null);
      setLandmarks(nextState.landmarks);
      setCustomTexts(nextState.texts);
      setCustomObjects(nextState.objects);
      setHistoryIndex(nextIndex);
      toast('Redo');
    }
  };

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (!platform || isDragging) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const x = (pointerPosition.x - stagePos.x) / zoom;
    const y = (pointerPosition.y - stagePos.y) / zoom;
    const clickX = Math.floor(x / platform.cellSize);
    const clickY = Math.floor(y / platform.cellSize);

    // Check if clicked on background (not on any shape)
    const clickedOnEmpty = e.target === stage || e.target.getClassName() === 'Rect' && e.target.attrs.fill === (isDark ? '#1f2937' : '#ffffff');

    if (clickedOnEmpty) {
      // Clear selections when clicking empty space with pointer tool
      if (activeTool === 'pointer') {
        setSelectedBooth(null);
        setSelectedLandmark(null);
        setSelectedText(null);
        setSelectedObject(null);
        return;
      }

      if (activeTool === 'booth') {
        addBooth(clickX, clickY);
      } else if (activeTool === 'landmark') {
        setNewLandmarkPosition({ x: clickX, y: clickY });
        setShowAddLandmarkDialog(true);
      } else if (activeTool === 'text') {
        setNewTextPosition({ x: clickX * platform.cellSize, y: clickY * platform.cellSize });
        setShowAddTextDialog(true);
      } else if (activeTool === 'object') {
        addObject(clickX * platform.cellSize, clickY * platform.cellSize);
      }
    }
  };

  const addBooth = (clickX: number, clickY: number) => {
    if (!platform) return;

    // Validate coordinates are within grid
    if (clickX < 0 || clickY < 0 || clickX >= platform.gridWidth || clickY >= platform.gridHeight) {
      toast.error('Click within the grid to add booth');
      return;
    }

    const boothWidth = selectedBoothSize === '2x2' ? 2 : 4;
    const boothHeight = selectedBoothSize === '2x2' ? 2 : 4;

    if (clickX + boothWidth > platform.gridWidth || clickY + boothHeight > platform.gridHeight) {
      toast.error('Booth does not fit - exceeds grid boundaries');
      return;
    }

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

    const newBooth: Booth = {
      id: `booth-${Date.now()}-${Math.random()}`,
      x: clickX,
      y: clickY,
      width: boothWidth,
      height: boothHeight,
      isOccupied: false,
      label: `B${platform.booths.length + 1}`,
    };

    setPlatform((prev) => prev ? {
      ...prev,
      booths: [...prev.booths, newBooth],
    } : null);
    
    setTimeout(() => saveToHistory(), 50);
    toast.success(`${boothWidth}x${boothHeight} booth added at (${clickX}, ${clickY})`);
  };

  const addLandmark = () => {
    if (!newLandmarkLabel.trim()) {
      toast.error('Please enter a landmark label');
      return;
    }

    const newLandmark: Landmark = {
      id: `landmark-${Date.now()}-${Math.random()}`,
      x: newLandmarkPosition.x,
      y: newLandmarkPosition.y,
      type: selectedLandmarkType,
      label: newLandmarkLabel.trim(),
    };

    setLandmarks((prev) => [...prev, newLandmark]);
    setShowAddLandmarkDialog(false);
    setNewLandmarkLabel('');
    setTimeout(() => saveToHistory(), 50);
    toast.success(`${selectedLandmarkType.replace('_', ' ')} added`);
  };

  const addText = () => {
    if (!newTextValue.trim()) {
      toast.error('Please enter text');
      return;
    }

    const newText: CustomText = {
      id: `text-${Date.now()}-${Math.random()}`,
      x: newTextPosition.x,
      y: newTextPosition.y,
      text: newTextValue.trim(),
      fontSize: 16,
    };

    setCustomTexts((prev) => [...prev, newText]);
    setShowAddTextDialog(false);
    setNewTextValue('');
    setTimeout(() => saveToHistory(), 50);
    toast.success('Text added');
  };

  const addObject = (x: number, y: number) => {
    const newObject: CustomObject = {
      id: `object-${Date.now()}-${Math.random()}`,
      x,
      y,
      type: selectedObjectType,
      size: 60,
      color: selectedObjectType === 'circle' ? '#3b82f6' : '#8b5cf6',
    };

    setCustomObjects((prev) => [...prev, newObject]);
    setTimeout(() => saveToHistory(), 50);
    toast.success(`${selectedObjectType === 'circle' ? 'Circle' : 'Square'} added`);
  };

  const handleRemoveBooth = () => {
    if (!platform || !selectedBooth) return;

    const booth = platform.booths.find((b) => b.id === selectedBooth);
    if (booth?.isOccupied) {
      toast.error('Cannot remove occupied booth');
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
    saveToHistory();
    toast.success('Booth removed');
  };

  const handleRemoveLandmark = (id: string) => {
    setLandmarks(landmarks.filter(l => l.id !== id));
    setSelectedLandmark(null);
    saveToHistory();
    toast.success('Landmark removed');
  };

  const handleRemoveText = (id: string) => {
    setCustomTexts(customTexts.filter(t => t.id !== id));
    setSelectedText(null);
    saveToHistory();
    toast.success('Text removed');
  };

  const handleRemoveObject = (id: string) => {
    setCustomObjects(customObjects.filter(o => o.id !== id));
    setSelectedObject(null);
    saveToHistory();
    toast.success('Object removed');
  };

  const handleClearAll = () => {
    if (!platform) return;

    const occupiedCount = platform.booths.filter((b) => b.isOccupied).length;
    if (occupiedCount > 0) {
      toast.error(`Cannot clear - ${occupiedCount} booth(s) occupied`);
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
    setLandmarks([]);
    setCustomTexts([]);
    setCustomObjects([]);
    setSelectedBooth(null);
    setSelectedLandmark(null);
    setSelectedText(null);
    setSelectedObject(null);
    setShowClearDialog(false);
    saveToHistory();
    toast.success('Platform cleared');
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
          isVIP: b.isVIP || false,
          coordinates: b.coordinates, // Preserve map coordinates
        })),
        landmarks: landmarks.map((l) => ({
          id: l.id,
          x: l.x,
          y: l.y,
          type: l.type,
          label: l.label,
          rotation: l.rotation,
        })),
        customTexts: customTexts.map((t) => ({
          id: t.id,
          x: t.x,
          y: t.y,
          text: t.text,
          fontSize: t.fontSize,
        })),
        customObjects: customObjects.map((o) => ({
          id: o.id,
          x: o.x,
          y: o.y,
          type: o.type,
          size: o.size,
          color: o.color,
        })),
      },
    });
  };

  const handleBoothClick = (boothId: string, e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    if (activeTool === 'pointer') {
      if (isDragging) return;
      setSelectedBooth(boothId);
      setSelectedLandmark(null);
      setSelectedText(null);
      setSelectedObject(null);
    }
  };

  const handleBoothDragEnd = (boothId: string, e: KonvaEventObject<DragEvent>) => {
    if (!platform) return;

    setTimeout(() => setIsDragging(false), 100);

    const newX = Math.round(e.target.x() / platform.cellSize);
    const newY = Math.round(e.target.y() / platform.cellSize);

    const booth = platform.booths.find(b => b.id === boothId);
    if (!booth) return;

    e.target.position({
      x: newX * platform.cellSize,
      y: newY * platform.cellSize,
    });

    if (newX === booth.x && newY === booth.y) return;

    if (newX < 0 || newY < 0 || newX >= platform.gridWidth || newY >= platform.gridHeight) {
      e.target.to({
        x: booth.x * platform.cellSize,
        y: booth.y * platform.cellSize,
        duration: 0.2,
      });
      toast.error('Invalid position');
      return;
    }

    if (newX + booth.width > platform.gridWidth || newY + booth.height > platform.gridHeight) {
      e.target.to({
        x: booth.x * platform.cellSize,
        y: booth.y * platform.cellSize,
        duration: 0.2,
      });
      toast.error("Booth doesn't fit");
      return;
    }

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
        duration: 0.2,
      });
      toast.error('Position overlaps');
      return;
    }

    setPlatform({
      ...platform,
      booths: platform.booths.map(b =>
        b.id === boothId ? { ...b, x: newX, y: newY } : b
      ),
    });

    saveToHistory();
    toast.success(`Booth moved to (${newX}, ${newY})`);
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

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

  const renderLandmark = (landmark: Landmark) => {
    const isSelected = landmark.id === selectedLandmark;
    const color = landmark.type === 'ENTRANCE' ? colors.entrance :
                  landmark.type === 'EXIT' ? colors.exit : colors.special;
    const icon = landmark.type === 'ENTRANCE' ? '⇩' :
                 landmark.type === 'EXIT' ? '⇧' : '★';
    const rotation = landmark.rotation || 0;

    return (
      <Group
        key={landmark.id}
        x={landmark.x * platform!.cellSize}
        y={landmark.y * platform!.cellSize}
        draggable={activeTool === 'pointer'}
        onDragEnd={(e) => {
          const newX = Math.round(e.target.x() / platform!.cellSize);
          const newY = Math.round(e.target.y() / platform!.cellSize);
          setLandmarks(landmarks.map(l =>
            l.id === landmark.id ? { ...l, x: newX, y: newY } : l
          ));
          saveToHistory();
        }}
        onClick={(e) => {
          if (activeTool === 'pointer') {
            e.cancelBubble = true;
            setSelectedLandmark(landmark.id);
            setSelectedBooth(null);
            setSelectedText(null);
            setSelectedObject(null);
          }
        }}
      >
        <KonvaCircle
          radius={platform!.cellSize / 2}
          fill={color}
          stroke={isSelected ? '#000000' : color}
          strokeWidth={isSelected ? 3 : 1}
          shadowBlur={isSelected ? 10 : 5}
          shadowColor="rgba(0,0,0,0.3)"
        />
        <Group
          x={0}
          y={0}
          rotation={rotation}
        >
          <KonvaText
            x={-platform!.cellSize / 2}
            y={-platform!.cellSize / 4}
            width={platform!.cellSize}
            text={icon}
            fontSize={24}
            fill={colors.landmarkText}
            align="center"
            verticalAlign="middle"
          />
        </Group>
        <KonvaText
          x={-platform!.cellSize}
          y={platform!.cellSize / 2 + 5}
          width={platform!.cellSize * 2}
          text={landmark.label}
          fontSize={12}
          fill={colors.text}
          align="center"
        />
      </Group>
    );
  };

  if (isLoading || !isInitialized) {
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
            No platform layout exists. Contact system administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedBoothData = platform.booths.find((b) => b.id === selectedBooth);
  const selectedLandmarkData = landmarks.find((l) => l.id === selectedLandmark);

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
            <CardDescription>Platform design tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tool Palette */}
            <div className="space-y-2">
              <Label>Tool Palette</Label>
              <div className="grid grid-cols-3 gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTool === 'hand' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTool('hand')}
                      >
                        <Hand className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hand (Pan)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTool === 'pointer' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTool('pointer')}
                      >
                        <MousePointer className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Pointer (Select)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTool === 'booth' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTool('booth')}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Booth</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTool === 'landmark' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTool('landmark')}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Landmark</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTool === 'text' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTool('text')}
                      >
                        <Type className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Text</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTool === 'object' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTool('object')}
                      >
                        <Circle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Object</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <Separator />

            {/* Tool-specific options */}
            {activeTool === 'booth' && (
              <div className="space-y-2">
                <Label>Booth Size</Label>
                <Select value={selectedBoothSize} onValueChange={(v) => setSelectedBoothSize(v as '2x2' | '4x4')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2x2">2x2 Small</SelectItem>
                    <SelectItem value="4x4">4x4 Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeTool === 'landmark' && (
              <div className="space-y-2">
                <Label>Landmark Type</Label>
                <Select value={selectedLandmarkType} onValueChange={(v) => setSelectedLandmarkType(v as LandmarkType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRANCE">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-green-500" />
                        Entrance
                      </div>
                    </SelectItem>
                    <SelectItem value="EXIT">
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-red-500" />
                        Exit
                      </div>
                    </SelectItem>
                    <SelectItem value="SPECIAL_PLACE">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-blue-500" />
                        Special Place
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeTool === 'object' && (
              <div className="space-y-2">
                <Label>Object Type</Label>
                <Select value={selectedObjectType} onValueChange={(v) => setSelectedObjectType(v as ObjectType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* History Controls */}
            <div className="space-y-2">
              <Label>History</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo className="h-4 w-4 mr-1" />
                  Redo
                </Button>
              </div>
            </div>

            <Separator />

            {/* Zoom Controls */}
            <div className="space-y-2">
              <Label>Zoom</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }}>
                  {Math.round(zoom * 100)}%
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setZoom(Math.min(2, zoom + 0.2))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Selected Item Info */}
            {selectedBoothData && (
              <div className="space-y-2 p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-primary">Selected Booth</Label>
                  <div className="flex items-center gap-2">
                    {selectedBoothData.isVIP && (
                      <Badge className="bg-amber-500 text-amber-950">⭐ VIP</Badge>
                    )}
                    {selectedBoothData.isOccupied && (
                      <Badge variant="secondary">Occupied</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Label:</strong> {selectedBoothData.label || 'N/A'}</p>
                  <p><strong>Size:</strong> {selectedBoothData.width}x{selectedBoothData.height}</p>
                  <p><strong>Position:</strong> ({selectedBoothData.x}, {selectedBoothData.y})</p>
                  {selectedBoothData.coordinates && (
                    <p><strong>Map Location:</strong> Set ✓</p>
                  )}
                </div>

                {/* Map Location Picker for booth */}
                <div className="space-y-2 mt-3">
                  <Label className="text-xs text-muted-foreground">Map Location</Label>
                  {selectedBoothData.coordinates ? (
                    <div className="space-y-2">
                      <LocationPreview
                        location={{
                          lat: selectedBoothData.coordinates.lat,
                          lng: selectedBoothData.coordinates.lng,
                          address: selectedBoothData.label || `Booth at (${selectedBoothData.x}, ${selectedBoothData.y})`,
                        }}
                        height="120px"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setPlatform({
                            ...platform,
                            booths: platform.booths.map(b =>
                              b.id === selectedBooth ? { ...b, coordinates: undefined } : b
                            ),
                          });
                          saveToHistory();
                          toast.success('Location removed');
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Location
                      </Button>
                    </div>
                  ) : (
                    <LocationPicker
                      value={undefined}
                      onChange={(location: LocationData | null) => {
                        if (location) {
                          setPlatform({
                            ...platform,
                            booths: platform.booths.map(b =>
                              b.id === selectedBooth ? { ...b, coordinates: { lat: location.lat, lng: location.lng } } : b
                            ),
                          });
                          saveToHistory();
                          toast.success('Location set for booth');
                        }
                      }}
                      height="150px"
                    />
                  )}
                </div>

                {!selectedBoothData.isOccupied && (
                  <div className="space-y-2 mt-2">
                    <Button
                      variant={selectedBoothData.isVIP ? 'secondary' : 'default'}
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setPlatform({
                          ...platform,
                          booths: platform.booths.map(b =>
                            b.id === selectedBooth ? { ...b, isVIP: !b.isVIP } : b
                          ),
                        });
                        saveToHistory();
                        toast.success(selectedBoothData.isVIP ? 'VIP removed' : 'Marked as VIP');
                      }}
                    >
                      {selectedBoothData.isVIP ? '✕ Remove VIP' : '⭐ Mark VIP'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={handleRemoveBooth}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedLandmarkData && (
              <div className="space-y-2 p-3 bg-primary/10 rounded-lg">
                <Label className="text-primary">Selected Landmark</Label>
                <div className="space-y-1 text-sm">
                  <p><strong>Type:</strong> {selectedLandmarkData.type}</p>
                  <p><strong>Label:</strong> {selectedLandmarkData.label}</p>
                  <p><strong>Position:</strong> ({selectedLandmarkData.x}, {selectedLandmarkData.y})</p>
                  {(selectedLandmarkData.type === 'ENTRANCE' || selectedLandmarkData.type === 'EXIT') && (
                    <p><strong>Rotation:</strong> {selectedLandmarkData.rotation || 0}°</p>
                  )}
                </div>
                {(selectedLandmarkData.type === 'ENTRANCE' || selectedLandmarkData.type === 'EXIT') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const currentRotation = selectedLandmarkData.rotation || 0;
                      const newRotation = (currentRotation + 90) % 360;
                      setLandmarks(landmarks.map(l =>
                        l.id === selectedLandmark ? { ...l, rotation: newRotation } : l
                      ));
                      saveToHistory();
                      toast.success(`Rotated to ${newRotation}°`);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rotate 90°
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleRemoveLandmark(selectedLandmarkData.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}

            {selectedText && (
              <div className="space-y-2 p-3 bg-primary/10 rounded-lg">
                <Label className="text-primary">Selected Text</Label>
                <div className="space-y-1 text-sm">
                  <p><strong>Content:</strong> {customTexts.find(t => t.id === selectedText)?.text}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleRemoveText(selectedText)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}

            {selectedObject && (
              <div className="space-y-2 p-3 bg-primary/10 rounded-lg">
                <Label className="text-primary">Selected Object</Label>
                <div className="space-y-1 text-sm">
                  <p><strong>Type:</strong> {customObjects.find(o => o.id === selectedObject)?.type}</p>
                  <p><strong>Size:</strong> {customObjects.find(o => o.id === selectedObject)?.size}px</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleRemoveObject(selectedObject)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
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

              {/* View All Booths on Map */}
              {platform.booths.some(b => b.coordinates) && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowAllBoothsMapDialog(true)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  View All on Map
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearAll}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>

            {/* Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Quick Guide</AlertTitle>
              <AlertDescription className="text-xs space-y-1 mt-2">
                <p>• Select tool from palette</p>
                <p>• Click to place items</p>
                <p>• Drag to move (Pointer tool)</p>
                <p>• Mouse wheel to zoom</p>
                <p>• ⭐ = VIP booth</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Canvas Area */}
        <Card className={isFullscreen ? 'fixed inset-4 z-50 lg:col-span-4' : 'lg:col-span-3'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5 text-primary" />
                  Platform Grid
                </CardTitle>
                <CardDescription>
                  {platform.gridWidth} × {platform.gridHeight} • {platform.booths.length} booths • {landmarks.length} landmarks
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Tool: {activeTool}</Badge>
                <Badge variant="outline">Zoom: {Math.round(zoom * 100)}%</Badge>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={containerRef}
              className="border-2 border-dashed rounded-lg m-4 p-4 bg-gray-50 dark:bg-gray-900 overflow-hidden"
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
                draggable={activeTool === 'hand'}
                onDragMove={(e) => {
                  if (activeTool === 'hand') {
                    setStagePos({ x: e.target.x(), y: e.target.y() });
                  }
                }}
                onDragEnd={(e) => {
                  if (activeTool === 'hand') {
                    setStagePos({ x: e.target.x(), y: e.target.y() });
                  }
                }}
              >
                <Layer>
                  {/* Background */}
                  <Rect
                    x={0}
                    y={0}
                    width={platform.gridWidth * platform.cellSize}
                    height={platform.gridHeight * platform.cellSize}
                    fill={isDark ? '#1f2937' : '#ffffff'}
                    listening={true}
                  />

                  {/* Grid lines */}
                  {Array.from({ length: platform.gridWidth + 1 }).map((_, i) => (
                    <Line
                      key={`v-${i}`}
                      points={[
                        i * platform.cellSize,
                        0,
                        i * platform.cellSize,
                        platform.gridHeight * platform.cellSize,
                      ]}
                      stroke={colors.grid}
                      strokeWidth={1}
                    />
                  ))}
                  {Array.from({ length: platform.gridHeight + 1 }).map((_, i) => (
                    <Line
                      key={`h-${i}`}
                      points={[
                        0,
                        i * platform.cellSize,
                        platform.gridWidth * platform.cellSize,
                        i * platform.cellSize,
                      ]}
                      stroke={colors.grid}
                      strokeWidth={1}
                    />
                  ))}

                  {/* Booths */}
                  {platform.booths.map((booth) => {
                    const isSelected = booth.id === selectedBooth;
                    const isHovered = booth.id === hoveredBooth;
                    const is4x4 = booth.width === 4;
                    const isVIP = booth.isVIP || false;

                    const fillColor = isVIP
                      ? colors.vip
                      : booth.isOccupied
                      ? colors.occupied
                      : isSelected
                      ? (is4x4 ? colors.booth4x4Selected : colors.booth2x2Selected)
                      : (is4x4 ? colors.booth4x4 : colors.booth2x2);
                    
                    const strokeColor = isVIP
                      ? colors.vipStroke
                      : isSelected
                      ? (is4x4 ? colors.booth4x4Stroke : colors.booth2x2Stroke)
                      : (is4x4 ? colors.booth4x4Selected : colors.booth2x2Selected);

                    return (
                      <Group
                        key={booth.id}
                        draggable={!booth.isOccupied && activeTool === 'pointer'}
                        x={booth.x * platform.cellSize}
                        y={booth.y * platform.cellSize}
                        dragBoundFunc={(pos) => {
                          const newX = Math.round(pos.x / platform.cellSize) * platform.cellSize;
                          const newY = Math.round(pos.y / platform.cellSize) * platform.cellSize;
                          return { x: newX, y: newY };
                        }}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={(e) => handleBoothDragEnd(booth.id, e)}
                        onClick={(e) => handleBoothClick(booth.id, e)}
                        onTap={(e) => handleBoothClick(booth.id, e as KonvaEventObject<MouseEvent>)}
                      >
                        <Rect
                          width={booth.width * platform.cellSize}
                          height={booth.height * platform.cellSize}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isVIP ? 4 : (isSelected ? 3 : 2)}
                          shadowBlur={isHovered ? 10 : (isVIP ? 8 : 0)}
                          shadowColor={isVIP ? 'rgba(245, 158, 11, 0.5)' : 'rgba(0,0,0,0.3)'}
                          cornerRadius={4}
                          onMouseEnter={() => setHoveredBooth(booth.id)}
                          onMouseLeave={() => setHoveredBooth(null)}
                        />
                        <KonvaText
                          x={0}
                          y={isVIP ? 5 : 0}
                          width={booth.width * platform.cellSize}
                          height={booth.height * platform.cellSize}
                          text={booth.label || `${booth.width}x${booth.height}`}
                          fontSize={14}
                          fontStyle="bold"
                          fill={isVIP ? '#78350f' : colors.text}
                          align="center"
                          verticalAlign={isVIP ? 'top' : 'middle'}
                        />
                        {isVIP && (
                          <KonvaText
                            x={0}
                            y={(booth.height * platform.cellSize) / 2}
                            width={booth.width * platform.cellSize}
                            text="⭐ VIP"
                            fontSize={12}
                            fontStyle="bold"
                            fill="#78350f"
                            align="center"
                            verticalAlign="middle"
                          />
                        )}
                        {booth.isOccupied && (
                          <KonvaText
                            x={0}
                            y={(booth.height * platform.cellSize) - 20}
                            width={booth.width * platform.cellSize}
                            text="OCCUPIED"
                            fontSize={10}
                            fill={colors.text}
                            align="center"
                          />
                        )}
                      </Group>
                    );
                  })}

                  {/* Landmarks */}
                  {landmarks.map(renderLandmark)}

                  {/* Custom Texts */}
                  {customTexts.map((text) => (
                    <KonvaText
                      key={text.id}
                      x={text.x}
                      y={text.y}
                      text={text.text}
                      fontSize={text.fontSize}
                      fill={colors.text}
                      draggable={activeTool === 'pointer'}
                      onClick={(e) => {
                        if (activeTool === 'pointer') {
                          e.cancelBubble = true;
                          setSelectedText(text.id);
                          setSelectedBooth(null);
                          setSelectedLandmark(null);
                          setSelectedObject(null);
                        }
                      }}
                      onDragEnd={(e) => {
                        setCustomTexts(customTexts.map(t =>
                          t.id === text.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                        ));
                        saveToHistory();
                      }}
                    />
                  ))}

                  {/* Custom Objects */}
                  {customObjects.map((obj) => {
                    const isSelected = obj.id === selectedObject;
                    
                    if (obj.type === 'circle') {
                      return (
                        <KonvaCircle
                          key={obj.id}
                          x={obj.x}
                          y={obj.y}
                          radius={obj.size / 2}
                          fill={obj.color}
                          stroke={isSelected ? '#000000' : obj.color}
                          strokeWidth={isSelected ? 3 : 1}
                          shadowBlur={isSelected ? 10 : 5}
                          shadowColor="rgba(0,0,0,0.3)"
                          draggable={activeTool === 'pointer'}
                          onClick={(e) => {
                            if (activeTool === 'pointer') {
                              e.cancelBubble = true;
                              setSelectedObject(obj.id);
                              setSelectedBooth(null);
                              setSelectedLandmark(null);
                              setSelectedText(null);
                            }
                          }}
                          onDragEnd={(e) => {
                            setCustomObjects(customObjects.map(o =>
                              o.id === obj.id ? { ...o, x: e.target.x(), y: e.target.y() } : o
                            ));
                            saveToHistory();
                          }}
                        />
                      );
                    } else {
                      return (
                        <Rect
                          key={obj.id}
                          x={obj.x}
                          y={obj.y}
                          width={obj.size}
                          height={obj.size}
                          fill={obj.color}
                          stroke={isSelected ? '#000000' : obj.color}
                          strokeWidth={isSelected ? 3 : 1}
                          shadowBlur={isSelected ? 10 : 5}
                          shadowColor="rgba(0,0,0,0.3)"
                          cornerRadius={4}
                          draggable={activeTool === 'pointer'}
                          onClick={(e) => {
                            if (activeTool === 'pointer') {
                              e.cancelBubble = true;
                              setSelectedObject(obj.id);
                              setSelectedBooth(null);
                              setSelectedLandmark(null);
                              setSelectedText(null);
                            }
                          }}
                          onDragEnd={(e) => {
                            setCustomObjects(customObjects.map(o =>
                              o.id === obj.id ? { ...o, x: e.target.x(), y: e.target.y() } : o
                            ));
                            saveToHistory();
                          }}
                        />
                      );
                    }
                  })}
                </Layer>
              </Stage>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Remove Booth
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this booth?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveBooth}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Clear Platform
            </DialogTitle>
            <DialogDescription>
              This will remove all booths, landmarks, and custom elements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddLandmarkDialog} onOpenChange={setShowAddLandmarkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Landmark</DialogTitle>
            <DialogDescription>
              Add a {selectedLandmarkType.toLowerCase().replace('_', ' ')} marker
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                placeholder="e.g., Main Entrance, Food Court"
                value={newLandmarkLabel}
                onChange={(e) => setNewLandmarkLabel(e.target.value)}
                autoFocus
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Position: ({newLandmarkPosition.x}, {newLandmarkPosition.y})
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddLandmarkDialog(false);
              setNewLandmarkLabel('');
            }}>
              Cancel
            </Button>
            <Button onClick={addLandmark}>
              Add Landmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddTextDialog} onOpenChange={setShowAddTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text</DialogTitle>
            <DialogDescription>
              Add custom text to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Text</Label>
              <Input
                placeholder="Enter text..."
                value={newTextValue}
                onChange={(e) => setNewTextValue(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddTextDialog(false);
              setNewTextValue('');
            }}>
              Cancel
            </Button>
            <Button onClick={addText}>
              Add Text
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Booths on Map Dialog with Numbered Markers */}
      <BoothMapDialog
        open={showAllBoothsMapDialog}
        onOpenChange={setShowAllBoothsMapDialog}
        booths={platform.booths
          .filter(b => b.coordinates)
          .map(b => ({
            id: b.id,
            label: b.label || `B${b.x}-${b.y}`,
            lat: b.coordinates!.lat,
            lng: b.coordinates!.lng,
            isOccupied: b.isOccupied,
            isVIP: b.isVIP,
            size: `${b.width}x${b.height}`,
          } as BoothMarkerData))
        }
        title="All Booth Locations on Map"
        description="View all booths with their real-world locations. Each marker shows the booth number for easy identification."
      />
    </div>
  );
}
