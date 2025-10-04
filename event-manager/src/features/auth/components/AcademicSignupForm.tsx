/**
 * Academic Signup Form Component
 * 
 * Features:
 * - React Hook Form with Zod validation
 * - Framer Motion animations
 * - Real-time validation feedback
 * - Role-based conditional rendering
 * - Toast notifications
 * - Loading states with animations
 * 
 * Design Patterns:
 * - Controlled Component Pattern
 * - Custom Hook Pattern
 * - Presenter Pattern
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';
import { Loader2, GraduationCap, UserCheck, Mail, Lock, User, IdCard } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Animation variants
const containerVariants = {
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

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

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

type AcademicSignupForm = z.infer<typeof academicSignupSchema>;

interface AcademicSignupFormProps {
  onSuccess?: () => void;
}

export function AcademicSignupForm({ onSuccess }: AcademicSignupFormProps) {
  const form = useForm<AcademicSignupForm>({
    resolver: zodResolver(academicSignupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      studentId: '',
      role: 'STUDENT'
    }
  });

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
      
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message, {
        duration: 5000,
      });
    }
  });

  const onSubmit = (data: AcademicSignupForm) => {
    signupMutation.mutate({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      gucId: data.studentId,
      role: data.role,
    });
  };

  const selectedRole = form.watch('role');
  const requiresApproval = selectedRole && ['STAFF', 'TA', 'PROFESSOR'].includes(selectedRole);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="space-y-1 pb-4">
          <motion.div variants={itemVariants} className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Academic Signup</CardTitle>
          </motion.div>
          <motion.div variants={itemVariants}>
            <CardDescription>
              Create your account using your GUC email address
            </CardDescription>
          </motion.div>
          
          {requiresApproval && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Admin approval required</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Staff, TA, and Professor accounts require verification by an administrator before activation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              {/* Name Fields */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="John" 
                            className="pl-10 w-full"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Doe" 
                            className="pl-10 w-full"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GUC Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="john.doe@student.guc.edu.eg"
                            className="pl-10 w-full"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Use your official GUC email address
                      </FormDescription>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Student/Staff ID and Role */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student/Staff ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="12345" 
                            className="pl-10 w-full"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="STAFF">Staff</SelectItem>
                          <SelectItem value="TA">Teaching Assistant</SelectItem>
                          <SelectItem value="PROFESSOR">Professor</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Password Fields */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 w-full"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="••••••••"
                            className="pl-10 w-full"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-1">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
