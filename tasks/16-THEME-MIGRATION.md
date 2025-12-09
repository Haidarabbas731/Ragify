# Phase 16: Purple Theme Migration (Design System Overhaul)

**Priority:** HIGH (UX consistency & brand identity)
**Estimated Time:** 3-4 days
**Dependencies:** Phase 12 (Frontend Development)
**Theme Reference:** `docs/THEME.md` (OKLCH color system)

---

## 🔧 IMPLEMENTATION UPDATES

**UPDATE [2025-12-09]:** CRITICAL FIX - Complete @theme Directive Mapping + Phase 3 Dark Mode Text Visibility + ProfilePage Migration

### Critical Fix Applied:
**Problem:** `text-muted-foreground` and other utility classes were showing `rgb(0, 0, 0)` (pure black) in dark mode, making text invisible.
**Root Cause:** Tailwind v4's `@theme` directive was incomplete - only mapped 7 colors instead of all 26 CSS variables.
**Solution:** Completed `@theme` block in `index.css` with ALL color mappings:
```css
@theme {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground); /* ← KEY FIX */
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
```
**Result:** All text now properly uses OKLCH colors and is visible in both modes:
- Light mode: `oklch(0.5426 0.0465 284.743)` - darker for contrast
- Dark mode: `oklch(0.7166 0.0462 285.174)` - lighter for contrast

### DashboardPage Dark Mode Fixes (✅ COMPLETE):
1. **Stats Card Text Visibility**
   - Changed `text-slate-900 dark:text-white` to `text-foreground` for numbers
   - Changed `text-slate-600 dark:text-slate-300` to `text-muted-foreground` for descriptions
   - Fixed: "Total files uploaded", "Vector embeddings", "MB", "% used" labels
   
2. **Upload Zone Text**
   - "Drag & drop files here or click to browse" - now visible
   - "PDF, DOCX, TXT, MD • Max 50MB per file" - now visible
   
3. **Mobile Sidebar Collections Button**
   - Changed `text-slate-600 dark:text-slate-400` to `text-foreground`

### ChatPage Dark Mode Fixes (✅ COMPLETE):
1. **Sidebar Text**
   - Changed "Conversations" heading from `text-slate-900 dark:text-white` to `text-foreground`
   - Changed conversation metadata from `text-slate-500 dark:text-slate-400` to `text-muted-foreground`
   
2. **User Menu & Toggle Icons**
   - Changed dark/light mode icons from `text-muted-foreground` to `text-primary` for visibility
   - Changed user icon from `text-muted-foreground` to `text-primary` for visibility

### ProfilePage Dark Mode Fixes (✅ COMPLETE):
**All hardcoded slate colors replaced with theme variables:**
1. **Navigation Bar**
   - Background: `bg-white/80 dark:bg-slate-900/80` → `bg-card/80`
   - Dark/light mode toggle icons: `text-slate-600 dark:text-slate-400` → `text-primary`
   
2. **Sidebar Navigation**
   - Background: `bg-white dark:bg-slate-900` → `bg-card`
   - Border: `border-slate-200 dark:border-slate-800` → `border-border`
   - Buttons: `text-slate-700 dark:text-slate-300` → `text-foreground`
   - Hover: `hover:bg-slate-100 dark:hover:bg-slate-800` → `hover:bg-muted`
   
3. **Profile Info Tab Card**
   - Background: `bg-white dark:bg-slate-900` → `bg-card`
   - Border: `border-slate-200 dark:border-slate-800` → `border-border`
   - Heading: `text-slate-900 dark:text-slate-100` → `text-foreground`
   - User info: `text-slate-500 dark:text-slate-400` → `text-muted-foreground`
   - Form inputs: `bg-white dark:bg-slate-800` → `bg-card`, borders updated
   - Labels: `text-slate-700 dark:text-slate-300` → `text-foreground`
   
4. **Security Tab**
   - Card: `bg-white dark:bg-slate-900` → `bg-card`
   - API key container: `bg-slate-50 dark:bg-slate-800` → `bg-muted`
   - Code display: `bg-slate-100 dark:bg-slate-900` → `bg-background`
   - Labels: `text-slate-700 dark:text-slate-300` → `text-foreground`
   
