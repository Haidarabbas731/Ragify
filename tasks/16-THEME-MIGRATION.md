# Phase 16: Purple Theme Migration (Design System Overhaul)

**Priority:** HIGH (UX consistency & brand identity)
**Estimated Time:** 3-4 days
**Dependencies:** Phase 12 (Frontend Development)
**Theme Reference:** `docs/THEME.md` (OKLCH color system)

---

## 🔧 IMPLEMENTATION UPDATES

**UPDATE [2025-01-XX]:** Phase 1 Foundation & ChatPage Migration Completed

### What Was Implemented:
1. **Font System (✅ WORKING)**
   - Installed @fontsource packages: geist, geist-mono, source-serif-4
   - Configured font imports in `index.css` with `font-display: swap`
   - Set CSS variables: `--font-sans`, `--font-mono`, `--font-serif`
   - Updated `tailwind.config.js` fontFamily config
   - **Verified:** Geist fonts rendering correctly via Chrome DevTools

2. **OKLCH Color System (✅ WORKING)**
   - Defined OKLCH colors in `:root` (light mode) and `.dark` (dark mode)
   - **CRITICAL FIX:** Used Tailwind v4's `@theme` directive to map CSS variables to utility classes
   - Solution: `@theme { --color-primary: var(--primary); }` bridges CSS vars to Tailwind
   - **Verified:** Buttons now show purple background (`oklch(0.5417 0.179 288.033)`) instead of transparent

3. **ChatPage.tsx Migration (✅ CODE COMPLETE, PENDING VISUAL VERIFICATION)**
   - Migrated all gradient references to solid `bg-primary`
   - Updated all font references from Space Grotesk/Inter/Fira Code to Geist/Geist Mono
   - Removed decorative animations (gradient pulse, scan lines)
   - Updated logo, New Chat button, message bubbles, send button

### Technical Breakthrough:
**Problem:** Tailwind v4 was not rendering OKLCH colors from CSS variables when using utility classes like `bg-primary`.
**Root Cause:** Tailwind v4's CSS-first approach requires `@theme` directive to recognize custom colors, not just config file.
**Solution:** Added `@theme` block in `index.css` that references `:root` CSS variables:
```css
@theme {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... other colors */
}
```

### Next Steps:
- [ ] Manual browser verification of dark mode toggle (DevTools MCP disabled)
- [ ] Continue Phase 2: Migrate remaining RAG core pages (DocumentDetailPage, DocumentsPage, Collections)

---

## 📋 MIGRATION STRATEGY

### Phased Approach (RAG Core First)
Following strategic order to minimize disruption:

**Phase 1:** Foundation (affects everything) - 0.5 day
**Phase 2:** RAG Core Pages (UX-critical) - 1.5 days
**Phase 3:** Secondary Pages (leverage global theme) - 1 day
**Phase 4:** Marketing (storytelling animations) - 0.5 day

### Animation Philosophy
**Golden Rule:** Never animate anything that delays reading or interacting with data.

✅ **KEEP animations:**
- Landing page (GSAP scroll triggers, parallax, fade-ins)
- Text streaming animation in chat (typing dots `...`)
- Loading states & API feedback
- Collection cards (0.1s stagger)
- Button hover states (transforms, shadows)

❌ **REMOVE animations:**
- Decorative pulsing effects on data pages
- Scan line overlays (distracting for reading)
- Gradient animations on logos/buttons
- Any animation that delays content visibility

### Typography Strategy
**Font Stack:** Geist (sans) + Source Serif 4 (serif) + Geist Mono (mono)
**Loading:** `font-display: swap` for instant text rendering
**Subset:** Latin characters only (optimize later)

---

## PHASE 1: FOUNDATION (0.5 day) ⭐ CRITICAL

### Overview
Establish the core design system that affects 70% of UI automatically.

### 16.1.1 Update Global CSS with OKLCH Color System

**File:** `frontend/src/index.css`

