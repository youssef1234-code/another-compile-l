/**
 * Vendor Signup Form Component
 * 
 * Refactored to use GenericForm for consistent UI/UX
 * 
 * Features:
 * - React Hook Form with Zod validation
 * - Framer Motion animations
 * - Real-time validation feedback
 * - Toast notifications
 * - Loading states
 */

import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';
import { Building2, Mail, Lock, Briefcase, User } from 'lucide-react';
import { GenericForm, type FormFieldConfig } from '@/components/generic/GenericForm';

// Zod Schema
const vendorSignupSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name is too long'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type VendorSignupFormData = z.infer<typeof vendorSignupSchema>;

interface VendorSignupFormProps {
  onSuccess?: () => void;
}

export function VendorSignupForm({ onSuccess }: VendorSignupFormProps) {
  const signupMutation = trpc.auth.signupVendor.useMutation({
    onSuccess: (data) => {
      toast.success(data.message, {
        duration: 5000,
        icon: '🎉',
      });
      
      toast('Check your email to verify your account.', {
        duration: 7000,
        icon: '📧',
      });
      
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message, {
        duration: 5000,
      });
    }
  });

  const handleSubmit = (data: VendorSignupFormData) => {
    signupMutation.mutate({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      companyName: data.companyName,
    });
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'John',
      icon: <User className="h-4 w-4" />,
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Doe',
      icon: <User className="h-4 w-4" />,
    },
    {
      name: 'email',
      label: 'Company Email',
      type: 'email',
      placeholder: 'contact@acme.com',
      description: 'Official company email address',
      icon: <Mail className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: 'companyName',
      label: 'Company Name',
      type: 'text',
      placeholder: 'Acme Corporation',
      description: 'Your official company or business name',
      icon: <Building2 className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: '••••••••',
      icon: <Lock className="h-4 w-4" />,
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: '••••••••',
      icon: <Lock className="h-4 w-4" />,
    },
  ];

  return (
    <GenericForm
      title="Vendor Signup"
      description="Register your company to participate in GUC events"
      icon={<Building2 className="h-6 w-6 text-primary" />}
      fields={fields}
      schema={vendorSignupSchema}
      onSubmit={handleSubmit}
      defaultValues={{
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
      }}
      submitButtonText="Create Vendor Account"
      submitButtonIcon={<Building2 className="h-4 w-4" />}
      isLoading={signupMutation.isPending}
      columns={2}
      gridGap={3}
      formSpacing={3}
      conditionalAlerts={[
        {
          condition: () => true, // Always show for vendor signup
          variant: 'info',
          icon: <Briefcase className="h-5 w-5" />,
          title: "What's next?",
          message: "After registration, you'll be able to upload your tax card and logo, then apply to participate in bazaars and booth setups.",
        },
      ]}
    />
  );
}