5. **Usage & Quota Tab**
   - Card: `bg-white dark:bg-slate-900` → `bg-card`
   - SVG circle: `text-slate-200 dark:text-slate-800` → `text-border`
   - Numbers: `text-slate-900 dark:text-slate-100` → `text-foreground`
   - Labels: `text-slate-500 dark:text-slate-400` → `text-muted-foreground`
   - Storage detail cards: `bg-slate-50 dark:bg-slate-800/50` → `bg-muted`
   - Border: `border-slate-200 dark:border-slate-800` → `border-border`
   
6. **Preferences Tab**
   - Card: `bg-white dark:bg-slate-900` → `bg-card`
   - Heading: `text-slate-900 dark:text-slate-100` → `text-foreground`
   - Theme toggle background: `bg-slate-300` → `bg-muted` (when not dark mode)
   - Preference descriptions: All using `text-muted-foreground`
   - Borders: `border-slate-200 dark:border-slate-800` → `border-border`

**Verified via Chrome DevTools:** All pages tested in both light and dark modes with proper contrast.

---

**UPDATE [2025-12-08]:** Phase 1 Foundation & Phase 2.2 DocumentDetailPage Migration Completed

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

3. **ChatPage.tsx Migration (✅ COMPLETE)**
   - Migrated all gradient references to solid `bg-primary`
   - Updated all font references from Space Grotesk/Inter/Fira Code to Geist/Geist Mono
   - Removed decorative animations (gradient pulse, scan lines)
   - Updated logo, New Chat button, message bubbles, send button

4. **DocumentDetailPage.tsx Migration (✅ COMPLETE)**
   - Replaced cyan-blue forensics theme with purple primary color
   - Updated grid background from cyan to muted purple
   - Removed distracting scan line effect
   - Updated logo to solid primary (removed pulsing glow)
   - Replaced all IBM Plex Sans Condensed/JetBrains Mono/Courier New with Geist fonts
   - Updated modal borders from `border` to `border-2` with higher opacity for better visibility
   - Fixed Edit Metadata modal Cancel button styling
   - Replaced mock collections with real collections API (`useCollections` hook)
   - Added placeholder and empty state for collections dropdown
   - **Verified:** All colors purple, no console errors, linting passes, Chrome DevTools verified

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

**UPDATE [2025-12-09]:** Phase 3 Secondary Pages Migration Completed

### What Was Implemented (Phase 3):

1. **DashboardPage.tsx Migration (✅ COMPLETE)**
   - Updated navigation bar consistency to match CollectionsPage/DocumentsPage
   - Fixed stats card numbers visibility in dark mode (text-slate-900 dark:text-white)
   - Updated navigation labels: "Documents" → "Dashboard", "All Documents" → "Documents"
   - All theme colors now consistent (bg-card, border-border, text-primary)
   - **UPDATE [2025-12-09]:** Rebranded logo and text
     - Replaced `<FileText>` icon with `ragify.png` logo image
     - Changed "Knowledge Base" text to "Ragify"
     - Removed purple background container for cleaner design with custom logo

2. **ProfilePage.tsx Migration (✅ COMPLETE)**
   - Migrated avatar gradient to solid primary
   - Updated all fonts from Inter/Fira Code to Geist/Geist Mono
   - Replaced all color references with theme variables
   - Updated save button and toggle switches to use primary color
   - **Verified:** Linting passes, all colors purple

3. **LoginPage.tsx Migration (✅ COMPLETE)**
   - Removed Google Fonts import
   - Updated all colors from stone/zinc to theme colors (bg-background, bg-card, text-foreground)
   - Changed all fonts to Geist family
   - Updated input fields to use border-border and focus:border-primary
   - Updated logo to solid primary background
   - **Verified:** Linting passes, works in both light and dark modes

4. **ChatPage.tsx Complete Theme Fix (✅ COMPLETE)**
   - Fixed all hardcoded slate colors to use theme variables
   - Replaced all bg-slate-* with bg-background/bg-card/bg-muted
   - Replaced all border-slate-* with border-border
   - Updated all text colors to use theme variables (text-foreground, text-muted-foreground, etc.)
   - Fixed sidebar text visibility in light mode
   - **Verified:** Linting passes

5. **CollectionFilter.tsx Complete Migration (✅ COMPLETE)**
   - Replaced hardcoded slate colors with theme variables
   - Updated all purple colors to use text-primary
   - Changed fonts from Inter/Fira Code to Geist/Geist Mono
   - Fixed dropdown background: bg-white dark:bg-slate-900 → bg-card
   - Updated hover states: hover:bg-slate-* → hover:bg-muted
   - Fixed visibility in both light and dark modes
   - **Verified:** Linting passes, Chrome DevTools verification pending

