# Ragify Landing Page - Purple Theme Redesign with Animations

You are creating a modern, AI-powered landing page for **Ragify**, a Retrieval-Augmented Generation (RAG) knowledge base platform. The page must use a purple-based OKLCH color theme with dynamic GSAP animations and immersive Three.js background effects.

---

## 🎨 Brand & Design System

### Color Palette (Purple OKLCH Theme)

#### Light Mode
- **Primary:** `oklch(0.5417 0.1790 288.0332)` - Rich purple
- **Primary Foreground:** `oklch(1.0000 0 0)` - Pure white
- **Secondary:** `oklch(0.9174 0.0435 292.6901)` - Light purple
- **Secondary Foreground:** `oklch(0.4143 0.1039 288.1742)` - Dark purple text
- **Accent:** `oklch(0.9221 0.0373 262.1410)` - Light violet
- **Accent Foreground:** `oklch(0.3015 0.0572 282.4176)` - Dark text
- **Background:** `oklch(0.9730 0.0133 286.1503)` - Off-white
- **Foreground:** `oklch(0.3015 0.0572 282.4176)` - Dark gray/black
- **Card:** `oklch(1.0000 0 0)` - Pure white
- **Card Foreground:** `oklch(0.3015 0.0572 282.4176)` - Dark text
- **Muted:** `oklch(0.9580 0.0133 286.1454)` - Light gray
- **Muted Foreground:** `oklch(0.5426 0.0465 284.7435)` - Medium gray
- **Border:** `oklch(0.9115 0.0216 285.9625)` - Light border
- **Destructive:** `oklch(0.6861 0.2061 14.9941)` - Red

#### Dark Mode
- **Primary:** `oklch(0.7162 0.1597 290.3962)` - Bright purple
- **Primary Foreground:** `oklch(0.1743 0.0227 283.7998)` - Very dark background
- **Secondary:** `oklch(0.3139 0.0736 283.4591)` - Dark purple
- **Secondary Foreground:** `oklch(0.8367 0.0849 285.9111)` - Light text
- **Accent:** `oklch(0.3354 0.0828 280.9705)` - Dark violet
- **Accent Foreground:** `oklch(0.9185 0.0257 285.8834)` - Light text
- **Background:** `oklch(0.1743 0.0227 283.7998)` - Very dark
- **Foreground:** `oklch(0.9185 0.0257 285.8834)` - Almost white
- **Card:** `oklch(0.2284 0.0384 282.9324)` - Dark card
- **Card Foreground:** `oklch(0.9185 0.0257 285.8834)` - Light text
- **Muted:** `oklch(0.2710 0.0621 281.4377)` - Medium dark
- **Muted Foreground:** `oklch(0.7166 0.0462 285.1741)` - Medium light text
- **Border:** `oklch(0.3261 0.0597 282.5832)` - Dark border
- **Destructive:** `oklch(0.6861 0.2061 14.9941)` - Red

### Gradient Spectrum
Use for animated gradients throughout:
- **Purple → Indigo:** `from-purple-600 to-indigo-600`
- **Purple → Violet:** `from-purple-600 to-violet-600`
- **Purple → Pink:** `from-purple-600 to-pink-600`
- **Indigo → Violet:** `from-indigo-600 to-violet-600`
- **All gradients should animate and shift direction**

### Typography
- **Headings (Hero/Main):** Source Serif 4 (serif) for elegance and premium feel
- **Headings (Section):** Geist or DM Sans (sans-serif)
- **Body Text:** Geist (sans-serif) for clarity
- **Code/Labels:** Geist Mono for technical elements
- **Modern Brand Alternative:** DM Sans, Space Grotesk encouraged for section headings
- **All fonts:** Use @fontsource packages, NO Google Fonts

### Brand Identity
- **Company Name:** Ragify (not "Knowledge Base")
- **Logo:** Use `/ragify.png` (compact, w-12 h-12) or `/ragify-full.png` (with text)
- **Tagline:** "Your AI-Powered Knowledge Hub"
- **Design Feel:** Premium, modern, tech-forward with playful animations

