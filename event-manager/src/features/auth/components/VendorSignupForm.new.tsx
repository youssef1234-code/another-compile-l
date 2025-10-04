/**
 * Vendor Signup Form Component
 * 
 * Uses GenericForm for consistency
 */

import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { trpc } from '@/lib/trpc';
import { GenericForm } from '@/components/generic';
import { Building2, User, Mail, Lock, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

type VendorSignupInput = z.infer<typeof vendorSignupSchema>;

interface VendorSignupFormProps {
  onSuccess?: () => void;
}

export function VendorSignupForm({ onSuccess }: VendorSignupFormProps) {
  const signupMutation = trpc.auth.signupVendor.useMutation({
    onSuccess: (data) => {
      toast.success(data.message, {
        duration: 5000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: '500',
        },
      });
      
      toast('Check your email to verify your account.', {
        duration: 7000,
        icon: '📧',
        style: {
          background: '#3b82f6',
          color: '#fff',
          fontWeight: '500',
        },
      });
      
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message, {
        duration: 5000,
        icon: '❌',
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: '500',
        },
      });
    }
  });

  const onSubmit = (data: VendorSignupInput) => {
    signupMutation.mutate({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      companyName: data.companyName,
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Vendor Signup</CardTitle>
        </div>
        <CardDescription>
          Register your business to participate in GUC events
        </CardDescription>
      </CardHeader>

      <CardContent>
        <GenericForm
          schema={vendorSignupSchema}
          fields={[
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
              name: 'companyName',
              label: 'Company Name',
              type: 'text',
              placeholder: 'Acme Corporation',
              icon: <Briefcase className="h-4 w-4" />,
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'vendor@company.com',
              icon: <Mail className="h-4 w-4" />,
            },
            {
              name: 'password',
              label: 'Password',
              type: 'password',
              placeholder: '••••••••',
              icon: <Lock className="h-4 w-4" />,
              description: 'Must be at least 8 characters with uppercase, lowercase, and number',
            },
            {
              name: 'confirmPassword',
              label: 'Confirm Password',
              type: 'password',
              placeholder: '••••••••',
              icon: <Lock className="h-4 w-4" />,
            },
          ]}
          onSubmit={onSubmit}
          isLoading={signupMutation.isPending}
          submitButtonText="Create Vendor Account"
          showCancelButton={false}
          columns={2}
          animate={true}
        />
      </CardContent>
    </Card>
  );
}