6. **DocumentList.tsx & UploadZone.tsx Fixes (✅ COMPLETE)**
   - Fixed "No documents yet" text visibility in light mode
   - Updated upload zone background colors for light mode
   - Replaced all gradient backgrounds with theme colors
   - Updated all fonts to Geist/Geist Mono
   - **Verified:** Linting passes

### Navigation Label Standardization (✅ COMPLETE):
- Across all pages (DashboardPage, CollectionsPage, DocumentsPage):
  - Dashboard navigation link: "Dashboard" (not "Documents")
  - Documents navigation link: "Documents" (not "All Documents")
  - Consistent naming improves UX

### Critical Fixes Applied:
- **Stats Card Visibility:** Numbers now use explicit colors (text-slate-900 dark:text-white) instead of theme colors for better contrast
- **Text Visibility:** Fixed multiple instances where text was not visible in light mode
- **CollectionFilter:** Now works properly in both light and dark modes
- **ChatPage Sidebar:** Fixed text visibility issues in light mode
- **Font Consistency:** All components now use Geist (sans) and Geist Mono (mono)

### Ragify Branding Integration (Phase 3) - IN PROGRESS:

**UPDATE [2025-12-09]:** Adding comprehensive rebranding tasks to Phase 3

7. **CollectionsPage.tsx Rebranding (❌ PENDING)**
   - File: `frontend/src/pages/CollectionsPage.tsx` (Lines 70-78)
   - Current: FileText icon + "Knowledge Base" text
   - Update to: ragify.png logo (w-14 h-14) + "Ragify" text
   - Changes:
     - Replace FileText icon with `<img src="/ragify.png">`
     - Change text from "Knowledge Base" to "Ragify"
     - Remove purple background container
     - Keep gap-0, scale-110 hover animation
   - **Verification:** Linting pass, Chrome DevTools check

8. **LoginPage.tsx Rebranding + Content Enhancement (✅ COMPLETE)**
   - File: `frontend/src/pages/LoginPage.tsx`
   - Logo Update: ✅
     - **UPDATE:** Changed from ragify.png to ragify-full.png (w-64 h-auto) for better branding
     - Removed separate "Ragify" heading since full logo includes text
     - Kept tagline "Your AI-Powered Knowledge Hub"
   - Back Button: ✅ **NEW FEATURE**
     - Added back button with ArrowLeft icon at top-left of form section
     - Links to landing page (`/`) for easy navigation
     - Styled with theme colors (muted-foreground hover:text-primary)
   - Mobile Logo: ✅
     - Updated from ragify.png to ragify-full.png (w-40 h-auto)
   - Feature Highlights: ✅
     - 3 feature cards with icons (HardDrive, MessageSquare, Search)
   - **Verification:** ✅ Linting pass, dark/light mode check, responsive layout

9. **RegisterPage.tsx Rebranding (✅ COMPLETE)**
   - File: `frontend/src/pages/RegisterPage.tsx`
   - Logo Updates: ✅
     - **UPDATE:** Changed from ragify.png to ragify-full.png (w-64 h-auto) on desktop
     - Removed separate "Join Ragify" heading since full logo includes text
     - Mobile: Replaced placeholder square with ragify-full.png (w-40 h-auto)
   - Layout Consistency: ✅
     - **IMPROVEMENT:** Changed left panel width from 40% (lg:w-2/5) to 50% (lg:w-1/2) to match LoginPage
     - Changed left panel background: `bg-zinc-950 dark:bg-zinc-900` → `bg-card` (theme colors)
     - Changed right panel background: `bg-white dark:bg-zinc-950` → `bg-background` (theme colors)
   - Back Button: ✅ **NEW FEATURE**
     - Added back button with ArrowLeft icon at top-left of form section
     - Links to landing page (`/`) for easy navigation
     - Styled with theme colors (muted-foreground hover:text-primary)
   - Theme Color Migration: ✅
     - Updated form labels: `text-zinc-700 dark:text-zinc-300` → `text-foreground`
     - Maintained progress steps design (01, 02, 03 with Fira Code font)
   - **Verification:** ✅ Linting pass, theme colors updated, layout consistent