---

## 📱 Page Structure & Components

### 1. Navigation Bar

**Layout:**
- Logo (left): Ragify logo + "Ragify" text
- Links (center): Home, Features, How It Works, Pricing
- Controls (right): Dark mode toggle, "Get Started" button

**Styling:**
- Background: Semi-transparent with backdrop blur
- Dark mode: `bg-slate-900/80 dark:bg-slate-900/80`
- Light mode: `bg-white/80 light:bg-white/80`
- Sticky on scroll with subtle shadow

**Button States:**
- Normal: `bg-primary text-primary-foreground`
- Hover: Add glow effect with `text-shadow: 0 0 20px rgba(168, 85, 247, 0.6)`

**Animation:**
- Fade-in on page load (0.6s)
- Links: Scale and color shift on hover

---

### 2. Three.js Background (Full Page)

**Purpose:** Immersive, interactive animated background

**Technical Specs:**
- Three.js r128+ with WebGL
- Canvas: Full viewport, fixed positioning, z-index: -1
- Performance: 60fps target
- Responsive: Adapts to screen resize

**Visual Elements:**

#### Particle System
- **Count:** 150-200 particles
- **Color Scheme:** 
  - Light mode: Subtle purple particles `rgba(168, 85, 247, 0.3)`
  - Dark mode: Bright particles `rgba(168, 85, 247, 0.6)`
- **Size:** 2-8 pixel spheres
- **Movement:** 
  - Gentle floating motion (Y-axis oscillation)
  - X-axis drift (slow side-to-side)
  - Z-axis depth for parallax
- **Mouse Tracking:** Particles drift toward cursor (parallax effect)
- **Animation Speed:** 
  - Float cycle: 4-8 seconds per particle
  - Drift speed: 0.5-1.5 pixels/frame

#### Geometric Shapes (Optional)
- Wireframe cubes/spheres rotating slowly
- Gradient colors: Purple → Indigo → Violet
- Scale pulse: 0.8x to 1.2x continuously
- Opacity: 0.2-0.4

**Performance Optimization:**
- Use InstancedMesh for multiple particles
- Debounce mouse movement tracking (100ms)
- Disable on mobile devices via media query (or use reduced count: 50 particles)
- Geometry/Material disposal on component unmount

**Component:** `ThreeBackground.tsx`

---

### 3. Hero Section

**Goal:** Immediate impact with premium animations and clear value proposition

**Layout:**
- Container: Full viewport height, flex center, relative positioning
- Z-index: 10 (above Three.js background)
- Padding: px-6 top 20

**Content Structure:**

#### Badge (Above Headline)
```
[ICON] Powered by Advanced RAG Technology
```
- Icon: Sparkles or Zap (animated rotation)
- Border: `border-primary/30`
- Background: `bg-primary/10`
- Text: `text-primary`
- Border radius: Full rounded-full

**Animation:**
```javascript
// Continuous icon rotation
gsap.to(badgeIcon, {
  rotation: 360,
  duration: 8,
  repeat: -1,
  ease: "linear"
});

// Pulse scale
gsap.to(badge, {
  scale: [1, 1.05, 1],
  duration: 2,
  repeat: -1,
  ease: "sine.inOut"
});
```

#### Headline
```
Your Documents,
[Supercharged with AI]
```
- Font: Source Serif 4, 6xl-8xl (responsive)
- Text: "Your Documents," in `text-foreground`
- Gradient Text: "Supercharged with AI" with animated gradient
  ```css
  background: linear-gradient(90deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
  
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  ```

**Animation:**
```javascript
// Headline fade-in from bottom with blur
gsap.from(headlineRef.current, {
  y: 100,
  opacity: 0,
  blur: 10,
  duration: 1.2,
  delay: 0.3,
  ease: "power3.out"
});

// Character stagger reveal (optional)
gsap.to(headlineRef.current?.querySelectorAll('span'), {
  opacity: 1,
  duration: 0.8,
  stagger: 0.05,
  delay: 0.5
});
```

