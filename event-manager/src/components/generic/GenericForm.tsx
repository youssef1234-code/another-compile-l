/**
 * Enhanced Generic Form Component
 * 
 * Matches EXACT UI/UX of Academic and Vendor signup forms
 * Features:
 * - React Hook Form with Zod validation
 * - Framer Motion animations with stagger
 * - Icon support for inputs
 * - Conditional alerts/banners
 * - Custom grid layouts
 * - Error message spacing (min-height)
 * - Full customization options
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, type Variants } from 'framer-motion';
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

// Animation variants matching current forms
const defaultContainerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1
    }
  }
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

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

export interface ConditionalAlert {
  /** Condition function that receives form values and returns true to show alert */
  condition: (values: any) => boolean;
  /** Alert variant color */
  variant?: 'info' | 'warning' | 'success' | 'error';
  /** Icon to display */
  icon?: React.ReactNode;
  /** Alert title */
  title: string;
  /** Alert message */
  message: string;
  /** Custom className */
  className?: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  icon?: React.ReactNode;
  helperText?: React.ReactNode; // Add this for custom helper text like "Forgot password?"
  
  // For select fields
  options?: Array<{ value: string; label: string }>;
  
  // For custom fields
  render?: (field: any, form: any) => React.ReactNode;
  
  // For number fields
  min?: number;
  max?: number;
  step?: number;
  
  // Layout
  colSpan?: 1 | 2; // Span 1 or 2 columns in grid
  
  // Styling
  className?: string;
  inputClassName?: string;
  
  // Error message spacing (prevents layout shift)
  reserveErrorSpace?: boolean; // Default true
}

export interface GenericFormProps {
  // Form configuration
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  fields: FormFieldConfig[];
  schema: z.ZodType<any, any, any>;
  
  // Callbacks
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  
  // UI customization
  submitButtonText?: string;
  submitButtonIcon?: React.ReactNode;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  isLoading?: boolean;
  
  // Layout
  columns?: 1 | 2; // Grid columns for form fields
  gridGap?: 3 | 4 | 5; // Tailwind gap-* value
  formSpacing?: 3 | 4 | 5; // Tailwind space-y-* value
  
  // Default values
  defaultValues?: Record<string, any>;
  
  // Animations
  animate?: boolean;
  containerVariants?: Variants;
  itemVariants?: Variants;
  
  // Styling
  className?: string;
  cardClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  
  // Card customization
  cardBorder?: boolean; // Default false
  cardShadow?: boolean; // Default false
  headerPadding?: 4 | 6 | 8; // pb-* value
  
  // Conditional alerts/banners
  conditionalAlerts?: ConditionalAlert[];
  
  // Footer actions
  footerActions?: React.ReactNode;
  
  // Submit button customization
  submitButtonSize?: 'default' | 'sm' | 'lg';
  submitButtonFullWidth?: boolean; // Default true
  submitButtonClassName?: string;
}

const alertVariants = {
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
};

const alertIconColors = {
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
};

const alertTextColors = {
  info: 'text-blue-700 dark:text-blue-300',
  warning: 'text-yellow-700 dark:text-yellow-300',
  success: 'text-green-700 dark:text-green-300',
  error: 'text-red-700 dark:text-red-300',
};