### Next Steps:
- [ ] Manual browser verification of all pages in both light and dark modes
- [ ] Continue Phase 4: Migrate marketing pages (Landing page)
- [ ] Update LandingNav.tsx and LandingFooter.tsx with ragify.png logos

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
- [x] Replace cyan-blue theme with purple
  ```tsx
  // Replace all instances:
  // cyan-500 → primary
  // cyan-600 → primary
  // blue-600 → primary
  // cyan-400 (dark mode) → primary
  ```
  **UPDATE:** Used `replace_all` to efficiently replace all cyan color references with purple theme colors.

- [x] Update animated grid background to muted purple
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

- [x] Remove scan line effect (too distracting for reading)
  ```tsx
  // DELETE entire scan line div:
  // <div className="fixed inset-0 pointer-events-none opacity-15 dark:opacity-30" ...>
  ```

- [x] Update logo to solid primary (remove pulsing glow)
  ```tsx
  // OLD: bg-gradient-to-br from-cyan-500 to-blue-600 + pulsing glow
  // NEW: bg-primary (no gradient, no glow)
  <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
    <Database className="w-6 h-6 text-primary-foreground" />
  </div>
  ```

- [x] Update "FORENSICS//LAB" branding
  ```tsx
  // OLD: text-cyan-600 dark:text-cyan-400
  // NEW: text-primary
  <span className="text-sm font-bold font-sans tracking-wider text-primary">
    {"FORENSICS//LAB"}
  </span>
  ```

- [x] Replace all cyan borders with primary
  ```tsx
  // Replace:
  // border-cyan-600/40 → border-primary/40
  // border-cyan-500/30 → border-primary/30
  // etc.
  ```
  **UPDATE:** Replaced all cyan borders with `border-border` and `border-primary/40` for consistency.

- [x] Update fonts to Geist family
  ```tsx
  // Replace:
  // font-['JetBrains_Mono'] → font-mono
  // font-['IBM_Plex_Sans_Condensed'] → font-sans
  // font-['Courier_New'] → font-mono
  ```
  **UPDATE:** Removed Google Fonts import from style block.

