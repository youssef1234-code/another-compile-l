/**
 * Academic Signup Form Component
 * 
 * Refactored to use GenericForm for consistent UI/UX
 * 
 * Features:
 * - React Hook Form with Zod validation
 * - Framer Motion animations
 * - Real-time validation feedback
 * - Role-based conditional rendering
 * - Toast notifications
 * - Loading states with animations
 */

import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';
import { GraduationCap, UserCheck, Mail, Lock, User, IdCard } from 'lucide-react';
import { GenericForm, type FormFieldConfig } from '@/components/generic/GenericForm';

// Zod Schema
const academicSignupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .refine(
      (email) => email.endsWith('@guc.edu.eg') || email.endsWith('@student.guc.edu.eg'),
      'Must use GUC email (@guc.edu.eg or @student.guc.edu.eg)'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  studentId: z.string().min(4, 'ID must be at least 4 characters').max(20),
  role: z.enum(['STUDENT', 'STAFF', 'TA', 'PROFESSOR'], {
    required_error: 'Please select a role',
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcademicSignupFormData = z.infer<typeof academicSignupSchema>;

interface AcademicSignupFormProps {
  onSuccess?: () => void;
}

export function AcademicSignupForm({ onSuccess }: AcademicSignupFormProps) {
  const signupMutation = trpc.auth.signupAcademic.useMutation({
    onSuccess: (data) => {
      toast.success(data.message, {
        duration: 5000,
        icon: '✅',
      });
      
      if ('requiresAdminApproval' in data && data.requiresAdminApproval) {
        toast('You will receive an email once your role is verified by admin.', {
          duration: 7000,
          icon: '⏳',
        });
      }
      
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message, {
        duration: 5000,
      });
    }
  });

  const handleSubmit = (data: AcademicSignupFormData) => {
    signupMutation.mutate({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      gucId: data.studentId,
      role: data.role,
    });
  };

  const fields: FormFieldConfig<AcademicSignupFormData>[] = [
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
      label: 'GUC Email',
      type: 'email',
      placeholder: 'john.doe@student.guc.edu.eg',
      description: 'Use your official GUC email address',
      icon: <Mail className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: 'studentId',
      label: 'Student/Staff ID',
      type: 'text',
      placeholder: '12345',
      icon: <IdCard className="h-4 w-4" />,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      placeholder: 'Select your role',
      options: [
        { value: 'STUDENT', label: 'Student' },
        { value: 'STAFF', label: 'Staff' },
        { value: 'TA', label: 'Teaching Assistant' },
        { value: 'PROFESSOR', label: 'Professor' },
      ],
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
  <GenericForm<AcademicSignupFormData>
      title="Academic Signup"
      description="Create your account using your GUC email address"
      icon={<GraduationCap className="h-6 w-6 text-primary" />}
      fields={fields}
      schema={academicSignupSchema}
      onSubmit={handleSubmit}
      defaultValues={{
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        studentId: '',
        role: 'STUDENT',
      }}
      submitButtonText="Create Account"
      submitButtonIcon={<GraduationCap className="h-4 w-4" />}
      isLoading={signupMutation.isPending}
      columns={2}
      gridGap={3}
      formSpacing={3}
      conditionalAlerts={[
        {
          condition: (values) => 
            values.role && ['STAFF', 'TA', 'PROFESSOR'].includes(values.role),
          variant: 'info',
          icon: <UserCheck className="h-5 w-5" />,
          title: 'Admin approval required',
          message: 'Staff, TA, and Professor accounts require verification by an administrator before activation.',
        },
      ]}
    />
  );
}