#### Subheadline
```
Transform your knowledge base with AI-powered search and chat. 
Instant answers from your documents.
```
- Font: Geist, text-xl
- Color: `text-muted-foreground`
- Max width: 2xl
- Margin top: mt-6

**Animation:**
```javascript
gsap.from(subheadRef.current, {
  y: 60,
  opacity: 0,
  duration: 1,
  delay: 0.8,
  ease: "power2.out"
});
```

#### CTA Buttons Container
Two buttons with staggered animation:

**Button 1: Primary CTA**
- Text: "Get Started Free"
- Background: `bg-primary`
- Text Color: `text-primary-foreground`
- Padding: px-8 py-3
- Border Radius: rounded-lg
- Box Shadow: `0 0 30px rgba(168, 85, 247, 0.4)`
- Hover: 
  - Scale: 1.05
  - Shadow: Intensify to `0 0 50px rgba(168, 85, 247, 0.8)`
  - Translate: -2px (lift up)

**Button 2: Secondary CTA**
- Text: "Watch Demo" + arrow icon
- Border: `border-2 border-primary`
- Background: transparent/white with opacity
- Text Color: `text-primary`
- Hover:
  - Background fill with semi-transparent primary
  - Arrow: Animate right `+10px`
  - Icon: Rotate 45deg

**Animation:**
```javascript
// Buttons entrance with stagger
gsap.from(ctaRef.current?.children || [], {
  y: 40,
  opacity: 0,
  duration: 0.8,
  stagger: 0.15,
  delay: 1.2,
  ease: "back.out(1.7)"
});

// On hover - primary button
gsap.to(primaryButton, {
  scale: 1.05,
  boxShadow: "0 0 50px rgba(168, 85, 247, 0.8)",
  y: -2,
  duration: 0.3
});
```

#### Decorative Orbs (Background)
Multiple floating spheres with gradient backgrounds:

**Orb 1 (Top Right):**
- Size: Large (w-64 h-64)
- Gradient: `from-primary to-indigo-600`
- Opacity: 0.15
- Position: -top-32 -right-32
- Blur: blur-3xl

**Orb 2 (Bottom Left):**
- Size: Medium (w-48 h-48)
- Gradient: `from-indigo-600 to-violet-600`
- Opacity: 0.1
- Position: -bottom-24 -left-24
- Blur: blur-3xl

**Animation:**
```javascript
// Orb 1: Float up-down with slight rotation
gsap.to(orb1, {
  y: -40,
  rotation: 360,
  duration: 8,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut"
});

// Orb 2: Float opposite direction with scale
gsap.to(orb2, {
  y: 50,
  x: -30,
  scale: [1, 1.1, 1],
  duration: 10,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
  delay: 1
});
```

---

### 4. Features Section

**Trigger:** Fade-in on scroll using ScrollTrigger

**Heading:**
```
Why Choose Ragify?
```
- Font: Source Serif 4 or DM Sans, 3xl-4xl
- Gradient: `from-foreground to-primary`
- Text animation: Animated gradient shift (same as hero)

**Subheading:**
```
Everything you need to turn documents into intelligent knowledge
```
- Font: Geist, text-lg
- Color: `text-muted-foreground`

**Feature Cards Grid (2x2 Desktop, 1 Column Mobile):**

#### Card Structure
Each card has:
- Icon (top, 3xl size, primary color)
- Title (bold, font-serif or DM Sans)
- Description (body text)
- Animated gradient border
- Background: `bg-card` with hover lift

#### Card 1: RAG-Powered Chat
- **Icon:** MessageSquare
- **Title:** "RAG-Powered Chat"
- **Description:** "Ask questions and get intelligent answers powered by Retrieval-Augmented Generation. Your documents become a conversational knowledge base."
- **Gradient:** `from-primary to-indigo-600`
- **Icon Animation:** Rotate continuously on hover