**Tasks:**
- [x] Import Geist fonts from @fontsource packages (npm for better control)
  ```css
  /* Official @fontsource packages with font-display: swap */
  @import "@fontsource/geist/400.css";
  @import "@fontsource/geist/500.css";
  @import "@fontsource/geist/600.css";
  @import "@fontsource/geist/700.css";
  @import "@fontsource/geist-mono/400.css";
  @import "@fontsource/geist-mono/500.css";
  @import "@fontsource/geist-mono/600.css";
  @import "@fontsource/source-serif-4/400.css";
  @import "@fontsource/source-serif-4/600.css";
  @import "@fontsource/source-serif-4/700.css";
  ```
  **UPDATE:** Used npm packages instead of CDN for offline support and better version control.

- [x] Add `:root` CSS variables for Light Mode
  ```css
  :root {
    /* Base Colors (Light Mode) */
    --background: oklch(0.9730 0.0133 286.1503);
    --foreground: oklch(0.3015 0.0572 282.4176);
    --primary: oklch(0.5417 0.1790 288.0332);
    --primary-foreground: oklch(1.0000 0 0);
    --secondary: oklch(0.9174 0.0435 292.6901);
    --secondary-foreground: oklch(0.4143 0.1039 288.1742);
    --accent: oklch(0.9221 0.0373 262.1410);
    --accent-foreground: oklch(0.3015 0.0572 282.4176);
    
    /* UI Elements */
    --card: oklch(1.0000 0 0);
    --card-foreground: oklch(0.3015 0.0572 282.4176);
    --popover: oklch(1.0000 0 0);
    --popover-foreground: oklch(0.3015 0.0572 282.4176);
    --muted: oklch(0.9580 0.0133 286.1454);
    --muted-foreground: oklch(0.5426 0.0465 284.7435);
    --border: oklch(0.9115 0.0216 285.9625);
    --input: oklch(0.9115 0.0216 285.9625);
    --ring: oklch(0.5417 0.1790 288.0332);
    
    /* Destructive */
    --destructive: oklch(0.6861 0.2061 14.9941);
    --destructive-foreground: oklch(1.0000 0 0);
    
    /* Sidebar */
    --sidebar-background: oklch(0.9580 0.0133 286.1454);
    --sidebar-foreground: oklch(0.3015 0.0572 282.4176);
    --sidebar-primary: oklch(0.5417 0.1790 288.0332);
    --sidebar-primary-foreground: oklch(1.0000 0 0);
    --sidebar-accent: oklch(0.9221 0.0373 262.1410);
    --sidebar-accent-foreground: oklch(0.3015 0.0572 282.4176);
    --sidebar-border: oklch(0.9115 0.0216 285.9625);
    --sidebar-ring: oklch(0.5417 0.1790 288.0332);
    
    /* Charts */
    --chart-1: oklch(0.5417 0.1790 288.0332);
    --chart-2: oklch(0.7042 0.1602 288.9880);
    --chart-3: oklch(0.5679 0.2113 276.7065);
    --chart-4: oklch(0.6356 0.1922 281.8054);
    --chart-5: oklch(0.4509 0.1758 279.3838);
    
    /* Typography */
    --font-sans: 'Geist', system-ui, -apple-system, sans-serif;
    --font-serif: 'Source Serif 4', 'Georgia', serif;
    --font-mono: 'Geist Mono', 'Courier New', monospace;
    
    /* Border Radius */
    --radius: 0.5rem;
  }
  ```

