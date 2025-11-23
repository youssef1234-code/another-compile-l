/**
 * Landing Page - Campus Events Platform
 * 
 * Modern, professional landing page with advanced animations
 * Features glassmorphism, gradient backgrounds, and smooth interactions
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
  TrendingUp,
  Play,
  Shield,
  Zap,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Campus Events" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg hidden sm:inline">Campus Events</span>
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
          <FloatingIcon icon={GraduationCap} x={10} y={20} delay={0} />
          <FloatingIcon icon={Ticket} x={85} y={15} delay={0.5} duration={3.5} />
          <FloatingIcon icon={Dumbbell} x={15} y={70} delay={1} duration={4} />
          <FloatingIcon icon={Calendar} x={90} y={65} delay={0.3} duration={3.2} />
          <FloatingIcon icon={Store} x={5} y={45} delay={0.8} duration={3.8} />
          <FloatingIcon icon={Trophy} x={92} y={40} delay={1.2} duration={3.3} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            {/* Announcement Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
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

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap gap-2 justify-center pt-4"
            >
              {[
                { icon: CheckCircle2, text: 'Free to start' },
                { icon: Shield, text: 'Secure payments' },
                { icon: Zap, text: 'Instant setup' },
                { icon: Heart, text: 'Student focused' }
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Visual/Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mx-auto mt-20 max-w-5xl"
          >
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-[90%] h-80 bg-primary/50 rounded-full blur-3xl" />
              
              <div className="relative rounded-xl border-2 border-primary/20 bg-card shadow-2xl overflow-hidden">
                {/* Logo as placeholder - replace with actual screenshot */}
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
                  <div className="text-center space-y-4">
                    <img 
                      src="/logo.png" 
                      alt="Platform Preview" 
                      className="w-32 h-32 mx-auto object-contain opacity-80"
                    />
                    <p className="text-muted-foreground">Dashboard Preview</p>
                  </div>
                </div>
                
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-background/0 via-background/70 to-background rounded-b-xl" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="relative py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Platform Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need to manage campus events seamlessly
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform provides comprehensive tools for students, staff, professors, and vendors to connect and engage.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
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
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Trusted Platform</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Join thousands of users already benefiting
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, label: 'Active Users', value: '1,000+', description: 'Students & Staff' },
              { icon: Calendar, label: 'Events Hosted', value: '500+', description: 'Monthly Average' },
              { icon: CheckCircle2, label: 'Success Rate', value: '99%', description: 'Event Completion' },
              { icon: Trophy, label: 'Satisfaction', value: '4.9/5', description: 'User Rating' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-raised transition-all duration-300 border-2 hover:border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-4xl font-bold text-primary">{stat.value}</div>
                      <div className="font-semibold">{stat.label}</div>
                      <div className="text-sm text-muted-foreground">{stat.description}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
