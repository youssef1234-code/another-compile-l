/**
 * Markdown Viewer Component
 * 
 * Displays rendered markdown content with consistent styling.
 * Uses the same renderer as the markdown editor for perfect consistency.
 */

import MDEditor from '@uiw/react-md-editor';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light';

  if (!content) {
    return (
      <p className="text-muted-foreground text-sm italic">
        No description available
      </p>
    );
  }

  return (
    <div data-color-mode={colorMode} className={cn('wmde-markdown-var', className)}>
      <MDEditor.Markdown 
        source={content} 
        style={{ 
          padding: 0,
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
}

export default MarkdownViewer;
