---
name: Clinical Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#4345d1'
  on-tertiary: '#ffffff'
  tertiary-container: '#5d60eb'
  on-tertiary-container: '#faf6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is engineered for the intersection of clinical reliability and modern software intelligence. The personality is **authoritative yet empathetic**, moving away from the cold, industrial feel of legacy medical records toward a "human-centric AI" experience. 

The visual style is **Clinical Modernism**, a hybrid of high-end SaaS (Linear) and accessible healthcare (Google Health). It emphasizes clarity through:
- **Spaciousness:** Generous negative space to reduce cognitive load during critical decision-making.
- **Glassmorphism:** Subtle background blurs used specifically for overlays and persistent navigation to maintain context.
- **Soft Precision:** High-fidelity details like fine 1px borders combined with large, welcoming corner radii.
- **Dynamic Feedback:** Subtle motion and waveform patterns that indicate the "living" nature of the AI-integrated platform.

## Colors

The palette is rooted in a "Safe Blue" spectrum, optimized for long-term screen usage by healthcare professionals.

- **Primary (Medical Blue):** A vibrant, high-contrast blue used for primary actions and brand presence.
- **Success (Emerald):** Used for stable vitals, completed tasks, and positive health outcomes.
- **Warning/Critical:** Standardized Amber and Red tones for triage and alert states, ensuring immediate visual prioritization.
- **Neutral (Slate):** A cool-toned grey scale that avoids the "deadness" of pure black, maintaining a modern, tech-forward feel.
- **Surface:** A crisp, slightly blue-tinted white (`#FAFBFF`) used to differentiate the application from standard white browser chrome.

## Typography

The system utilizes a dual-font strategy to balance technical precision with extreme legibility.

- **Headlines & Labels (Geist):** Used for data points, headers, and UI controls. Its monospaced-influenced tracking provides a "calculated" and precise feel suitable for medical data.
- **Body Text (Inter):** Used for patient notes, descriptions, and long-form content. Inter's tall x-height ensures readability even at smaller sizes in dense medical charts.
- **Hierarchy:** We use a strict typographic scale. Labels are often uppercase with slight letter-spacing to distinguish them from interactive data points.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **The "Contextual Sidebar":** On desktop, the primary navigation is a slim vertical bar, with a secondary expandable panel for patient context or AI assistance.
- **Spacing Rhythm:** We follow an 8px soft-grid system. However, "Breathable Padding" (24px+) is mandated for all primary containers to prevent the "claustrophobic" feel typical of clinical software.
- **Breakpoints:**
  - Mobile: < 768px (Full-width cards, bottom-anchored actions).
  - Tablet: 768px - 1280px (2-column layouts, collapsible sidebars).
  - Desktop: > 1280px (Multi-pane dashboarding, persistent AI sidebar).

## Elevation & Depth

This design system uses a **Tonal-Glass Layering** approach to convey hierarchy without relying on heavy, distracting shadows.

1.  **Level 0 (Base):** The canvas color (`#FAFBFF`).
2.  **Level 1 (Cards):** Pure white background with a 1px border (`#E2E8F0`) and a very soft, large-radius shadow (0px 4px 20px rgba(0,0,0,0.03)).
3.  **Level 2 (Overlays/Modals):** Subtle glassmorphism using `backdrop-filter: blur(12px)` and a semi-transparent white fill (rgba(255, 255, 255, 0.8)). 
4.  **Floating Elements:** Action buttons and critical alerts use a more pronounced shadow to appear "hovering" over the data layer.

## Shapes

The shape language is **Organic & Friendly**. 

- **Standard Radius:** 16px (1rem) for primary cards and main UI containers.
- **Small Radius:** 8px (0.5rem) for input fields, buttons, and smaller interactive elements.
- **Pill Shapes:** Used exclusively for status indicators (Chips) and Floating Action Buttons (FABs) to make them instantly recognizable as interactive/status-based.
- **Waveforms:** AI voice states and heart rates should use rounded stroke caps to maintain the soft aesthetic.

## Components

- **Medical Cards:** Use 24px internal padding. Headers should have a subtle bottom divider. For AI-generated content, use a very light indigo background tint to distinguish from manual entries.
- **Vitals Chips:** Compact, pill-shaped indicators. Include a small icon (e.g., a heart for BPM) and use the semantic color (Success/Warning) for the text and icon, with a 10% opacity background of the same color.
- **AI Action Bar:** A sticky, glassmorphic bar at the bottom of the viewport or container. It features a "Sparkle" icon and Geist-typed text to indicate AI-assisted drafting or analysis.
- **Buttons:** 
  - *Primary:* Solid Medical Blue, bold Geist labels, 12px vertical padding.
  - *Secondary:* 1px Slate border, transparent background.
- **Input Fields:** Large (48px height) with 12px internal padding. On focus, the border transitions to Primary Blue with a 3px soft blue outer glow.
- **Waveform Animations:** For AI listening/speaking states, use 4-6 vertical bars with varying heights and a 200ms ease-in-out transition, mirroring an ECG rhythm.