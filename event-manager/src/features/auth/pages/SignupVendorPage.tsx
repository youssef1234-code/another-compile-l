/**
 * Vendor Signup Page
 * 
 * Beautiful animated signup page for vendors
 * Uses Framer Motion for smooth transitions
 */

import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { VendorSignupForm } from '../components/VendorSignupForm';
import { ROUTES } from '@/lib/constants';
import { ArrowLeft, GraduationCap, Store, ShoppingBag, QrCode, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export function SignupVendorPage() {
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
      <div className="hidden lg:flex lg:w-2/5 relative bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background p-12 items-center justify-center">
        {/* Floating Background Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 left-20"
          >
            <Store className="w-16 h-16 text-blue-600" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute bottom-20 right-20"
          >
            <ShoppingBag className="w-16 h-16 text-blue-600" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/2 right-10"
          >
            <QrCode className="w-12 h-12 text-blue-600" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-1/3 left-10"
          >
            <TrendingUp className="w-12 h-12 text-blue-600" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -15, 0] }}
            transition={{ duration: 5.5, repeat: Infinity }}
            className="absolute top-40 right-1/3"
          >
            <Store className="w-10 h-10 text-blue-500" />
          </motion.div>
          <motion.div
            animate={{ x: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute bottom-40 left-1/4"
          >
            <ShoppingBag className="w-14 h-14 text-blue-400" />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, -360], y: [0, -20, 0] }}
            transition={{ duration: 9, repeat: Infinity }}
            className="absolute top-1/4 right-1/4"
          >
            <QrCode className="w-9 h-9 text-blue-500" />
          </motion.div>
          <motion.div
            animate={{ x: [0, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 6.5, repeat: Infinity }}
            className="absolute bottom-1/3 right-16"
          >
            <TrendingUp className="w-11 h-11 text-blue-600" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 25, 0], rotate: [0, 12, 0] }}
            transition={{ duration: 7.5, repeat: Infinity }}
            className="absolute top-16 left-1/3"
          >
            <Store className="w-8 h-8 text-blue-400" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, 10, 0] }}
            transition={{ duration: 8.5, repeat: Infinity }}
            className="absolute bottom-16 right-1/3"
          >
            <ShoppingBag className="w-10 h-10 text-blue-500" />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 180], y: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-2/3 left-16"
          >
            <QrCode className="w-7 h-7 text-blue-600" />
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
              <div className="absolute -inset-8 bg-blue-500/30 blur-2xl rounded-full animate-pulse" />
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
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Become a Vendor Partner
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Join our marketplace and reach thousands of students
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
          className="w-full max-w-2xl"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
              <img 
                src="/logo.png" 
                alt="Campus Events Platform" 
                className="relative w-32 h-32 object-contain drop-shadow-xl"
              />
            </div>
          </div>

          {/* Mobile Heading */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Become a Vendor Partner</h1>
            <p className="text-muted-foreground">Join our marketplace</p>
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
          <VendorSignupForm onSuccess={handleSuccess} />

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
              Are you a student, staff, or professor?{' '}
              <Link
                to={ROUTES.SIGNUP}
                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Sign up as Academic
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