#### Card 2: Multi-Format Support
- **Icon:** FileText
- **Title:** "Multi-Format Support"
- **Description:** "Upload PDFs, Word documents, text files, and Markdown. Up to 50MB per file with intelligent chunking for optimal processing."
- **Gradient:** `from-indigo-600 to-violet-600`
- **Icon Animation:** Scale up/down on hover

#### Card 3: Smart Organization
- **Icon:** Folder
- **Title:** "Smart Organization"
- **Description:** "Create collections to organize your documents by topic, project, or category. Keep your knowledge base structured and searchable."
- **Gradient:** `from-violet-600 to-pink-600`
- **Icon Animation:** Bounce animation on hover

#### Card 4: Source Citations
- **Icon:** Link
- **Title:** "Source Citations"
- **Description:** "Every answer includes citations showing exactly which documents and sections were used. Full transparency in AI responses."
- **Gradient:** `from-pink-600 to-purple-600`
- **Icon Animation:** Rotate and scale on hover

**Card Styling:**
- Border: Animated gradient border (2px)
- Border animation: Flows around card perimeter
- Box shadow: `0 10px 30px rgba(0, 0, 0, 0.1)` light mode, `0 10px 30px rgba(0, 0, 0, 0.3)` dark mode
- Border radius: rounded-2xl
- Padding: p-6
- Hover effects:
  - Lift: `translateY(-10px)`
  - Border gradient: Animation speed increases
  - Icon: Rotate/scale based on card

**Animation Code:**
```javascript
// Cards entrance on scroll
ScrollTrigger.create({
  trigger: sectionRef.current,
  onEnter: () => {
    gsap.to(cardsRef.current?.children || [], {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: "back.out(1.7)"
    });
  }
});

// Animated gradient border (SVG/CSS)
const borderAnimation = gsap.to(cardBorder, {
  strokeDashoffset: -1000,
  duration: 3,
  repeat: -1,
  ease: "none"
});

// Card hover: Lift effect
gsap.to(card, {
  y: -10,
  boxShadow: "0 20px 50px rgba(168, 85, 247, 0.2)",
  duration: 0.3,
  overwrite: "auto"
});

// Icon hover animations
gsap.to(icon, {
  rotation: 360,
  duration: 0.6,
  ease: "back.out()"
});
```

---

### 5. How It Works Section

**Layout:** Full width with centered content

**Heading:**
```
Get Started in 3 Steps
```
- Font: Source Serif 4 or DM Sans, 3xl
- Gradient: Purple spectrum
- Animation: Fade-in on scroll

**Step Cards (3-4 Steps):**

#### Step 1: Upload Documents
- **Number Badge:** "01" with glow effect
- **Icon:** Upload (animated with pulse)
- **Title:** "Upload Documents"
- **Description:** "Drag and drop your documents (PDF, DOCX, TXT, MD) into Ragify."
- **Icon Animation:**
  ```javascript
  gsap.to(uploadIcon, {
    scale: [1, 1.1, 1],
    duration: 1.5,
    repeat: -1,
    ease: "sine.inOut"
  });
  ```

#### Step 2: AI Processes & Indexes
- **Number Badge:** "02" with glow effect
- **Icon:** Zap or Sparkles (continuous animation)
- **Title:** "AI Processes & Indexes"
- **Description:** "Our AI automatically chunks, processes, and indexes your documents for semantic search."
- **Icon Animation:**
  ```javascript
  gsap.to(zapIcon, {
    rotation: [0, 10, -10, 0],
    duration: 1,
    repeat: -1,
    ease: "sine.inOut"
  });
  ```

#### Step 3: Chat & Get Answers
- **Number Badge:** "03" with glow effect
- **Icon:** MessageSquare (typing animation)
- **Title:** "Chat & Get Answers"
- **Description:** "Ask questions in natural language. Get instant answers with source citations."
- **Icon Animation:** Typing cursor effect
  ```javascript
  gsap.to(cursor, {
    opacity: [1, 0],
    duration: 0.5,
    repeat: -1,
    ease: "sine.inOut"
  });
  ```

