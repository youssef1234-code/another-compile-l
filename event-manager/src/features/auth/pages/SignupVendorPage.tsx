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
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function SignupVendorPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    setTimeout(() => {
      navigate(ROUTES.LOGIN);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-4xl">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
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
          className="mt-4 text-center space-y-3"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-br from-slate-50 to-slate-100 px-2 text-muted-foreground">
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
