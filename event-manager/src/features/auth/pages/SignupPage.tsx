/**
 * Academic Signup Page
 * 
 * Beautiful animated signup page for academic users
 * Uses Framer Motion for smooth transitions
 */

import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { AcademicSignupForm } from '../components/AcademicSignupForm';
import { ROUTES } from '@/lib/constants';
import { ArrowLeft, Building2, GraduationCap, Calendar, Award, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: 0.3
    }
  }
};

export function SignupPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    setTimeout(() => {
      navigate(ROUTES.LOGIN);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 items-center justify-center">
        {/* Floating Background Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 left-20"
          >
            <GraduationCap className="w-16 h-16 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute bottom-20 right-20"
          >
            <Calendar className="w-16 h-16 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-1/2 right-10"
          >
            <Award className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity }}
            className="absolute top-1/3 left-10"
          >
            <BookOpen className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 6.5, repeat: Infinity }}
            className="absolute bottom-32 left-1/3"
          >
            <Users className="w-14 h-14 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -25, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-1/4 right-1/4"
          >
            <GraduationCap className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.div
            animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute bottom-1/3 right-1/3"
          >
            <Calendar className="w-11 h-11 text-primary" />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 360], scale: [1, 1.15, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-2/3 left-1/4"
          >
            <Award className="w-9 h-9 text-primary" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
            transition={{ duration: 6.8, repeat: Infinity }}
            className="absolute top-16 right-12"
          >
            <BookOpen className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.25, 1], rotate: [0, -15, 0] }}
            transition={{ duration: 8.5, repeat: Infinity }}
            className="absolute bottom-16 left-16"
          >
            <Users className="w-11 h-11 text-primary" />
          </motion.div>
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
            transition={{ duration: 7.2, repeat: Infinity }}
            className="absolute top-1/2 left-1/4"
          >
            <Award className="w-10 h-10 text-primary" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md space-y-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-8 bg-primary/30 blur-2xl rounded-full animate-pulse" />
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
                Join Campus Events
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Create your academic account to get started
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <img 
                src="/logo.png" 
                alt="Campus Events Platform" 
                className="relative w-80 h-80 object-contain drop-shadow-xl"
              />
            </div>
          </div>

          {/* Mobile Heading */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Join Campus Events</h1>
            <p className="text-muted-foreground">Create your academic account</p>
          </div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2"
            >
              <Link to={ROUTES.LOGIN}>
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </motion.div>

          {/* Main Content */}
          <AcademicSignupForm onSuccess={handleSuccess} />

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center space-y-3"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Are you a vendor?{' '}
              <Link
                to={ROUTES.SIGNUP_VENDOR}
                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <Building2 className="h-3.5 w-3.5" />
                Sign up as Vendor
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