#### Step 4 (Optional): Share Knowledge
- **Number Badge:** "04" with glow effect
- **Icon:** Share2 (spread animation)
- **Title:** "Share Knowledge"
- **Description:** "Organize documents into collections and invite teammates to collaborate."

**Connecting SVG Lines:**
- Vertical path connecting step numbers
- Gradient: Purple → Indigo → Violet
- Animation: Dashing effect (lines flow continuously)
  ```css
  stroke-dasharray: 20;
  stroke-dashoffset: 0;
  animation: dashFlow 2s linear infinite;
  
  @keyframes dashFlow {
    to { stroke-dashoffset: -40px; }
  }
  ```

**Number Badges:**
- Size: 48x48 or 64x64
- Font: DM Sans or Space Grotesk, bold
- Background: `bg-primary`
- Text: `text-primary-foreground`
- Border radius: Full circle
- Glow: `text-shadow: 0 0 20px rgba(168, 85, 247, 0.6)`
- Animation: Pulse effect
  ```javascript
  gsap.to(badge, {
    textShadow: [
      "0 0 10px rgba(168, 85, 247, 0.5)",
      "0 0 25px rgba(168, 85, 247, 0.9)",
      "0 0 10px rgba(168, 85, 247, 0.5)"
    ],
    duration: 2,
    repeat: -1,
    ease: "sine.inOut"
  });
  ```

---

### 6. CTA (Call-to-Action) Section

**Design:** Full-width bottom section

**Background:**
- Base: Purple gradient `from-primary/20 via-indigo-600/10 to-violet-600/20`
- Animated gradient direction shift:
  ```javascript
  gsap.to(ctaSection, {
    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
    duration: 8,
    repeat: -1,
    ease: "sine.inOut"
  });
  ```
- Border top: `border-t-2 border-primary/50` with glow

**Content:**
```
Ready to Transform Your Knowledge?

Start using Ragify today. Free to get started, upgrade anytime.

[Start Free Now] [Schedule Demo]
```

- Heading: Source Serif 4, 3xl-4xl
- Subheading: Geist, text-lg
- Text color: `text-foreground`

**Buttons:**
1. **Primary:** "Start Free Now"
   - Styling: `bg-primary text-primary-foreground px-8 py-3 rounded-lg`
   - Shadow: `0 0 30px rgba(168, 85, 247, 0.5)`
   - Hover: Scale 1.05, shadow intensify

2. **Secondary:** "Schedule Demo"
   - Styling: `border-2 border-primary text-primary px-8 py-3 rounded-lg`
   - Hover: Fill with semi-transparent primary

**Decorative Floating Orbs:**

Multiple orbs with different sizes, colors, and animation speeds:

**Orb 1 (Top Right):**
- Size: Large (w-72 h-72)
- Gradient: `from-primary to-indigo-600`
- Opacity: 0.25
- Animation:
  ```javascript
  gsap.to(orb1, {
    y: -50,
    x: 30,
    scale: [1, 1.15, 1],
    duration: 6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
  ```

**Orb 2 (Bottom Left):**
- Size: Medium (w-56 h-56)
- Gradient: `from-violet-600 to-pink-600`
- Opacity: 0.2
- Animation:
  ```javascript
  gsap.to(orb2, {
    y: 40,
    x: -40,
    scale: [1, 0.95, 1],
    duration: 7,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 1
  });
  ```

**Orb 3 (Center Right, Small):**
- Size: Small (w-40 h-40)
- Gradient: `from-indigo-600 to-purple-600`
- Opacity: 0.15
- Animation:
  ```javascript
  gsap.to(orb3, {
    y: -30,
    x: 50,
    rotation: 360,
    duration: 10,
    repeat: -1,
    ease: "none"
  });
  ```

---

### 7. Footer

**Layout:** Full-width footer with sections

