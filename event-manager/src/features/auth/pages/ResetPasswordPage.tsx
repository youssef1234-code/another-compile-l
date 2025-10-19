/**
 * Reset Password Page
 * Allows users to set a new password using reset token from email
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { GenericForm } from '@/components/generic';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [showSuccess, setShowSuccess] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
    },
  });

  useEffect(() => {
    if (!token) {
      navigate(ROUTES.LOGIN);
    }
  }, [token, navigate]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    await resetPasswordMutation.mutateAsync({
      token,
      newPassword: data.newPassword,
    });
  };

  if (!token) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
        <div className="w-full max-w-md">
          <GenericForm<ResetPasswordForm>
            title="Reset your password"
            description="Enter your new password below"
            schema={resetPasswordSchema}
            fields={[
              {
                name: 'newPassword',
                label: 'New Password',
                type: 'password',
                placeholder: 'Enter new password',
                icon: <Lock className="h-4 w-4" />,
              },
              {
                name: 'confirmPassword',
                label: 'Confirm Password',
                type: 'password',
                placeholder: 'Confirm new password',
                icon: <Lock className="h-4 w-4" />,
              },
            ]}
            onSubmit={onSubmit}
            isLoading={resetPasswordMutation.isPending}
            submitButtonText="Reset password"
            showCancelButton={false}
            columns={1}
            animate={true}
          />
        </div>
      </div>

      <AlertDialog open={showSuccess} onOpenChange={() => navigate(ROUTES.LOGIN)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password reset successful</AlertDialogTitle>
            <AlertDialogDescription>
              Your password has been reset. You can now log in with your new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => navigate(ROUTES.LOGIN)}>
              Continue to login
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
