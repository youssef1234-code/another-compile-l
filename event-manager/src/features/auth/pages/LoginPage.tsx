/**
 * Login Page
 * 
 * Clean login using GenericForm with LoginSchema
 */

import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GenericForm } from '@/components/generic';
import { LoginSchema, type LoginInput } from '@event-manager/shared';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { Mail, Lock } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.user as any, data.token, data.refreshToken);
      toast.success('Welcome back!', {
        icon: '✅',
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: '500',
        },
      });
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed', {
        icon: '❌',
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: '500',
        },
      });
    },
  });

  const handleSubmit = async (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <GenericForm
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
                  <span className="bg-white px-2 text-muted-foreground">
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
