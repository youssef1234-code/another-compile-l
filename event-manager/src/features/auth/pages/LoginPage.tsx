/**
 * Login Page
 * 
 * Modern, creative login page with animations and beautiful design
 */

import { GenericForm } from '@/components/generic';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { formatValidationErrors } from '@/lib/format-errors';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import { LoginSchema, type LoginInput, type User } from '@event-manager/shared';
import { motion } from 'framer-motion';
import { Calendar, CreditCard, Dumbbell, GraduationCap, Lock, Mail, Sparkles, Star, Store, Ticket, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 items-center justify-center">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl"
          />
          {/* Floating Icons */}
          <motion.div
            animate={{ y: [0, -30, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-20 left-10 opacity-20"
          >
            <Ticket className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 25, 0], rotate: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-24 right-12 opacity-20"
          >
            <Dumbbell className="w-14 h-14 text-primary" />
          </motion.div>
          <motion.div
            animate={{ x: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-1/3 right-16 opacity-20"
          >
            <Calendar className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.div
            animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity }}
            className="absolute bottom-1/3 left-12 opacity-20"
          >
            <Trophy className="w-11 h-11 text-primary" />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute top-1/2 left-1/4 opacity-15"
          >
            <Star className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 6.5, repeat: Infinity }}
            className="absolute top-40 right-1/3 opacity-18"
          >
            <GraduationCap className="w-9 h-9 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 30, 0], rotate: [0, -20, 0] }}
            transition={{ duration: 7.5, repeat: Infinity }}
            className="absolute bottom-40 left-1/3 opacity-16"
          >
            <Store className="w-13 h-13 text-primary" />
          </motion.div>
          <motion.div
            animate={{ x: [0, -25, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-2/3 left-16 opacity-14"
          >
            <Users className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, -360], y: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-20 opacity-17"
          >
            <CreditCard className="w-9 h-9 text-primary" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, 15, 0] }}
            transition={{ duration: 9, repeat: Infinity }}
            className="absolute top-1/4 left-20 opacity-12"
          >
            <Ticket className="w-7 h-7 text-primary" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md space-y-8">
          {/* Logo - Much Bigger */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-8 bg-primary/30 blur-3xl rounded-full animate-pulse" />
              <img 
                src="/logo.png" 
                alt="Campus Events Platform" 
                className="relative w-80 h-80 object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center space-y-4"
          >
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Welcome Back
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Sign in to access your campus events
            </p>
          </motion.div>

          {/* Feature Icons Grid - Glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: GraduationCap, label: 'Events & Workshops' },
              { icon: Ticket, label: 'Easy Booking' },
              { icon: Store, label: 'Vendor Bazaars' },
              { icon: Dumbbell, label: 'Sports & Gym' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className="relative group flex flex-col items-center gap-3 p-4 rounded-2xl cursor-default"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 blur transition-opacity" />
                <item.icon className="w-10 h-10 text-primary relative z-10" />
                <span className="text-sm text-foreground/90 font-medium relative z-10 text-center">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Decorative Elements */}
          <div className="flex justify-center gap-2 pt-8">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Logo for Mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <img 
                src="/logo.png" 
                alt="Campus Events Platform" 
                className="relative w-32 h-32 object-contain drop-shadow-xl"
              />
            </div>
          </div>

          {/* Mobile Heading */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to continue</p>
          </div>

          {/* Login Form */}
          <div className="relative">
            {/* Decorative Sparkle */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-6 -right-6 text-primary/20"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>

            <GenericForm<LoginInput>
          title="Sign In"
          description="Enter your credentials to access your account"
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
              enablePasswordToggle: true,
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
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    New Here?
                  </span>
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <div className="text-sm text-muted-foreground">
                  Don't have an account?
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(ROUTES.SIGNUP)}
                    className="flex-1 border-primary/20 hover:border-primary/50"
                  >
                    Sign up as Student/Staff
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(ROUTES.SIGNUP_VENDOR)}
                    className="flex-1 border-primary/20 hover:border-primary/50"
                  >
                    Sign up as Vendor
                  </Button>
                </div>
              </div>
            </>
          }
        />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
