/**
 * Login Page
 * 
 * Clean login using GenericForm with LoginSchema
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GenericForm } from '@/components/generic';
import { LoginSchema, type LoginInput, type User } from '@event-manager/shared';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { Mail, Lock } from 'lucide-react';
import { formatValidationErrors } from '@/lib/format-errors';
import { ThemeToggle } from '@/components/theme-toggle';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [currentEmail, setCurrentEmail] = useState(''); // Store email for error handling

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.user as User, data.token, data.refreshToken);
      toast.success('Welcome back!', {
        icon: '✅',
        duration: 3000,
      });
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: { message?: string }) => {
      console.log('Login error:', error); // Debug log
      
      // Check if error is due to unverified email
      // tRPC error structure: error.data.code and error.message
      if (error.message?.includes('verify your email')) {
        // Extract email from login input
        toast.error('Please verify your email first', {
          icon: '📧',
          duration: 5000,
        });
        // Redirect to verification page with the email from the form
        navigate(`/request-verification?email=${encodeURIComponent(currentEmail)}`, {
          state: { fromLogin: true } // Mark as coming from login redirect
        });
        return;
      }

      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, {
        icon: '❌',
        duration: 4000,
      });
    },
  });

  const handleSubmit = async (data: LoginInput) => {
    setCurrentEmail(data.email); // Store email for error handling
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      {/* Theme Toggle - Positioned at top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
  <GenericForm<LoginInput>
          title="Welcome Back"
          description="Sign in to your account to continue"
          schema={LoginSchema}
          fields={[
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'your.email@example.com',
              icon: <Mail className="h-4 w-4" />,
            },
            {
              name: 'password',
              label: 'Password',
              type: 'password',
              placeholder: '••••••••',
              icon: <Lock className="h-4 w-4" />,
              helperText: (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                  className="text-sm text-neutral-600 hover:text-neutral-900 underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              ),
            },
          ]}
          onSubmit={handleSubmit}
          isLoading={loginMutation.isPending}
          submitButtonText="Sign In"
          showCancelButton={false}
          columns={1}
          animate={true}
          footerActions={
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.SIGNUP)}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </button>
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}