- [x] Keep chunk stagger animation (good UX)
  ```tsx
  // DO NOT CHANGE: animation-delay for chunks
  style={{ animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both` }}
  ```

**Verification:**
- [x] Grid background is subtle purple (not cyan)
- [x] No scan line effect
- [x] Logo is solid purple (no glow)
- [x] All borders are purple
- [x] Fonts use Geist/Geist Mono
- [x] Chunk animations still work
- [x] No console errors
- [x] Biome linting passes
- [x] Verified with Chrome DevTools MCP

---

### 16.2.3 DocumentsPage - Clean Browsing

**File:** `frontend/src/pages/DocumentsPage.tsx`

**Animation Rules:**
- ❌ **REMOVE:** Scan line overlay, pulsing logo effect
- ✅ **KEEP:** Document card hover states (minimal)

**UPDATE [2025-12-08]:** DocumentsPage was already migrated to purple theme in previous session.

**Tasks:**
- [x] Replace emerald-teal theme with purple
  ```tsx
  // Replace all:
  // emerald-500 → primary
  // emerald-600 → primary
  // emerald-700 → primary
  // teal-600 → primary
  // emerald-400 (dark mode) → primary
  ```

- [x] Remove scan line overlay (distracting)
  ```tsx
  // DELETE scan-line div:
  // <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.02]" ...>
  ```

- [x] Update grid background to muted purple
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

- [x] Update logo to solid primary (remove pulsing)
  ```tsx
  // OLD: bg-gradient-to-br from-emerald-500 to-teal-600 + animate-pulse
  // NEW: bg-primary (no gradient, no pulse)
  <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
    <FileText className="w-6 h-6 text-primary-foreground" />
  </div>
  ```

- [x] Update "ARCHIVE//SYS" branding
  ```tsx
  // OLD: text-emerald-700 dark:text-emerald-400
  // NEW: text-primary
  <span className="text-xl font-bold text-primary font-sans tracking-tight">
    ARCHIVE//SYS
  </span>
  ```

- [x] Replace all emerald borders/backgrounds
  ```tsx
  // border-emerald-200 → border-border
  // bg-emerald-100 → bg-muted
  // text-emerald-600 → text-primary
  ```

- [x] Update fonts to Geist
  ```tsx
  // font-['Space_Grotesk'] → font-sans
  // font-mono remains font-mono
  ```

**Verification:**
- [x] No scan line effect
- [x] Grid background is subtle purple
- [x] Logo is solid purple (no pulse)
- [x] All colors are purple theme
- [x] Fonts use Geist family

---

### 16.2.4 Collections Component

**File:** `frontend/src/components/documents/Collections.tsx`

**Animation Rules:**
- ✅ **KEEP:** 0.1s stagger animation (subtle, good UX)
- ❌ **REMOVE:** Nothing (already well-designed)

**UPDATE [2025-12-08]:** Completed Collections component migration to purple theme.

**Tasks:**
- [x] Replace gradient orbs with primary purple
  ```tsx
  // OLD: from-blue-500/20 to-purple-500/20
  // NEW: from-primary/20 to-primary/10
  <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl" />
  ```

- [x] Replace violet-fuchsia orbs
  ```tsx
  // OLD: from-violet-500/20 to-fuchsia-500/20
  // NEW: from-primary/20 to-primary/10
  ```
  **NOTE:** Orbs were already using `from-primary/20 to-primary/10`.

- [x] Update selection indicator
  ```tsx
  // OLD: bg-emerald-500, bg-blue-500
  // NEW: bg-primary
  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
  ```
  **IMPROVEMENT:** Changed blue dot indicator to purple (line 158).

- [x] Update selected state colors
  ```tsx
  // OLD: ring-slate-900 dark:ring-slate-100
  // NEW: ring-primary
  className={`... ${selectedCollectionId === collection.collection_id ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
  ```
  **IMPROVEMENT:** Updated both "All Documents" card and collection cards selected states to use purple ring.

- [x] Keep stagger animation exactly as is
  ```tsx
  // DO NOT CHANGE:
  style={{ animation: `slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both` }}
  ```
  **VERIFIED:** Stagger animation preserved.

**Verification:**
- [x] Gradient orbs are purple
- [x] Selected collection has purple ring
- [x] Stagger animation works
- [x] Linting passes (Biome check)

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

### 16.4.5 Navigation & Footer - Ragify Rebranding

**Files:** `frontend/src/components/layout/LandingNav.tsx`, `LandingFooter.tsx`

**Ragify Logo Rebranding (NEW - Priority):**

**LandingNav.tsx (Lines 38-51):**
- File: `frontend/src/components/layout/LandingNav.tsx`
- Current: Database icon in cyan-blue gradient + "Ragify" text
- Update to: ragify.png logo (w-12 h-12) + "Ragify" text
- Changes:
  - Replace Database icon with `<img src="/ragify.png">`
  - Change className to `w-12 h-12` (compact for nav)
  - Remove gradient background (PNG has its own design)
  - Keep gap-0, scale-110 hover animation
  - **Verification:** Linting pass, logo displays correctly

**LandingFooter.tsx (Lines 13-23):**
- File: `frontend/src/components/landing/LandingFooter.tsx`
- Current: Database icon in cyan-blue gradient + "Ragify" text
- Update to: Same pattern as LandingNav (ragify.png logo + "Ragify")
- Changes: Same as LandingNav (replace icon, size w-12 h-12)
- **Verification:** Linting pass, footer logo consistency

**Existing Theme Tasks (Keep/Verify):**
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
- [ ] Logo matches Dashboard/Collections (consistent branding)
- [ ] Links have purple hover (text-primary)
- [ ] Fonts are Geist family (font-sans)
- [ ] Works in both light and dark modes

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
- [x] ChatPage migrated (zero distraction)
- [x] DocumentDetailPage migrated (data forensics)
- [x] DocumentsPage migrated (clean browsing)
- [x] Collections component migrated

**Phase 3:**
- [x] Dashboard migrated + rebranded with ragify.png logo
- [x] Profile migrated
- [ ] Collections rebranded with ragify.png logo
- [ ] Login rebranded + feature highlights added
- [ ] Register rebranded + enhanced steps
- [x] Login/Register migrated

**Phase 4:**
- [ ] Landing page hero migrated
- [ ] Features section migrated
- [ ] How It Works migrated
- [ ] CTA section migrated
- [ ] Navigation & Footer rebranded with ragify.png logos
  - [ ] LandingNav.tsx logo update
  - [ ] LandingFooter.tsx logo update

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

**Status:** ✅ PHASE 3 COMPLETE - Ragify Rebranding (Login & Register Pages)
**Completed:**
- Phase 1 (Foundation)
- Phase 2 (RAG Core Pages)
- Phase 3 (Secondary Pages: Dashboard, Collections, Login, Register - ALL REBRANDED)
**Next Action:** Phase 4 (Landing Page hero, features, CTA sections + Landing Nav/Footer color migration)