export function GenericForm({
  title,
  description,
  icon,
  fields,
  schema,
  onSubmit,
  onCancel,
  submitButtonText = 'Submit',
  submitButtonIcon,
  cancelButtonText = 'Cancel',
  showCancelButton = false,
  isLoading = false,
  columns = 1,
  gridGap = 4,
  formSpacing = 4,
  defaultValues,
  animate = true,
  containerVariants = defaultContainerVariants,
  itemVariants = defaultItemVariants,
  className,
  cardClassName,
  headerClassName,
  contentClassName,
  cardBorder = false,
  cardShadow = false,
  headerPadding = 4,
  conditionalAlerts,
  footerActions,
  submitButtonSize = 'lg',
  submitButtonFullWidth = true,
  submitButtonClassName,
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

  // Watch form values for conditional alerts
  const formValues = form.watch();

  const renderField = (fieldConfig: FormFieldConfig) => {
    const { reserveErrorSpace = true } = fieldConfig;

    // Custom field rendering
    if (fieldConfig.type === 'custom' && fieldConfig.render) {
      return fieldConfig.render(form.getValues(fieldConfig.name), form);
    }

    return (
      <FormField
        key={fieldConfig.name}
        control={form.control}
        name={fieldConfig.name}
        render={({ field }) => (
          <FormItem className={fieldConfig.className}>
            {fieldConfig.type !== 'checkbox' && (
              <div className="flex items-center justify-between">
                <FormLabel>{fieldConfig.label}</FormLabel>
                {fieldConfig.helperText && (
                  <div className="text-sm">{fieldConfig.helperText}</div>
                )}
              </div>
            )}
            <FormControl>
              {fieldConfig.type === 'select' ? (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className={cn('w-full', fieldConfig.inputClassName)}>
                    <SelectValue placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label}`} />
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
                    {fieldConfig.label}
                  </label>
                </div>
              ) : (
                <div className="relative">
                  {fieldConfig.icon && (
                    <div className="absolute left-3 top-3 text-muted-foreground">
                      {fieldConfig.icon}
                    </div>
                  )}
                  <Input
                    type={fieldConfig.type}
                    placeholder={fieldConfig.placeholder}
                    disabled={isLoading}
                    className={cn(
                      'w-full',
                      fieldConfig.icon && 'pl-10',
                      fieldConfig.inputClassName
                    )}
                    min={fieldConfig.min}
                    max={fieldConfig.max}
                    step={fieldConfig.step}
                    {...field}
                  />
                </div>
              )}
            </FormControl>
            {fieldConfig.description && fieldConfig.type !== 'checkbox' && (
              <FormDescription>{fieldConfig.description}</FormDescription>
            )}
            {reserveErrorSpace ? (
              <div className="min-h-[20px]">
                <FormMessage />
              </div>
            ) : (
              <FormMessage />
            )}
          </FormItem>
        )}
      />
    );
  };

  const renderFormContent = () => {
    // Process fields into groups for rendering
    const fieldGroups: FormFieldConfig[][] = [];
    let currentGroup: FormFieldConfig[] = [];
    
    fields.forEach((field) => {
      if (field.colSpan === 2 || columns === 1) {
        // Full width field - flush current group and add as single field
        if (currentGroup.length > 0) {
          fieldGroups.push([...currentGroup]);
          currentGroup = [];
        }
        fieldGroups.push([field]);
      } else {
        // Regular field - add to current group
        currentGroup.push(field);
        if (currentGroup.length === 2) {
          fieldGroups.push([...currentGroup]);
          currentGroup = [];
        }
      }
    });
    
    // Flush remaining fields
    if (currentGroup.length > 0) {
      fieldGroups.push(currentGroup);
    }
    
    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className={formSpacing === 3 ? 'space-y-3' : formSpacing === 5 ? 'space-y-5' : 'space-y-4'}>
        {/* Render field groups */}
        {fieldGroups.map((group, groupIndex) => (
          <motion.div 
            key={groupIndex}
            variants={animate ? itemVariants : undefined}
            className={group.length > 1 ? `grid grid-cols-1 md:grid-cols-2 ${gridGap === 3 ? 'gap-3' : gridGap === 5 ? 'gap-5' : 'gap-4'}` : ''}
          >
            {group.map((field) => renderField(field))}
          </motion.div>
        ))}

        {/* Submit Button */}
        <motion.div variants={animate ? itemVariants : undefined} className="pt-1">
          <Button 
            type="submit" 
            className={cn(
              submitButtonFullWidth && 'w-full',
              submitButtonClassName
            )}
            size={submitButtonSize}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {submitButtonIcon && <span className="mr-2">{submitButtonIcon}</span>}
                {submitButtonText}
              </>
            )}
          </Button>
          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="ml-2"
            >
              {cancelButtonText}
            </Button>
          )}
        </motion.div>

        {footerActions && (
          <motion.div variants={animate ? itemVariants : undefined}>
            {footerActions}
          </motion.div>
        )}
      </form>
    );
  };

  const content = (
    <Card className={cn(
      cardBorder ? '' : 'border-0',
      cardShadow ? '' : 'shadow-none',
      cardClassName
    )}>
      {(title || description || icon || conditionalAlerts) && (
        <CardHeader className={cn(
          'space-y-1',
          headerPadding === 6 ? 'pb-6' : headerPadding === 8 ? 'pb-8' : 'pb-4',
          headerClassName
        )}>
          {(title || icon) && (
            <motion.div 
              variants={animate ? itemVariants : undefined}
              className="flex items-center gap-2"
            >
              {icon && (
                <div className="p-2 rounded-lg bg-primary/10">
                  {icon}
                </div>
              )}
              {title && <CardTitle className="text-2xl font-bold">{title}</CardTitle>}
            </motion.div>
          )}
          
          {description && (
            <motion.div variants={animate ? itemVariants : undefined}>
              <CardDescription>{description}</CardDescription>
            </motion.div>
          )}

          {/* Conditional Alerts */}
          {conditionalAlerts?.map((alert, index) => {
            const shouldShow = alert.condition(formValues);
            if (!shouldShow) return null;

            const variant = alert.variant || 'info';
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className={cn(
                  'flex items-start gap-2 p-3 rounded-lg border',
                  alertVariants[variant],
                  alert.className
                )}>
                  {alert.icon && (
                    <div className={cn('h-5 w-5 mt-0.5', alertIconColors[variant])}>
                      {alert.icon}
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="font-medium">{alert.title}</p>
                    <p className={cn('mt-1', alertTextColors[variant])}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardHeader>
      )}

      <CardContent className={contentClassName}>
        <Form {...form}>{renderFormContent()}</Form>
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
      {content}
    </motion.div>
  );
}
