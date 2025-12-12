/**
 * Markdown Viewer Component
 * 
 * Displays rendered markdown content with consistent styling.
 * Supports dark/light mode and custom styling.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  if (!content) {
    return (
      <p className="text-muted-foreground text-sm italic">
        No description available
      </p>
    );
  }

  return (
    <div 
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        // Headings
        'prose-headings:font-semibold prose-headings:text-foreground',
        'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
        // Links
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // Lists
        'prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
        // Code
        'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
        'prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-lg',
        // Blockquotes
        'prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r',
        // Tables
        'prose-table:border prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownViewer;
