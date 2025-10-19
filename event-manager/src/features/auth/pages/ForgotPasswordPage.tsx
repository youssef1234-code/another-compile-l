/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    await requestResetMutation.mutateAsync(data);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
        <div className="w-full max-w-md">
          <GenericForm<ForgotPasswordForm>
            title="Forgot password?"
            description="Enter your email and we'll send you a reset link"
            schema={forgotPasswordSchema}
            fields={[
              {
                name: 'email',
                label: 'Email',
                type: 'email',
                placeholder: 'name@example.com',
                icon: <Mail className="h-4 w-4" />,
              },
            ]}
            onSubmit={onSubmit}
            isLoading={requestResetMutation.isPending}
            submitButtonText="Send reset link"
            showCancelButton={false}
            columns={1}
            animate={true}
            footerActions={
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                asChild
              >
                <Link to={ROUTES.LOGIN}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            }
          />
        </div>
      </div>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check your email</AlertDialogTitle>
            <AlertDialogDescription>
              We've sent you a password reset link. It will expire in 1 hour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => navigate(ROUTES.LOGIN)}>
              Back to login
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
