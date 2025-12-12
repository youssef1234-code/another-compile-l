/**
 * Markdown Editor Component - Clean Rewrite
 * Simple, working implementation
 */

import { useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Eye, 
  Edit3,
  Copy,
  Check,
  Loader2,
  Maximize2,
  Columns,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/hooks/useTheme';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

type Tone = 'professional' | 'casual' | 'academic' | 'exciting';
type ViewMode = 'edit' | 'live' | 'preview';
type ImproveFocus = 'engagement' | 'clarity' | 'conciseness' | 'grammar' | 'persuasive';

const IMPROVE_OPTIONS: { value: ImproveFocus; label: string; description: string }[] = [
  { value: 'engagement', label: 'More Engaging', description: 'Make it more exciting and captivating' },
  { value: 'clarity', label: 'Improve Clarity', description: 'Make it easier to understand' },
  { value: 'conciseness', label: 'More Concise', description: 'Shorten and remove fluff' },
  { value: 'grammar', label: 'Fix Grammar', description: 'Correct spelling and grammar' },
  { value: 'persuasive', label: 'More Persuasive', description: 'Make it more convincing' },
];

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number | string;
  minHeight?: string;
  eventName?: string;
  eventType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  targetAudience?: string;
  keyTopics?: string[];
  professors?: string[];
  label?: string;
  showAIAssist?: boolean;
  aiContext?: {
    eventName?: string;
    eventType?: string;
    additionalInfo?: string;
  };
  className?: string;
  showAiTools?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  height,
  minHeight = '300px',
  eventName: legacyEventName,
  eventType: legacyEventType,
  location,
  startDate,
  endDate,
  targetAudience,
  keyTopics,
  professors,
  showAIAssist,
  aiContext,
  className,
  showAiTools = true,
}: MarkdownEditorProps) {
  const eventName = aiContext?.eventName || legacyEventName;
  const eventType = aiContext?.eventType || legacyEventType;
  const shouldShowAiTools = showAIAssist ?? showAiTools;

  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [tone, setTone] = useState<Tone>('casual');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const editorHeight = height || minHeight;

  const handleGenerateDescription = useCallback(async () => {
    if (!eventName || !eventType) {
      toast.error('Please fill in the event name and type first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/ai/description/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName,
          event_type: eventType,
          location: location || 'GUC Campus',
          start_date: startDate || new Date().toISOString(),
          end_date: endDate,
          target_audience: targetAudience,
          key_topics: keyTopics,
          professors: professors,
          tone,
          include_markdown: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate description');

      const data = await response.json();
      onChange(data.description);
      
      if (data.suggestions?.length > 0) {
        toast.success(`Generated! Tip: ${data.suggestions[0]}`, { duration: 4000 });
      } else {
        toast.success('Description generated successfully!');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [eventName, eventType, location, startDate, endDate, targetAudience, keyTopics, professors, tone, onChange]);

  const handleImproveDescription = useCallback(async (focus: ImproveFocus = 'engagement') => {
    if (!value.trim()) {
      toast.error('Please write something first');
      return;
    }

    setIsImproving(true);
    const focusLabel = IMPROVE_OPTIONS.find(o => o.value === focus)?.label || 'Improve';
    
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/ai/description/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_description: value,
          event_type: eventType || 'WORKSHOP',
          improvement_focus: focus,
          tone,
          include_markdown: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to improve description');

      const data = await response.json();
      onChange(data.description);
      toast.success(`Description improved: ${focusLabel}!`);
    } catch (error) {
      console.error('Improvement error:', error);
      toast.error('Failed to improve description. Please try again.');
    } finally {
      setIsImproving(false);
    }
  }, [value, eventType, tone, onChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const wordCount = value.split(/\s+/).filter(Boolean).length;
  const charCount = value.length;

  const ViewModeToggle = () => (
    <div className="flex items-center gap-1 rounded-lg p-1 bg-muted/30 border">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('edit')}
        className={cn(
          'gap-1.5 h-7 px-3 transition-all text-xs font-medium rounded-md',
          viewMode === 'edit'
            ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
            : 'hover:bg-muted text-muted-foreground'
        )}
      >
        <Edit3 className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('live')}
        className={cn(
          'gap-1.5 h-7 px-3 transition-all text-xs font-medium rounded-md',
          viewMode === 'live'
            ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
            : 'hover:bg-muted text-muted-foreground'
        )}
      >
        <Columns className="h-3.5 w-3.5" />
        Split
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('preview')}
        className={cn(
          'gap-1.5 h-7 px-3 transition-all text-xs font-medium rounded-md',
          viewMode === 'preview'
            ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
            : 'hover:bg-muted text-muted-foreground'
        )}
      >
        <Eye className="h-3.5 w-3.5" />
        Preview
      </Button>
    </div>
  );

  const AIToolsBar = shouldShowAiTools ? (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-muted/20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline font-medium">AI Assistant</span>
      </div>
      
      <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
        <SelectTrigger className="w-[100px] h-7 text-xs">
          <SelectValue placeholder="Tone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="professional">Professional</SelectItem>
          <SelectItem value="casual">Casual</SelectItem>
          <SelectItem value="academic">Academic</SelectItem>
          <SelectItem value="exciting">Exciting</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={handleGenerateDescription}
        disabled={isGenerating || !eventName}
      >
        {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
        Generate
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            disabled={isImproving || !value.trim()}
          >
            {isImproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Improve
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {IMPROVE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleImproveDescription(option.value)}
              disabled={isImproving}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : null;

  const editorStyles = cn(
    "[&_.w-md-editor]:!bg-transparent [&_.w-md-editor]:!border-0",
    "[&_.w-md-editor-toolbar]:!bg-muted/20 [&_.w-md-editor-toolbar]:!border-b",
    "[&_.w-md-editor-toolbar_li>button]:!h-7 [&_.w-md-editor-toolbar_li>button]:!rounded-md",
    "[&_.w-md-editor-toolbar_li>button:hover]:!bg-accent",
    "[&_.w-md-editor-content]:!bg-background",
    "[&_.w-md-editor-text-input]:!text-foreground [&_.w-md-editor-text-input]:!text-sm"
  );

  const proseStyles = cn(
    'prose prose-sm dark:prose-invert max-w-none',
    'prose-headings:font-semibold prose-headings:mb-4 prose-headings:mt-6 first:prose-headings:mt-0',
    'prose-p:leading-relaxed prose-p:mb-4 prose-p:mt-0',
    'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
    'prose-strong:font-semibold prose-strong:text-foreground',
    'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
    'prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg',
    'prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6',
    'prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6',
    'prose-li:my-2 prose-li:leading-relaxed',
    'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic',
    'prose-hr:my-6 prose-hr:border-border',
    'prose-table:my-4 prose-table:border-collapse',
    'prose-th:border prose-th:p-2 prose-th:bg-muted',
    'prose-td:border prose-td:p-2'
  );

  return (
    <>
      <div className={cn(className)}>
        <div className="rounded-lg border bg-background overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
            <ViewModeToggle />
            
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {AIToolsBar}
          
          <div className={editorStyles} data-color-mode={colorMode}>
            <MDEditor
              value={value}
              onChange={(val) => onChange(val || '')}
              preview={viewMode}
              height={editorHeight}
              visibleDragbar={false}
              textareaProps={{
                placeholder,
              }}
              previewOptions={{ className: proseStyles }}
            />
          </div>
          
          <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/10">
            {wordCount} words • {charCount} characters
          </div>
        </div>
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Expanded Editor
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
            <ViewModeToggle />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy
            </Button>
          </div>
          
          {AIToolsBar}
          
          <div className={cn(editorStyles, "flex-1 overflow-hidden px-6")} data-color-mode={colorMode}>
            <MDEditor
              value={value}
              onChange={(val) => onChange(val || '')}
              preview={viewMode}
              height="100%"
              visibleDragbar={false}
              textareaProps={{
                placeholder,
              }}
              previewOptions={{ className: proseStyles }}
            />
          </div>
          
          <div className="px-6 py-3 text-xs text-muted-foreground border-t bg-muted/10">
            {wordCount} words • {charCount} characters
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MarkdownEditor;
