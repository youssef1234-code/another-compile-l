/**
 * Inline Edit Cell Component
 * 
 * Editable table cell with validation
 * 
 * Usage:
 * <InlineEditCell
 *   value={value}
 *   onSave={(newValue) => updateUser(newValue)}
 *   type="text"
 * />
 */

import { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InlineEditCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  type?: 'text' | 'email' | 'number';
  validate?: (value: string) => string | null; // Returns error message or null
  className?: string;
}

export function InlineEditCell({
  value,
  onSave,
  type = 'text',
  validate,
  className,
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    // Client-side validation
    if (validate) {
      const validationError = validate(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err: unknown) {
      // Display error message (should be user-friendly from parent handler)
      const errorMessage =
        err instanceof Error ? err.message : String(err ?? 'Failed to save');
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1 -mx-2 -my-1',
          className
        )}
        onClick={() => setIsEditing(true)}
      >
        <span className="flex-1">{value}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex-1">
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={cn(
            'h-8 text-sm',
            error && 'border-red-500 focus-visible:ring-red-500'
          )}
        />
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
        className="h-8 w-8 p-0"
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isSaving}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

/**
 * Inline Edit Select Component
 */
interface InlineEditSelectProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
}

export function InlineEditSelect({
  value,
  options,
  onSave,
  className,
}: InlineEditSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (err: unknown) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentLabel = options.find(opt => opt.value === value)?.label || value;

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1 -mx-2 -my-1',
          className
        )}
        onClick={() => setIsEditing(true)}
      >
        <span className="flex-1">{currentLabel}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isSaving}
        className="flex-1 h-8 text-sm border rounded-md px-2"
        autoFocus
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
