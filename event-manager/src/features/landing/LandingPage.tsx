/**
 * Landing Page - Campus Events Platform
 * 
 * Modern, minimalist landing page with animated elements
 * Showcases platform features with consistent color system
 */

import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Ticket, 
  Dumbbell,
  Calendar,
  CreditCard,
  Store,
  Star,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/lib/constants';
import { ThemeToggle } from '@/components/theme-toggle';

const FloatingIcon = ({ 
  icon: Icon, 
  delay = 0,
  duration = 3,
  x = 0,
  y = 0 
}: { 
  icon: any; 
  delay?: number; 
  duration?: number;
  x?: number;
  y?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.1, 1],
        y: [y, y - 20, y],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <Icon className="w-8 h-8 text-primary/30" />
    </motion.div>
  );
};

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="group hover:shadow-raised transition-all duration-300 border-2 hover:border-primary/20 h-full">
        <CardContent className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const features = [
    {
      icon: GraduationCap,
      title: "Workshops & Conferences",
      description: "Professors submit workshops, get approval from events office, students register and pay"
    },
    {
      icon: CreditCard,
      title: "Easy Registration & Payments",
      description: "Book events, pay with Stripe or wallet, get certificates of attendance"
    },
    {
      icon: Store,
      title: "Bazaars & Vendor Booths",
      description: "Vendors apply, get QR codes, students vote on which vendors to invite"
    },
    {
      icon: Star,
      title: "Rate & Review Events",
      description: "Comment on events you attended, add favorites, get notifications"
    },
    {
      icon: Dumbbell,
      title: "Sports & Gym Sessions",
      description: "Reserve courts (basketball, tennis, football), register for gym sessions"
    },
    {
      icon: TrendingUp,
      title: "Loyalty Program",
      description: "Earn points, track your engagement, unlock rewards and special access"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingIcon icon={GraduationCap} x={10} y={20} delay={0} />
        <FloatingIcon icon={Ticket} x={85} y={15} delay={0.5} duration={3.5} />
        <FloatingIcon icon={Dumbbell} x={15} y={70} delay={1} duration={4} />
        <FloatingIcon icon={Calendar} x={90} y={65} delay={0.3} duration={3.2} />
        <FloatingIcon icon={Store} x={5} y={45} delay={0.8} duration={3.8} />
        <FloatingIcon icon={Trophy} x={92} y={40} delay={1.2} duration={3.3} />
      </div>

      {/* Hero Section */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20"
      >
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <img 
                src="/logo.png" 
                alt="Campus Events Platform" 
                className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Campus Events Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Everything your university needs in one place
            </p>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Manage workshops, trips, bazaars, conferences, gym sessions and more. 
            Students, staff, and professors all connected.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-8 py-6 group shadow-raised hover:shadow-overlay transition-all"
            >
              <Link to={ROUTES.SIGNUP}>
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-2 hover:border-primary/50"
            >
              <Link to={ROUTES.LOGIN}>
                Sign In
              </Link>
            </Button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap gap-3 justify-center pt-8"
          >
            {['Events', 'Payments', 'Bazaars', 'Sports', 'Reviews'].map((tag) => (
              <div
                key={tag}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
              >
                {tag}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-sm">Explore Features</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5 rotate-90" />
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-4xl md:text-5xl font-bold">Platform Features</h2>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage campus events seamlessly
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 bg-primary/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: Users, label: 'Active Users', value: '1,000+' },
              { icon: Calendar, label: 'Events Hosted', value: '500+' },
              { icon: CheckCircle2, label: 'Success Rate', value: '99%' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of students, staff, and professors already using our platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-8 py-6 group shadow-raised hover:shadow-overlay transition-all"
            >
              <Link to={ROUTES.SIGNUP}>
                Create Account
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-2 hover:border-primary/50"
            >
              <Link to={ROUTES.LOGIN}>
                Already have an account?
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="Campus Events Platform" 
              className="w-12 h-12 object-contain opacity-80"
            />
          </div>
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Campus Events Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
