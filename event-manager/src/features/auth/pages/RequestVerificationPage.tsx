/**
 * Request Email Verification Page
 * Allows unverified users to resend verification email
 * 5-minute cooldown between requests
 * Only accessible via redirect (not direct URL access)
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function RequestVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const email = searchParams.get('email') || '';
  
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  // Check if user came from a redirect (has navigation state or referrer)
  useEffect(() => {
    const isFromRedirect = location.state?.fromLogin || document.referrer.includes(window.location.origin);
    
    if (!isFromRedirect && !location.state?.fromLogin) {
      // User tried to access directly via URL bar
      toast.error('Please login first to verify your email');
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [location, navigate]);

  const resendMutation = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: (data: any) => {
      setEmailSent(true);
      setCooldownSeconds(300); // 5 minutes
      toast.success(data.message);
    },
    onError: (error: any) => {
      // Extract wait time from error message if present
      const match = error.message.match(/wait (\d+) seconds/);
      if (match) {
        const waitSeconds = parseInt(match[1]);
        setCooldownSeconds(waitSeconds);
      }
      toast.error(error.message);
    },
  });

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownSeconds]);

  const handleResend = () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }
    resendMutation.mutate({ email });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
        <Card className="w-full max-w-md border-neutral-200">
          <CardHeader>
            <CardTitle className="text-2xl">Email Required</CardTitle>
            <CardDescription>Please provide an email address</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="w-full border-neutral-200">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              {emailSent ? (
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              )}
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {emailSent ? 'Email Sent!' : 'Verify Your Email'}
              </CardTitle>
              <CardDescription className="text-neutral-500">
                {emailSent
                  ? 'We sent a verification link to your email'
                  : 'Click the button below to receive a verification email'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600 text-center break-all">
                <span className="font-medium text-neutral-900">{email}</span>
              </p>
            </div>

            {emailSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-green-50 rounded-lg p-4 border border-green-200"
              >
                <p className="text-sm text-green-800 text-center">
                  Please check your inbox and click the verification link. Don't forget to check your spam folder!
                </p>
              </motion.div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleResend}
                disabled={cooldownSeconds > 0 || resendMutation.isPending}
              >
                {resendMutation.isPending ? (
                  <>
                    <span className="animate-pulse">Sending...</span>
                  </>
                ) : cooldownSeconds > 0 ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Wait {formatTime(cooldownSeconds)}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    {emailSent ? 'Resend Verification Email' : 'Send Verification Email'}
                  </>
                )}
              </Button>

              {cooldownSeconds > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center text-neutral-500"
                >
                  You can resend the email after the cooldown period
                </motion.p>
              )}

              <div className="pt-4 border-t border-neutral-200">
                <p className="text-sm text-center text-neutral-600 mb-3">
                  Already verified your email?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link to={ROUTES.LOGIN}>
                    Go to Login
                  </Link>
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                  asChild
                >
                  <Link to={ROUTES.SIGNUP}>
                    Sign up with different email
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