- [x] Add `.dark` CSS variables for Dark Mode
  ```css
  .dark {
    /* Base Colors (Dark Mode) */
    --background: oklch(0.1743 0.0227 283.7998);
    --foreground: oklch(0.9185 0.0257 285.8834);
    --primary: oklch(0.7162 0.1597 290.3962);
    --primary-foreground: oklch(0.1743 0.0227 283.7998);
    --secondary: oklch(0.3139 0.0736 283.4591);
    --secondary-foreground: oklch(0.8367 0.0849 285.9111);
    --accent: oklch(0.3354 0.0828 280.9705);
    --accent-foreground: oklch(0.9185 0.0257 285.8834);
    
    /* UI Elements */
    --card: oklch(0.2284 0.0384 282.9324);
    --card-foreground: oklch(0.9185 0.0257 285.8834);
    --popover: oklch(0.2284 0.0384 282.9324);
    --popover-foreground: oklch(0.9185 0.0257 285.8834);
    --muted: oklch(0.2710 0.0621 281.4377);
    --muted-foreground: oklch(0.7166 0.0462 285.1741);
    --border: oklch(0.3261 0.0597 282.5832);
    --input: oklch(0.3261 0.0597 282.5832);
    --ring: oklch(0.7162 0.1597 290.3962);
    
    /* Destructive */
    --destructive: oklch(0.6861 0.2061 14.9941);
    --destructive-foreground: oklch(1.0000 0 0);
    
    /* Sidebar */
    --sidebar-background: oklch(0.2284 0.0384 282.9324);
    --sidebar-foreground: oklch(0.9185 0.0257 285.8834);
    --sidebar-primary: oklch(0.7162 0.1597 290.3962);
    --sidebar-primary-foreground: oklch(0.1743 0.0227 283.7998);
    --sidebar-accent: oklch(0.3354 0.0828 280.9705);
    --sidebar-accent-foreground: oklch(0.9185 0.0257 285.8834);
    --sidebar-border: oklch(0.3261 0.0597 282.5832);
    --sidebar-ring: oklch(0.7162 0.1597 290.3962);
    
    /* Charts */
    --chart-1: oklch(0.7162 0.1597 290.3962);
    --chart-2: oklch(0.6382 0.1047 274.9117);
    --chart-3: oklch(0.7482 0.1235 244.7492);
    --chart-4: oklch(0.7124 0.0977 186.6761);
    --chart-5: oklch(0.7546 0.1831 346.8124);
  }
  ```

- [ ] Keep existing `@variant dark (&:is(.dark *));` for Tailwind v4

**Verification:**
- [ ] Light mode shows purple primary color
- [ ] Dark mode shows brighter purple primary color
- [ ] Fonts load instantly with swap fallback
- [ ] No console errors about missing CSS variables

---

### 16.1.2 Update Tailwind Configuration

**File:** `frontend/tailwind.config.js`

