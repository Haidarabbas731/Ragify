import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  FileText,
  Folder,
  Link,
  Upload,
  Zap,
  Share2,
  Twitter,
  Github,
  Linkedin,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ThreeBackground } from '../components/landing/ThreeBackground';
import { LandingNav } from '../components/layout/LandingNav';
import { FeatureCard } from '../components/landing/FeatureCard';
import { StepCard } from '../components/landing/StepCard';

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(badgeRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
      })
        .from(
          headlineRef.current,
          {
            y: 60,
            opacity: 0,
            duration: 1,
          },
          '-=0.5'
        )
        .from(
          subheadRef.current,
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
          },
          '-=0.6'
        )
        .from(
          ctaRef.current?.children || [],
          {
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.15,
          },
          '-=0.4'
        );

      // Badge icon rotation
      const badgeSvg = badgeRef.current?.querySelector('svg');
      if (badgeSvg) {
        gsap.to(badgeSvg, {
          rotation: 360,
          duration: 8,
          repeat: -1,
          ease: 'linear',
        });
      }

      // Features scroll animation
      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.from(featuresRef.current?.querySelectorAll('.feature-card') || [], {
            y: 60,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'back.out(1.7)',
          });
        },
        once: true,
      });

      // Steps scroll animation
      ScrollTrigger.create({
        trigger: stepsRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.from(stepsRef.current?.querySelectorAll('.step-card') || [], {
            y: 60,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'back.out(1.7)',
          });
        },
        once: true,
      });

      // CTA section animation
      ScrollTrigger.create({
        trigger: ctaSectionRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.from(ctaSectionRef.current?.children || [], {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
          });
        },
        once: true,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: 'RAG-Powered Chat',
      description:
        'Ask questions and get intelligent answers powered by Retrieval-Augmented Generation. Your documents become a conversational knowledge base.',
      gradientFrom: '#a855f7',
      gradientTo: '#6366f1',
    },
    {
      icon: FileText,
      title: 'Multi-Format Support',
      description:
        'Upload PDFs, Word documents, text files, and Markdown. Up to 50MB per file with intelligent chunking for optimal processing.',
      gradientFrom: '#6366f1',
      gradientTo: '#8b5cf6',
    },
    {
      icon: Folder,
      title: 'Smart Organization',
      description:
        'Create collections to organize your documents by topic, project, or category. Keep your knowledge base structured and searchable.',
      gradientFrom: '#8b5cf6',
      gradientTo: '#ec4899',
    },
    {
      icon: Link,
      title: 'Source Citations',
      description:
        'Every answer includes citations showing exactly which documents and sections were used. Full transparency in AI responses.',
      gradientFrom: '#ec4899',
      gradientTo: '#a855f7',
    },
  ];

  const steps = [
    {
      number: '01',
      icon: Upload,
      title: 'Upload Documents',
      description: 'Drag and drop your documents (PDF, DOCX, TXT, MD) into Ragify.',
    },
    {
      number: '02',
      icon: Zap,
      title: 'AI Processes & Indexes',
      description:
        'Our AI automatically chunks, processes, and indexes your documents for semantic search.',
    },
    {
      number: '03',
      icon: MessageSquare,
      title: 'Chat & Get Answers',
      description: 'Ask questions in natural language. Get instant answers with source citations.',
    },
    {
      number: '04',
      icon: Share2,
      title: 'Share Knowledge',
      description: 'Organize documents into collections and invite teammates to collaborate.',
    },
  ];

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden">
      <ThreeBackground />

      <LandingNav />

      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-6 pt-20"
      >
        {/* Decorative orbs */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-primary/15 to-indigo-500/15 rounded-full blur-3xl float" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl float-delayed" />

        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Powered by Advanced RAG Technology</span>
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6"
          >
            Your Documents,
            <br />
            <span className="gradient-text">Supercharged with AI</span>
          </h1>

          {/* Subheadline */}
          <p
            ref={subheadRef}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Transform your knowledge base with AI-powered search and chat. Instant answers from
            your documents.
          </p>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="px-8 py-6 text-lg glow-primary hover:glow-primary-intense transition-all hover:-translate-y-1"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg group border-primary/50 hover:bg-primary/10"
            >
              Watch Demo
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Why Choose <span className="gradient-text">Ragify</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to turn documents into intelligent knowledge
            </p>
          </div>

          {/* Features Grid */}
          <div
            ref={featuresRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto"
          >
            {features.map((feature, index) => (
              <div key={feature.title} className="feature-card">
                <FeatureCard {...feature} delay={index * 100} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Get Started in <span className="gradient-text">4 Steps</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              From documents to intelligent answers in minutes
            </p>
          </div>

          {/* Steps */}
          <div
            ref={stepsRef}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 max-w-6xl mx-auto"
          >
            {steps.map((step, index) => (
              <div key={step.number} className="step-card">
                <StepCard {...step} isLast={index === steps.length - 1} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10" />

        {/* Floating orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-full blur-3xl float" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-gradient-to-br from-violet-500/15 to-pink-500/15 rounded-full blur-3xl float-delayed" />

        <div
          ref={ctaSectionRef}
          className="container mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-6">
            Ready to Transform Your Knowledge?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Start using Ragify today. Free to get started, upgrade anytime.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="px-10 py-6 text-lg glow-primary hover:glow-primary-intense transition-all hover:-translate-y-1"
            >
              Start Free Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-10 py-6 text-lg border-primary/50 hover:bg-primary/10"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border bg-card">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/ragify.png" alt="Ragify" className="w-10 h-10" />
                <span className="text-xl font-display font-bold">Ragify</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Your AI-Powered Knowledge Hub
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-display font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Documentation', 'Changelog'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-display font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Social */}
            <div>
              <h4 className="font-display font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 mb-6">
                {['Privacy Policy', 'Terms of Service'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Ragify. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