**Sections:**
1. **Logo & Branding** (Left)
   - Logo: `ragify.png` (w-12 h-12)
   - Company name: "Ragify"
   - Tagline: "Your AI-Powered Knowledge Hub"

2. **Links** (Center/Right)
   - Product: Features, Pricing, Documentation
   - Company: About, Blog, Careers
   - Legal: Privacy Policy, Terms of Service
   - Social: Twitter, GitHub, LinkedIn

**Styling:**
- Background: `bg-card dark:bg-card`
- Border top: `border-t border-border`
- Text: `text-foreground`
- Links: Hover color shift to `text-primary`
- Responsive: Stack on mobile

**Animation:**
- Links: Scale and color on hover
  ```javascript
  gsap.to(link, {
    color: "hsl(var(--primary))",
    scale: 1.1,
    duration: 0.3
  });
  ```

---

## 🔧 Technical Implementation Details

### React Component Structure

```typescript
// LandingPage.tsx
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, useEffect } from 'react';
import { ThreeBackground } from '@/components/landing/ThreeBackground';
import { LandingNav } from '@/components/layout/LandingNav';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Badge rotation
      gsap.to(badgeRef.current, {
        rotation: 360,
        duration: 8,
        repeat: -1,
        ease: 'linear'
      });

      // Hero animations
      tl.from(headlineRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.2,
        delay: 0.3
      })
      .from(subheadRef.current, {
        y: 60,
        opacity: 0,
        duration: 1
      }, '-=0.6')
      .from(ctaRef.current?.children || [], {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15
      }, '-=0.5');

      // Floating orbs
      orbRefs.current.forEach((orb, index) => {
        gsap.to(orb, {
          y: index === 0 ? -40 : 40,
          duration: 6 + index,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <ThreeBackground />
      <LandingNav />
      {/* Hero section JSX */}
    </div>
  );
}
```

### GSAP Animation Pattern

```typescript
useEffect(() => {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Add animations to timeline
    tl.from(element1, { opacity: 0, y: 100 })
      .from(element2, { opacity: 0, x: -50 }, '-=0.5');

    // Scroll-triggered animations
    ScrollTrigger.create({
      trigger: sectionRef.current,
      onEnter: () => {
        gsap.to(cards.current, {
          opacity: 1,
          y: 0,
          stagger: 0.1
        });
      }
    });
  }, containerRef);

  return () => ctx.revert();
}, []);
```

### Three.js Background Component

```typescript
// ThreeBackground.tsx
import { Canvas } from '@react-three/fiber';
import { Particles } from './Particles';

export function ThreeBackground() {
  return (
    <Canvas
      className="fixed inset-0 -z-10"
      camera={{ position: [0, 0, 50], fov: 75 }}
    >
      <Particles />
    </Canvas>
  );
}

// Particles.tsx - Separate file
function Particles() {
  const meshRef = useRef(null);
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(/* particle positions */);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Animation loop
    const animate = () => {
      // Update positions
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <mesh ref={meshRef}>
      <bufferGeometry />
      <pointsMaterial color="#a855f7" size={5} />
    </mesh>
  );
}
```

### Tailwind CSS Classes to Use

- **Colors:** `bg-primary`, `text-primary`, `border-primary`, `text-foreground`, `bg-card`, etc.
- **Gradients:** `bg-gradient-to-r from-primary to-indigo-600`
- **Dark Mode:** `dark:bg-card`, `dark:text-foreground`
- **Effects:** `blur-3xl`, `shadow-lg`, `drop-shadow-lg`
- **Animations:** `animate-pulse`, `animate-spin`, custom GSAP animations
- **Sizing:** `w-12 h-12` for logos, `w-64 h-64` for decorative orbs
- **Spacing:** `px-6`, `py-3`, `gap-6`, `mb-8`, etc.

---

## ✨ Design Philosophy & Animation Rules

