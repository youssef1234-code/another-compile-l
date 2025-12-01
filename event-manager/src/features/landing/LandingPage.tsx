/**
 * Landing Page - Another Compile L
 * 
 * Modern, professional landing page with advanced animations
 * Features glassmorphism, gradient backgrounds, smooth interactions, and 3D effects
 */

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
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
  TrendingUp,
  Play,
  Shield,
  Zap,
  Heart,
  Bell,
  Award,
  BookOpen,
  MessagesSquare,
  MapPin,
  Package,
  CheckCircle,
  Coffee,
  Briefcase,
  Music,
  Rocket,
  Target,
  Lightbulb,
  Gift,
  Crown,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const FloatingIcon = ({ 
  icon: Icon, 
  delay = 0,
  duration = 3,
  x = 0,
  y = 0 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  delay?: number; 
  duration?: number;
  x?: number;
  y?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ 
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.15, 1],
        y: [y, y - 25, y],
        rotate: 0
      }}
      transition={{
        opacity: { duration, delay, repeat: Infinity, ease: "easeInOut" },
        scale: { duration, delay, repeat: Infinity, ease: "easeInOut" },
        y: { duration, delay, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1], type: "spring" }
      }}
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <Icon className="w-10 h-10 text-primary/50" />
    </motion.div>
  );
};

