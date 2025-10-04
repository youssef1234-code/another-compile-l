/**
 * Generic Form Component
 * 
 * Highly customizable form component with validation
 * Supports various field types and layouts
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type FieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'custom';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  icon?: React.ReactNode;
  
  // For select fields
  options?: Array<{ value: string; label: string }>;
  
  // For custom fields
  render?: (field: any) => React.ReactNode;
  
  // For number fields
  min?: number;
  max?: number;
  step?: number;
  
  // Layout
  colSpan?: number; // For grid layout (1-12)
}

export interface GenericFormProps {
  // Form configuration
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
  schema: z.ZodType<any, any, any>;
  
  // Callbacks
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  
  // UI customization
  submitButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  isLoading?: boolean;
  
  // Layout
  columns?: 1 | 2 | 3;
  
  // Default values
  defaultValues?: Record<string, any>;
  
  // Animations
  animate?: boolean;
  
  // Styling
  className?: string;
  cardClassName?: string;
  
  // Footer actions
  footerActions?: React.ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function GenericForm({
  title,
  description,
  fields,
  schema,
  onSubmit,
  onCancel,
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  showCancelButton = false,
  isLoading = false,
  columns = 1,
  defaultValues,
  animate = true,
  className,
  cardClassName,
  footerActions,
}: GenericFormProps) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || Object.fromEntries(
      fields.map((f) => [
        f.name,
        f.type === 'checkbox' ? false : f.type === 'number' ? 0 : '',
      ])
    ),
  });

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }[columns];

  const content = (
    <Card className={cardClassName}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className={cn('grid gap-4', gridColsClass)}>
              {fields.map((fieldConfig) => (
                <FormField
                  key={fieldConfig.name}
                  control={form.control}
                  name={fieldConfig.name}
                  render={({ field }) => (
                    <FormItem
                      className={
                        fieldConfig.colSpan
                          ? `col-span-${fieldConfig.colSpan}`
                          : undefined
                      }
                    >
                      <FormLabel>{fieldConfig.label}</FormLabel>
                      <FormControl>
                        {fieldConfig.type === 'custom' && fieldConfig.render ? (
                          fieldConfig.render(field)
                        ) : fieldConfig.type === 'textarea' ? (
                          <textarea
                            {...field}
                            placeholder={fieldConfig.placeholder}
                            disabled={isLoading}
                            rows={4}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        ) : fieldConfig.type === 'select' ? (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={fieldConfig.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldConfig.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : fieldConfig.type === 'checkbox' ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {fieldConfig.description}
                            </label>
                          </div>
                        ) : fieldConfig.type === 'number' ? (
                          <Input
                            {...field}
                            type="number"
                            placeholder={fieldConfig.placeholder}
                            disabled={isLoading}
                            min={fieldConfig.min}
                            max={fieldConfig.max}
                            step={fieldConfig.step}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        ) : fieldConfig.type === 'date' ? (
                          <Input
                            {...field}
                            type="date"
                            disabled={isLoading}
                          />
                        ) : (
                          <div className="relative">
                            {fieldConfig.icon && (
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {fieldConfig.icon}
                              </div>
                            )}
                            <Input
                              {...field}
                              type={fieldConfig.type}
                              placeholder={fieldConfig.placeholder}
                              disabled={isLoading}
                              className={fieldConfig.icon ? 'pl-10' : ''}
                            />
                          </div>
                        )}
                      </FormControl>
                      {fieldConfig.description && fieldConfig.type !== 'checkbox' && (
                        <FormDescription>{fieldConfig.description}</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                disabled={isLoading}
                className={cn(!showCancelButton && "w-full")}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  submitButtonText
                )}
              </Button>
              {showCancelButton && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  {cancelButtonText}
                </Button>
              )}
              {footerActions}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  if (!animate) {
    return <div className={className}>{content}</div>;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <motion.div variants={itemVariants}>{content}</motion.div>
    </motion.div>
  );
}