**Tasks:**
- [x] Configure theme to use CSS variables
  ```javascript
  /** @type {import('tailwindcss').Config} */
  export default {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        fontFamily: {
          sans: ["Geist", "system-ui", "sans-serif"],
          serif: ["Source Serif 4", "Georgia", "serif"],
          mono: ["Geist Mono", "Courier New", "monospace"],
        },
      },
    },
  ```
  **UPDATE:** Tailwind v4 uses @theme directive in CSS instead of config file for colors. Only fontFamily config remains in tailwind.config.js.
    plugins: [],
  };
  ```

**Note:** Tailwind uses `hsl()` wrapper for OKLCH colors from CSS variables.

**Verification:**
- [ ] `bg-primary` class uses purple color
- [ ] `font-sans` uses Geist font
- [ ] `font-mono` uses Geist Mono
- [ ] Dark mode toggle works correctly

---

### 16.1.3 Verify shadcn/ui Components Auto-Update

**Files:** `frontend/src/components/ui/button.tsx`, `input.tsx`, `card.tsx`, `label.tsx`

**Tasks:**
- [ ] Test Button component in Storybook/dev
- [ ] Verify primary button uses new purple color
- [ ] Test Input component styling
- [ ] Verify Card component uses new background
- [ ] Test Label component text color

**Expected Behavior:**
- All shadcn/ui components automatically use new OKLCH colors
- No component file changes needed (they already use CSS variables)

---

## PHASE 2: RAG CORE PAGES (1.5 days) ⭐ UX-CRITICAL

### Overview
Update the core RAG functionality pages with zero cognitive load from animations.

---

### 16.2.1 ChatPage - Zero Distraction

**File:** `frontend/src/pages/ChatPage.tsx`

**Animation Rules:**
- ✅ **KEEP:** Text streaming animation (typing dots), message fade-in, loading spinners, send button states
- ❌ **REMOVE:** Gradient animations on buttons/logos, pulsing effects, decorative animations

**Tasks:**
- [x] Replace purple-indigo gradient logo with solid primary color
  ```tsx
  // OLD: bg-gradient-to-br from-purple-500 to-indigo-600
  // NEW: bg-primary
  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
    <MessageSquare className="w-6 h-6 text-primary-foreground" />
  </div>
  ```

- [x] Update brand text to use primary color (no gradient)
  ```tsx
  // OLD: bg-gradient-to-r from-purple-600 to-indigo-600 ... bg-clip-text text-transparent
  // NEW: text-primary
  <span className="text-xl font-bold text-primary font-sans tracking-tight">
    Chat
  </span>
  ```

- [x] Replace "New Chat" button gradient with solid primary
  ```tsx
  // OLD: bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700
  // NEW: bg-primary hover:bg-primary/90
  <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
  ```

- [x] Update user message bubbles to solid primary
  ```tsx
  // OLD: bg-gradient-to-r from-purple-500 to-indigo-600
  // NEW: bg-primary
  <div className="bg-primary text-primary-foreground rounded-xl rounded-br-none px-5 py-4">
  ```

- [x] Update send button to solid primary
  ```tsx
  // OLD: bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700
  // NEW: bg-primary hover:bg-primary/90
  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  ```

- [x] Replace all font-family inline styles with Tailwind classes
  ```tsx
  // OLD: font-['Space_Grotesk']
  // NEW: font-sans
  
  // OLD: font-['Inter']
  // NEW: font-sans
  
  // OLD: font-['Fira_Code']
  // NEW: font-mono
  ```

- [x] Keep streaming animation exactly as is
  ```tsx
  // DO NOT CHANGE: Loading dots, message fade-in, scroll animations
  ```

**Verification:**
- [x] Logo is solid purple (no gradient)
- [x] New Chat button is solid purple with hover effect
- [x] User messages are solid purple
- [x] Send button is solid purple
- [x] Streaming animation still works
- [x] Fonts use Geist/Geist Mono
- [x] Zero decorative animations
  **NOTE:** Pending manual browser verification (DevTools MCP disabled)

---

### 16.2.2 DocumentDetailPage - Data Forensics

**File:** `frontend/src/pages/DocumentDetailPage.tsx`

**Animation Rules:**
- ✅ **KEEP:** Chunk fade-in animations (staggered), modal animations
- ❌ **REMOVE:** Scan line effect (distracting), pulsing logo glow

**Tasks:**
- [ ] Replace cyan-blue theme with purple
  ```tsx
  // Replace all instances:
  // cyan-500 → primary
  // cyan-600 → primary
  // blue-600 → primary
  // cyan-400 (dark mode) → primary
  ```

- [ ] Update animated grid background to muted purple
  ```tsx
  // OLD: rgb(34 211 238 / 0.1) (cyan)
  // NEW: Use muted color with low opacity
  style={{
    backgroundImage: `
      linear-gradient(to right, hsl(var(--muted) / 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--muted) / 0.1) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    animation: "gridPulse 8s ease-in-out infinite",
  }}
  ```

- [ ] Remove scan line effect (too distracting for reading)
  ```tsx
  // DELETE entire scan line div:
  // <div className="fixed inset-0 pointer-events-none opacity-15 dark:opacity-30" ...>
  ```

- [ ] Update logo to solid primary (remove pulsing glow)
  ```tsx
  // OLD: bg-gradient-to-br from-cyan-500 to-blue-600 + pulsing glow
  // NEW: bg-primary (no gradient, no glow)
  <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
    <Database className="w-6 h-6 text-primary-foreground" />
  </div>
  ```

- [ ] Update "FORENSICS//LAB" branding
  ```tsx
  // OLD: text-cyan-600 dark:text-cyan-400
  // NEW: text-primary
  <span className="text-sm font-bold font-mono tracking-wider text-primary">
    {"FORENSICS//LAB"}
  </span>
  ```

- [ ] Replace all cyan borders with primary
  ```tsx
  // Replace:
  // border-cyan-600/40 → border-primary/40
  // border-cyan-500/30 → border-primary/30
  // etc.
  ```

- [ ] Update fonts to Geist family
  ```tsx
  // Replace:
  // font-['JetBrains_Mono'] → font-mono
  // font-['IBM_Plex_Sans_Condensed'] → font-sans
  // font-['Courier_New'] → font-mono
  ```

- [ ] Keep chunk stagger animation (good UX)
  ```tsx
  // DO NOT CHANGE: animation-delay for chunks
  style={{ animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both` }}
  ```

**Verification:**
- [ ] Grid background is subtle purple (not cyan)
- [ ] No scan line effect
- [ ] Logo is solid purple (no glow)
- [ ] All borders are purple
- [ ] Fonts use Geist/Geist Mono
- [ ] Chunk animations still work

---

### 16.2.3 DocumentsPage - Clean Browsing

**File:** `frontend/src/pages/DocumentsPage.tsx`

**Animation Rules:**
- ❌ **REMOVE:** Scan line overlay, pulsing logo effect
- ✅ **KEEP:** Document card hover states (minimal)

**Tasks:**
- [ ] Replace emerald-teal theme with purple
  ```tsx
  // Replace all:
  // emerald-500 → primary
  // emerald-600 → primary
  // emerald-700 → primary
  // teal-600 → primary
  // emerald-400 (dark mode) → primary
  ```

- [ ] Remove scan line overlay (distracting)
  ```tsx
  // DELETE scan-line div:
  // <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.02]" ...>
  ```

- [ ] Update grid background to muted purple
  ```tsx
  // OLD: rgba(34, 197, 94, 0.2) (emerald)
  // NEW: hsl(var(--muted) / 0.1)
  <div
    className="pointer-events-none fixed inset-0 opacity-[0.04] dark:opacity-[0.03]"
    style={{
      backgroundImage:
        "linear-gradient(hsl(var(--muted) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted) / 0.1) 1px, transparent 1px)",
      backgroundSize: "50px 50px",
    }}
  />
  ```

- [ ] Update logo to solid primary (remove pulsing)
  ```tsx
  // OLD: bg-gradient-to-br from-emerald-500 to-teal-600 + animate-pulse
  // NEW: bg-primary (no gradient, no pulse)
  <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
    <FileText className="w-6 h-6 text-primary-foreground" />
  </div>
  ```

- [ ] Update "ARCHIVE//SYS" branding
  ```tsx
  // OLD: text-emerald-700 dark:text-emerald-400
  // NEW: text-primary
  <span className="text-xl font-bold text-primary font-sans tracking-tight">
    ARCHIVE//SYS
  </span>
  ```

- [ ] Replace all emerald borders/backgrounds
  ```tsx
  // border-emerald-200 → border-border
  // bg-emerald-100 → bg-muted
  // text-emerald-600 → text-primary
  ```

- [ ] Update fonts to Geist
  ```tsx
  // font-['Space_Grotesk'] → font-sans
  // font-mono remains font-mono
  ```

**Verification:**
- [ ] No scan line effect
- [ ] Grid background is subtle purple
- [ ] Logo is solid purple (no pulse)
- [ ] All colors are purple theme
- [ ] Fonts use Geist family

---

### 16.2.4 Collections Component

**File:** `frontend/src/components/documents/Collections.tsx`

**Animation Rules:**
- ✅ **KEEP:** 0.1s stagger animation (subtle, good UX)
- ❌ **REMOVE:** Nothing (already well-designed)

**Tasks:**
- [ ] Replace gradient orbs with primary purple
  ```tsx
  // OLD: from-blue-500/20 to-purple-500/20
  // NEW: from-primary/20 to-primary/10
  <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl" />
  ```

- [ ] Replace violet-fuchsia orbs
  ```tsx
  // OLD: from-violet-500/20 to-fuchsia-500/20
  // NEW: from-primary/20 to-primary/10
  ```

- [ ] Update selection indicator
  ```tsx
  // OLD: bg-emerald-500
  // NEW: bg-primary
  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
  ```

- [ ] Update selected state colors
  ```tsx
  // OLD: ring-slate-900 dark:ring-slate-100
  // NEW: ring-primary
  className={`... ${selectedCollectionId === collection.collection_id ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
  ```

- [ ] Keep stagger animation exactly as is
  ```tsx
  // DO NOT CHANGE:
  style={{ animation: `slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both` }}
  ```

**Verification:**
- [ ] Gradient orbs are purple
- [ ] Selected collection has purple ring
- [ ] Stagger animation works
- [ ] Dark mode has good contrast

---

## PHASE 3: SECONDARY PAGES (1 day)

### Overview
Update secondary pages that leverage the global theme system.

---

### 16.3.1 Dashboard Page

**File:** `frontend/src/pages/DashboardPage.tsx`

**Tasks:**
- [ ] Replace blue-purple gradient logo with solid primary
  ```tsx
  // OLD: bg-gradient-to-br from-blue-500 to-purple-600
  // NEW: bg-primary
  ```

- [ ] Update brand text gradient
  ```tsx
  // OLD: bg-gradient-to-r from-blue-600 to-purple-600 ... bg-clip-text text-transparent
  // NEW: text-primary
  <span className="text-xl font-bold text-primary font-sans">
    Knowledge Base
  </span>
  ```

- [ ] Update all fonts to Geist
  ```tsx
  // font-['Space_Grotesk'] → font-sans
  // font-['Inter'] → font-sans
  // font-['Fira_Code'] → font-mono
  ```

- [ ] Admin panel link styling
  ```tsx
  // OLD: from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50
  // NEW: bg-primary/10 hover:bg-primary/20
  ```

**Verification:**
- [ ] Logo is solid purple
- [ ] Stats cards use theme colors
- [ ] Fonts are consistent

---

### 16.3.2 Profile Page

**File:** `frontend/src/pages/ProfilePage.tsx`

**Tasks:**
- [ ] Same as Dashboard - replace blue-purple with primary
- [ ] Update logo
- [ ] Update fonts to Geist
- [ ] Update progress bars to use primary color
- [ ] Update tab active states
  ```tsx
  // OLD: bg-blue-50 dark:bg-blue-950
  // NEW: bg-primary/10
  ```

**Verification:**
- [ ] Logo matches dashboard
- [ ] Progress indicators use purple
- [ ] Active tab has purple background

---

### 16.3.3 Login & Register Pages

**Files:** `frontend/src/pages/LoginPage.tsx`, `RegisterPage.tsx`

**Tasks:**
- [ ] Replace stone/zinc with OKLCH colors
  ```tsx
  // OLD: bg-stone-50 dark:bg-zinc-950
  // NEW: bg-background
  
  // OLD: text-stone-900 dark:text-zinc-100
  // NEW: text-foreground
  ```

- [ ] Update left panel background
  ```tsx
  // OLD: bg-stone-900 dark:bg-zinc-900
  // NEW: bg-card
  ```

- [ ] Modernize input styling (already uses shadcn components)
  ```tsx
  // Inputs will auto-update with theme colors
  // Just remove custom border colors, use defaults
  ```

- [ ] Replace Fira Code with Geist
  ```tsx
  // font-['Fira_Code'] → font-sans or font-mono
  // font-['IBM_Plex_Sans'] → font-sans
  ```

- [ ] Update logo/branding
  ```tsx
  // OLD: border-4 border-white mb-6
  // NEW: bg-primary rounded-lg p-3 mb-6
  ```

- [ ] Add purple accents to primary buttons
  ```tsx
  // Buttons already use theme, just verify
  ```

**Verification:**
- [ ] Background uses theme colors
- [ ] Inputs have purple focus ring
- [ ] Fonts use Geist
- [ ] Dark mode works correctly

---

## PHASE 4: MARKETING (0.5 day)

### Overview
Update landing page with purple theme while keeping storytelling animations.

---

### 16.4.1 Landing Page Hero

**File:** `frontend/src/pages/LandingPage.tsx`

**Animation Rules:**
- ✅ **KEEP ALL:** GSAP animations, parallax, fade-ins, scroll triggers

**Tasks:**
- [ ] Update hero headline gradient to purple
  ```tsx
  // OLD: cyan-blue gradient
  // NEW: purple spectrum
  style={{
    background: darkMode
      ? "linear-gradient(135deg, #fff 0%, hsl(var(--primary)) 100%)"
      : "linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--primary)) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }}
  ```

- [ ] Update accent color
  ```tsx
  // OLD: text-cyan-600 dark:text-cyan-400
  // NEW: text-primary
  <span className="text-primary">Supercharged</span>
  ```

- [ ] Update badge colors
  ```tsx
  // OLD: border-cyan-500/30 bg-cyan-500/10 text-cyan-600
  // NEW: border-primary/30 bg-primary/10 text-primary
  ```

- [ ] Update CTA button
  ```tsx
  // OLD: bg-gradient-to-r from-cyan-500 to-blue-600
  // NEW: bg-primary hover:bg-primary/90
  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  ```

- [ ] Update stat cards
  ```tsx
  // OLD: text-cyan-600 hover:border-cyan-500/50
  // NEW: text-primary hover:border-primary/50
  ```

- [ ] Replace Playfair Display with Source Serif 4
  ```tsx
  // OLD: font-family: "'Playfair Display', serif"
  // NEW: className="font-serif"
  ```

- [ ] Update scroll indicator
  ```tsx
  // OLD: bg-cyan-600 dark:bg-cyan-400
  // NEW: bg-primary
  ```

- [ ] Keep ALL GSAP animations unchanged

**Verification:**
- [ ] Hero gradient is purple
- [ ] CTA button is purple
- [ ] Animations still work
- [ ] Source Serif 4 loads

---

### 16.4.2 Features Section

**File:** `frontend/src/components/landing/FeaturesSection.tsx`

**Tasks:**
- [ ] Update section heading gradient
  ```tsx
  // OLD: cyan-blue gradient
  // NEW: purple gradient
  background: darkMode
    ? "linear-gradient(135deg, #fff 0%, hsl(var(--primary)) 100%)"
    : "linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--primary)) 100%)"
  ```

- [ ] Update feature card gradients (keep variety)
  ```tsx
  // Adjust to purple spectrum:
  // from-cyan-500 to-blue-600 → from-primary to-primary/80
  // from-blue-500 to-purple-600 → from-primary/90 to-primary
  // from-purple-500 to-pink-600 → from-primary to-accent
  // from-pink-500 to-rose-600 → from-accent to-destructive/80
  ```

- [ ] Update hover border
  ```tsx
  // OLD: hover:border-cyan-500/50
  // NEW: hover:border-primary/50
  ```

- [ ] Keep GSAP scroll animations

**Verification:**
- [ ] Heading is purple gradient
- [ ] Feature cards have purple spectrum
- [ ] Scroll animations work

---

### 16.4.3 How It Works Section

**File:** `frontend/src/components/landing/HowItWorksSection.tsx`

**Tasks:**
- [ ] Update heading gradient (same as Features)
- [ ] Update SVG connecting lines
  ```tsx
  // Update linearGradient colors to purple spectrum
  <linearGradient id="lineGradient1">
    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
    <stop offset="100%" stopColor="hsl(var(--primary) / 0.8)" stopOpacity="0.6" />
  </linearGradient>
  ```

- [ ] Update step number gradient
  ```tsx
  // OLD: from-cyan-500/40 to-blue-700/40
  // NEW: from-primary/40 to-primary/60
  ```

- [ ] Update icon backgrounds
  ```tsx
  // OLD: from-cyan-500/10 to-blue-600/10 border-cyan-500/30
  // NEW: from-primary/10 to-primary/20 border-primary/30
  ```

- [ ] Update decorative dots
  ```tsx
  // OLD: bg-cyan-500/30
  // NEW: bg-primary/30
  ```

- [ ] Keep SVG line animations

**Verification:**
- [ ] Connecting lines are purple
- [ ] Step icons have purple background
- [ ] Line animation works

---

### 16.4.4 CTA Section

**File:** `frontend/src/components/landing/CTASection.tsx`

**Tasks:**
- [ ] Update gradient background
  ```tsx
  // OLD: from-cyan-500/20 via-blue-600/20 to-purple-600/20
  // NEW: from-primary/20 via-primary/15 to-primary/10
  ```

- [ ] Update border
  ```tsx
  // OLD: border-cyan-500/30
  // NEW: border-primary/30
  ```

- [ ] Update badge
  ```tsx
  // OLD: border-cyan-500/30 bg-cyan-500/10 text-cyan-600
  // NEW: border-primary/30 bg-primary/10 text-primary
  ```

- [ ] Update heading gradient (same as others)
- [ ] Update CTA button (same as hero)
- [ ] Update decorative orbs
  ```tsx
  // OLD: from-cyan-400/10, from-purple-400/10
  // NEW: from-primary/10, from-accent/10
  ```

- [ ] Keep parallax animation

**Verification:**
- [ ] Background is purple gradient
- [ ] Button is purple
- [ ] Parallax works

---

### 16.4.5 Navigation & Footer

**Files:** `frontend/src/components/layout/LandingNav.tsx`, `LandingFooter.tsx`

**Tasks:**
- [ ] Update logo gradient
  ```tsx
  // OLD: from-cyan-500 to-blue-600
  // NEW: bg-primary (solid)
  ```

- [ ] Update hover colors
  ```tsx
  // OLD: hover:text-cyan-600 dark:hover:text-cyan-400
  // NEW: hover:text-primary
  ```

- [ ] Replace DM Sans with Geist
  ```tsx
  // font-family: "'DM Sans', sans-serif"
  // NEW: className="font-sans"
  ```

**Verification:**
- [ ] Logo matches theme
- [ ] Links have purple hover
- [ ] Fonts are consistent

---

## 🧪 TESTING & VERIFICATION

### After Each Phase

- [ ] Run `bun run dev` and visually inspect pages
- [ ] Toggle dark mode and verify colors
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify fonts load correctly
- [ ] Check for console errors/warnings
- [ ] Test all interactive elements (buttons, inputs, modals)
- [ ] Verify animations work as expected
- [ ] Test with Biome linter: `bun run biome check src`

### Accessibility

- [ ] Check color contrast ratios (WCAG AA minimum)
- [ ] Test keyboard navigation
- [ ] Verify focus states are visible
- [ ] Test with screen reader (if possible)

### Performance

- [ ] Fonts load with swap (no FOUT)
- [ ] No layout shift from theme loading
- [ ] Animations are smooth (60fps)
- [ ] Page load time <3s

---

## 📝 COMMIT STRATEGY

### Phase 1 Commit
```
feat(theme): implement OKLCH purple theme foundation

- Add OKLCH CSS variables for light/dark modes
- Import Geist font family with swap
- Update Tailwind config to use CSS variables
- Configure typography system
```

### Phase 2 Commits (one per page)
```
feat(chat): migrate to purple theme with zero-distraction design

- Replace gradient buttons with solid primary color
- Update fonts to Geist family
- Remove decorative animations
- Keep streaming animation for UX feedback
```

```
feat(documents): migrate detail page to purple theme

- Replace cyan-blue forensics theme with purple
- Update grid background to muted purple
- Remove distracting scan line effect
- Keep chunk stagger animations
```

### Phase 3 Commit
```
feat(ui): migrate secondary pages to purple theme

- Update Dashboard, Profile, Login, Register pages
- Standardize fonts to Geist family
- Apply consistent purple color scheme
```

### Phase 4 Commit
```
feat(landing): migrate marketing pages to purple theme

- Update hero, features, CTA sections
- Keep all storytelling animations
- Apply purple gradient spectrum
- Replace Playfair with Source Serif 4
```

---

## 📚 REFERENCE

- **Theme File:** `docs/THEME.md`
- **Color System:** OKLCH (perceptually uniform)
- **Font Stack:** Geist (sans), Source Serif 4 (serif), Geist Mono (mono)
- **Design Philosophy:** Functional animations only for RAG core, storytelling animations for marketing

---

## ✅ COMPLETION CHECKLIST

**Phase 1:**
- [ ] CSS variables added to `index.css`
- [ ] Fonts imported with swap
- [ ] Tailwind config updated
- [ ] shadcn/ui components verified

**Phase 2:**
- [ ] ChatPage migrated (zero distraction)
- [ ] DocumentDetailPage migrated (data forensics)
- [ ] DocumentsPage migrated (clean browsing)
- [ ] Collections component migrated

**Phase 3:**
- [ ] Dashboard migrated
- [ ] Profile migrated
- [ ] Login/Register migrated

**Phase 4:**
- [ ] Landing page hero migrated
- [ ] Features section migrated
- [ ] How It Works migrated
- [ ] CTA section migrated
- [ ] Navigation & Footer migrated

**Final Verification:**
- [ ] All pages use purple theme
- [ ] Dark mode works correctly
- [ ] Fonts are consistent (Geist)
- [ ] Animations follow rules (functional vs decorative)
- [ ] No console errors
- [ ] Linting passes (`bun run biome check`)
- [ ] Accessibility tested
- [ ] Performance verified

---

**Status:** 🚧 READY TO START
**Next Action:** Begin Phase 1 - Foundation
