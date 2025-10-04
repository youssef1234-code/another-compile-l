/**
 * Email Verification Page
 * Verifies user email using token from URL
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [verifying, setVerifying] = useState(true);

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setVerifying(false);
    },
    onError: () => {
      setVerifying(false);
    },
  });

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate({ token });
    } else {
      setVerifying(false);
    }
  }, [token]);

  const handleContinue = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
        <Card className="w-full max-w-md border-neutral-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight text-center">
              {verifying ? 'Verifying email...' : 'Email verification'}
            </CardTitle>
            <CardDescription className="text-neutral-500 text-center">
              {verifying ? 'Please wait while we verify your email' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verifying ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-neutral-400" />
              </div>
            ) : !verifyEmailMutation.isSuccess && (
              <div className="space-y-2">
                <p className="text-sm text-center text-neutral-600 mb-4">
                  {verifyEmailMutation.error?.message || 'Invalid or expired verification link'}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link to={ROUTES.LOGIN}>Back to login</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  asChild
                >
                  <Link to={ROUTES.SIGNUP}>Sign up again</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={verifyEmailMutation.isSuccess} onOpenChange={handleContinue}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email verified successfully</AlertDialogTitle>
            <AlertDialogDescription>
              {verifyEmailMutation.data?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={handleContinue}>
              Continue to login
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