// 3D Image Component with amazing hover effect and tilt
const Image3D = ({ 
  srcLight,
  srcDark,
  alt, 
  direction = 'left' 
}: { 
  srcLight: string;
  srcDark: string;
  alt: string; 
  direction?: 'left' | 'right';
}) => {
  const isRight = direction === 'right';
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 60, rotateX: -15, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : {}}
      transition={{ 
        duration: 0.8,
        ease: [0.34, 1.56, 0.64, 1],
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className="group relative aspect-[4/3] w-full"
    >
      <div className="perspective-distant transform-3d">
        {/* Animated background glow */}
        <div className="absolute sm:-inset-8 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-1000 blur-3xl" />

        {/* Main 3D container with tilt on hover */}
        <div className="relative size-full transform-3d group-hover:[transform:rotateX(8deg)_rotateY(12deg)_translateZ(16px)] transition-all duration-700 ease-out">
          {/* Depth layer for 3D effect */}
          <div className="absolute inset-0 translate-y-4 translate-x-2 rounded-2xl [transform:translateZ(-8px)]">
            <div className="size-full rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background/40 to-secondary/10 shadow-xl" />
          </div>

          {/* Main image container */}
          <div className="relative z-10 size-full rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">
            {/* Shimmer effect */}
            <div className={cn(
              "absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -skew-x-12 transition-transform duration-1000 ease-out pointer-events-none",
              isRight
                ? "translate-x-full group-hover:-translate-x-full"
                : "-translate-x-full group-hover:translate-x-full"
            )} />

            {/* Actual screenshot images - light/dark theme support */}
            <img 
              src={srcLight} 
              alt={alt}
              className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-105 dark:hidden"
            />
            <img 
              src={srcDark} 
              alt={alt}
              className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-105 hidden dark:block"
            />

            {/* Border highlight */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 dark:ring-white/10 group-hover:ring-primary/40 transition-all duration-500" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string; 
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ 
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.34, 1.56, 0.64, 1],
        type: "spring",
        stiffness: 100
      }}
    >
      <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 h-full bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:-translate-y-2">
        <CardContent className="p-8 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-muted-foreground leading-relaxed text-base">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.98]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, 50]);

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

  const mainFeatures = [
    {
      icon: Package,
      title: 'Event Management',
      description: 'Complete event lifecycle from creation to attendance tracking.'
    },
    {
      icon: Users,
      title: 'Multi-Role Support',
      description: 'Students, professors, vendors, and staff all in one platform.'
    },
    {
      icon: Bell,
      title: 'Real-time Notifications',
      description: 'Stay updated with instant alerts for events and registrations.'
    },
    {
      icon: Award,
      title: 'Certificates & Rewards',
      description: 'Automatic certificate generation and loyalty point system.'
    }
  ];

  const secondaryFeatures = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with modern tech for optimal performance.'
    },
    {
      icon: Heart,
      title: 'User-Friendly',
      description: 'Intuitive interface designed for campus life.'
    },
    {
      icon: CheckCircle,
      title: 'Reliable & Secure',
      description: 'Enterprise-grade security for all transactions.'
    },
    {
      icon: MessagesSquare,
      title: 'Feedback System',
      description: 'Rate and review events to help improve experiences.'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 transition-all duration-300">
        <div className="container flex h-20 items-center justify-between px-4 mx-auto">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/favicon.png" alt="Another Compile L" className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <span className="font-bold text-2xl">Another Compile L</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#cta" className="text-muted-foreground hover:text-foreground transition-colors">Get Started</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link to={ROUTES.LOGIN}>Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={ROUTES.SIGNUP}>Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        style={{ opacity, scale, y }}
        className="relative overflow-hidden bg-gradient-to-b from-background via-background to-primary/5 pt-20 sm:pt-32 pb-24"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
          {/* Left side icons */}
          <FloatingIcon icon={GraduationCap} x={3} y={15} delay={0} />
          <FloatingIcon icon={Dumbbell} x={8} y={65} delay={1} duration={4} />
          <FloatingIcon icon={Store} x={5} y={40} delay={0.8} duration={3.8} />
          <FloatingIcon icon={Star} x={12} y={28} delay={0.6} duration={4.2} />
          <FloatingIcon icon={Heart} x={4} y={52} delay={1.1} duration={3.9} />
          <FloatingIcon icon={Award} x={15} y={80} delay={1.3} duration={4.1} />
          <FloatingIcon icon={MessagesSquare} x={7} y={90} delay={1.4} duration={4.3} />
          <FloatingIcon icon={CheckCircle} x={2} y={75} delay={0.85} duration={3.5} />
          <FloatingIcon icon={Rocket} x={10} y={48} delay={0.95} duration={3.9} />
          <FloatingIcon icon={Lightbulb} x={6} y={22} delay={0.55} duration={3.7} />
          <FloatingIcon icon={Crown} x={14} y={58} delay={0.75} duration={3.6} />
          <FloatingIcon icon={TrendingUp} x={9} y={35} delay={0.42} duration={3.85} />
          <FloatingIcon icon={BookOpen} x={11} y={8} delay={0.7} duration={3.4} />
          <FloatingIcon icon={Zap} x={16} y={95} delay={0.35} duration={3.8} />
          
          {/* Right side icons */}
          <FloatingIcon icon={Ticket} x={92} y={18} delay={0.5} duration={3.5} />
          <FloatingIcon icon={Calendar} x={95} y={62} delay={0.3} duration={3.2} />
          <FloatingIcon icon={Trophy} x={97} y={42} delay={1.2} duration={3.3} />
          <FloatingIcon icon={Users} x={90} y={78} delay={1.5} duration={3.7} />
          <FloatingIcon icon={Bell} x={88} y={28} delay={0.9} duration={3.6} />
          <FloatingIcon icon={MapPin} x={96} y={52} delay={0.2} duration={3.1} />
          <FloatingIcon icon={Package} x={85} y={45} delay={1.6} duration={4.2} />
          <FloatingIcon icon={Coffee} x={98} y={25} delay={1.7} duration={4.4} />
          <FloatingIcon icon={Briefcase} x={91} y={85} delay={0.65} duration={3.3} />
          <FloatingIcon icon={Music} x={94} y={8} delay={1.25} duration={4.6} />
          <FloatingIcon icon={Target} x={87} y={70} delay={1.8} duration={4.3} />
          <FloatingIcon icon={Gift} x={93} y={92} delay={1.45} duration={4.5} />
          <FloatingIcon icon={Code} x={89} y={12} delay={1.95} duration={4.1} />
          <FloatingIcon icon={Shield} x={86} y={35} delay={1.05} duration={4.25} />
          <FloatingIcon icon={Play} x={96} y={88} delay={1.55} duration={4.35} />
          <FloatingIcon icon={CreditCard} x={84} y={58} delay={0.4} duration={4.5} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            {/* Announcement Badge */}
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.7,
                ease: [0.34, 1.56, 0.64, 1],
                type: "spring",
                stiffness: 120,
                damping: 12
              }}
              className="flex justify-center"
            >
              <Badge variant="outline" className="px-4 py-2 border-primary/50">
                <Sparkles className="w-3 h-3 mr-2" />
                Everything your university needs
                <ArrowRight className="w-3 h-3 ml-2" />
              </Badge>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.9,
                delay: 0.15,
                ease: [0.34, 1.56, 0.64, 1],
                type: "spring",
                stiffness: 80
              }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Build Better
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {" "}Campus Experiences{" "}
                </span>
                with Unified Event Management
              </h1>

              {/* Subtitle */}
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Manage workshops, trips, bazaars, conferences, and gym sessions. 
                Connect students, staff, professors, and vendors in one seamless platform.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8,
                delay: 0.35,
                ease: [0.34, 1.56, 0.64, 1],
                type: "spring",
                stiffness: 100
              }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 120 }}
              >
              <Button 
                asChild 
                size="lg" 
                className="text-base px-8 py-6 group shadow-raised hover:shadow-overlay transition-all"
              >
                <Link to={ROUTES.SIGNUP}>
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 120 }}
              >
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="text-base px-8 py-6 border-2 hover:border-primary/50"
              >
                <Link to={ROUTES.LOGIN}>
                  <Play className="mr-2 h-4 w-4" />
                  View Demo
                </Link>
              </Button>
              </motion.div>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-2 justify-center pt-4"
            >
              {[
                { icon: CheckCircle2, text: 'Free to start' },
                { icon: Shield, text: 'Secure payments' },
                { icon: Zap, text: 'Instant setup' },
                { icon: Heart, text: 'Student focused' }
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5,
                    delay: 0.7 + index * 0.08,
                    type: "spring",
                    stiffness: 150,
                    damping: 12
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.text}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Hero Visual/Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 1.2,
              delay: 0.5,
              ease: [0.34, 1.56, 0.64, 1],
              type: "spring",
              stiffness: 60
            }}
            className="mx-auto mt-20 max-w-5xl"
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-[90%] h-80 bg-primary/50 rounded-full blur-3xl" />
              
              <div className="relative rounded-xl border-2 border-primary/20 bg-card shadow-2xl overflow-hidden">
                {/* Dashboard screenshots with theme support */}
                <div className="bg-gradient-to-br from-muted/50 to-background">
                  <img 
                    src="/src/assets/dashboard-light.png" 
                    alt="Dashboard Preview" 
                    className="w-full h-auto dark:hidden"
                  />
                  <img 
                    src="/src/assets/dasboard-dark.png" 
                    alt="Dashboard Preview" 
                    className="w-full h-auto hidden dark:block"
                  />
                </div>
                
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-b from-background/0 via-background/70 to-background rounded-b-xl" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section with 3D Images - ONLY THIS SECTION FROM NEW IMPLEMENTATION */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-24 sm:py-32 bg-gradient-to-b from-primary/5 via-muted/40 to-primary/10 relative"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-2xl text-center mb-20">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">Platform Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Everything you need to manage campus events
            </h2>
            <p className="text-lg text-muted-foreground">
              A comprehensive platform designed for universities to streamline event management, 
              payments, registrations, and community engagement.
            </p>
          </div>

          {/* First Feature with 3D Image */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 mb-32">
            <Image3D
              srcLight="/src/assets/events-page-light.png"
              srcDark="/src/assets/events-page-dark.png"
              alt="Events Management Dashboard"
              direction="left"
            />
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold tracking-tight">
                  Comprehensive Event Management
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  From workshops to conferences, bazaars to gym sessions - manage all campus events 
                  from a single, intuitive platform with powerful features.
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2">
                {mainFeatures.map((feature, index) => (
                  <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-3 rounded-lg transition-colors">
                    <div className="mt-0.5 flex shrink-0 items-center justify-center">
                      <feature.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link to={ROUTES.SIGNUP}>
                    Get Started
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to={ROUTES.LOGIN}>
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Second Feature with 3D Image - Flipped */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8 order-2 lg:order-1">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold tracking-tight">
                  Built for modern campus life
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Seamless integration with your campus workflow. Real-time updates, mobile-first design, 
                  and features that make event participation effortless.
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2">
                {secondaryFeatures.map((feature, index) => (
                  <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-3 rounded-lg transition-colors">
                    <div className="mt-0.5 flex shrink-0 items-center justify-center">
                      <feature.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <Image3D
              srcLight="/src/assets/users-table-light.png"
              srcDark="/src/assets/users-table-dark.png"
              alt="User Management"
              direction="right"
            />
          </div>
        </div>
      </motion.section>

      {/* Original Features Grid */}
      <motion.section 
        id="features" 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative py-32 sm:py-40 bg-gradient-to-b from-background via-muted/10 to-muted/30"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ 
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1],
              type: "spring",
              stiffness: 100
            }}
            className="mx-auto max-w-3xl text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              whileInView={{ scale: 1, opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.7,
                delay: 0.1,
                type: "spring",
                stiffness: 120
              }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-2 text-sm font-medium border-primary/30 bg-primary/5">Platform Features</Badge>
            </motion.div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Everything you need to manage campus events seamlessly
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Our platform provides comprehensive tools for students, staff, professors, and vendors to connect and engage.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>

          {/* Highlighted Feature Section */}
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 mt-24">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <Badge variant="outline">Smart Management</Badge>
              <h3 className="text-3xl font-bold tracking-tight">
                Streamline event operations with intelligent automation
              </h3>
              <p className="text-muted-foreground text-lg">
                From professor workshop submissions to student registrations, automated approvals, integrated payments, and instant notifications - manage everything effortlessly.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: CheckCircle2, text: 'Automated approval workflows' },
                  { icon: CheckCircle2, text: 'Integrated payment processing' },
                  { icon: CheckCircle2, text: 'Real-time notifications' },
                  { icon: CheckCircle2, text: 'Digital certificates & QR codes' }
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-8 shadow-xl">
                <div className="aspect-square flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {[GraduationCap, Store, Dumbbell, Calendar].map((Icon, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                        className="aspect-square rounded-lg bg-background border border-primary/20 flex items-center justify-center"
                      >
                        <Icon className="w-12 h-12 text-primary" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section 
        id="cta" 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative py-20 px-4 bg-gradient-to-b from-muted/20 via-primary/5 to-background"
      >
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
      </motion.section>

      {/* Footer */}
      <footer className="relative py-16 px-4 border-t border-border bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
            {/* Left - Logo and Description */}
            <div className="md:col-span-4 space-y-6">
                <Link to="/" className="inline-block group">
                  <div className="h-24 w-auto overflow-hidden">
                    <img 
                      src="/logo.png" 
                      alt="Another Compile L" 
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </Link>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                Everything your university needs in one place. Manage events, registrations, and campus activities seamlessly.
              </p>
            </div>

            {/* Right - Navigation Links */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Product */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Product</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#cta" className="text-muted-foreground hover:text-primary transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <Link to={ROUTES.SIGNUP} className="text-muted-foreground hover:text-primary transition-colors">
                      Get Started
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Account */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Account</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to={ROUTES.LOGIN} className="text-muted-foreground hover:text-primary transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to={ROUTES.SIGNUP} className="text-muted-foreground hover:text-primary transition-colors">
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link to={ROUTES.SIGNUP_VENDOR} className="text-muted-foreground hover:text-primary transition-colors">
                      Vendor Signup
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#cta" className="text-muted-foreground hover:text-primary transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                      Help Center
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-muted-foreground text-sm">
                © {new Date().getFullYear()} Another Compile L. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