### ✅ ENCOURAGED
- ✅ Animated gradients with direction shifts
- ✅ Pulsing and glowing effects on text and buttons
- ✅ Decorative animations (floating orbs, rotating elements)
- ✅ Hover effects with transforms (scale, rotate, translate)
- ✅ Scroll-triggered animations using ScrollTrigger
- ✅ Continuous animations with `repeat: -1`
- ✅ Icon animations (rotate, scale, bounce)
- ✅ Shadow effects with glow appearance
- ✅ Premium, polished feel with active visuals
- ✅ GSAP timelines for complex animation sequences
- ✅ Three.js particle system for immersion
- ✅ Modern fonts (DM Sans, Space Grotesk, Source Serif 4)
- ✅ Visual storytelling through animation
- ✅ Tech-forward, innovative design

### ❌ NOT RECOMMENDED (Unless Necessary)
- ❌ Static layouts without any motion
- ❌ Sacrificing readability for flashiness
- ❌ Breaking functionality due to over-animation
- ❌ Animations that distract from core content
- ❌ Very low contrast text over animated backgrounds
- ❌ Forget dark mode support

### Important Notes
- **Always maintain text readability** - ensure sufficient contrast in both light and dark modes
- **Performance first** - test 60fps on reasonable devices, optimize particle count
- **Respect prefers-reduced-motion** - provide option to disable heavy animations
- **Mobile optimization** - consider performance on lower-end mobile devices
- **Consistent branding** - keep purple theme throughout all sections

---

## 📋 Output Requirements

### React Components to Generate

1. **LandingPage.tsx** (Main component)
   - Hero section with all animations
   - Features section grid
   - How it works steps
   - CTA section
   - All GSAP animation setup
   - ScrollTrigger integration

2. **ThreeBackground.tsx** (Three.js component)
   - Particle system setup
   - Mouse tracking
   - Responsive canvas
   - WebGL optimization

3. **Optional Sub-components**
   - FeaturesSection.tsx
   - HowItWorksSection.tsx
   - CTASection.tsx
   - Hero.tsx

### Code Quality Requirements

- ✅ Full TypeScript with proper types and interfaces
- ✅ GSAP animations with ScrollTrigger plugin
- ✅ Three.js particle system
- ✅ Tailwind CSS classes (no inline styles except where necessary)
- ✅ Dark mode support via `dark:` prefix
- ✅ Responsive design (mobile-first)
- ✅ Semantic HTML structure
- ✅ Lucide React icons for all icon uses
- ✅ Clean, commented code
- ✅ Animation ref hooks for GSAP integration
- ✅ Component composition and reusability

### DO NOT Include
- ❌ API calls or backend integration
- ❌ State management (only useRef for animations)
- ❌ Google Fonts (use @fontsource or system fonts)
- ❌ Unnecessary comments
- ❌ Hardcoded colors (use Tailwind theme variables)

### Assets & Imports

- Ragify logo: `/ragify.png` or `/ragify-full.png`
- Fonts: @fontsource/geist, @fontsource/geist-mono, @fontsource/source-serif-4, @fontsource/dm-sans (optional)
- Icons: lucide-react (MessageSquare, FileText, Folder, Link, Sparkles, Zap, Upload, etc.)
- Animations: gsap, gsap/ScrollTrigger
- 3D: three, @react-three/fiber, @react-three/drei

---

## 🎯 Success Criteria

✅ Landing page renders without errors
✅ All GSAP animations run at 60fps
✅ Three.js background loads and animates smoothly
✅ Responsive design works on mobile, tablet, desktop
✅ Dark mode toggle works and all colors are visible
✅ Scroll-triggered animations fire correctly
✅ Hover effects work smoothly
✅ No console warnings or errors
✅ Images/logos load correctly from `/public`
✅ Text is readable over all animated backgrounds
✅ Animations respect prefers-reduced-motion
✅ Mobile performance is acceptable (can reduce particles on mobile)

---

**Ready to paste into v0.dev!** This comprehensive prompt includes all theme colors, technical specifications, animation details, and design philosophy needed to create a stunning Ragify landing page. 🚀
