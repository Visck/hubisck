# Hubisck Landing Page - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern SaaS landing pages like Linktree, Notion, and Linear, with emphasis on clarity, conversion optimization, and multilingual accessibility.

## Core Design Principles
- **Color-Driven Identity**: Orange (#FF6600) as primary brand color with white (#FFFFFF) backgrounds for maximum contrast and energy
- **Conversion-Focused**: Clear CTAs, streamlined user flow from awareness to sign-up
- **Multilingual Excellence**: Seamless language switching without layout breaks (PT/EN/FR)
- **Trust & Transparency**: Prominent pricing, security badges, clear value proposition

## Typography
- **Font Family**: Roboto (primary) with Arial as fallback
- **Hierarchy**:
  - Hero Headline: 3xl-4xl, bold (700), tight leading
  - Section Titles: 2xl-3xl, semibold (600)
  - Body Text: base-lg, regular (400), relaxed leading
  - CTA Buttons: base-lg, medium (500)
  - Footer/Legal: sm, regular (400)

## Layout System
**Spacing Units**: Tailwind 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Section Padding: py-16 to py-24 (desktop), py-12 (mobile)
- Container: max-w-6xl with px-6
- Component Gaps: gap-8 to gap-12 for feature grids

## Color Palette
- **Primary Orange**: #FF6600 (buttons, accents, logo, highlights)
- **White**: #FFFFFF (backgrounds, text on orange)
- **Supporting**:
  - Gray-900: #111827 (primary text)
  - Gray-600: #4B5563 (secondary text)
  - Gray-100: #F3F4F6 (subtle backgrounds)
  - Success/Trust Green: #10B981 (for security badges)

## Component Library

### Header
- Fixed/sticky positioning with subtle shadow on scroll
- Logo (Hubisck) in orange on left
- Language selector with flags (PT 🇧🇷, EN 🇬🇧, FR 🇫🇷) - dropdown or inline buttons
- Right-aligned: "Login" (text link) + "Cadastre-se/Sign Up/S'inscrire" (orange button)

### Hero Section
- **Layout**: Single column, centered, 80vh minimum height
- **Background**: White with subtle gradient or orange accent elements
- **Image**: Hero illustration or mockup of Hubisck interface (right side on desktop, below on mobile)
- **Content Structure**:
  - Headline with orange highlight on key words
  - Supporting description (2-3 lines)
  - Primary CTA: Large orange button "Comece Grátis/Get Started/Commencer"
  - Trust indicators below CTA: "Pagamento seguro via Stripe" with small badge icons

### Benefits/Features Section
- **Layout**: 3-column grid (desktop), single column (mobile)
- **Cards**:
  - Icon (orange) at top or left
  - Title in bold
  - Description text
  - Hover: Subtle lift effect
- **Features to highlight**:
  1. Easy to use (rocket/lightning icon)
  2. Multilingual (globe icon)
  3. Remarketing with Google Ads (target icon)
  4. Analytics (chart icon)
  5. Responsive design (devices icon)
  6. Customizable (paintbrush icon)

### Pricing Section
- **Layout**: Single centered card with spotlight treatment
- **Card Design**:
  - White card with orange border/shadow
  - Large price display with currency auto-detection
  - "R$19,99/mês", "€19.99/month", "$19.99/month"
  - Feature checklist with checkmarks
  - Stripe security badge
  - Large orange CTA: "Assine Agora/Subscribe Now/S'abonner"
- Mention: "Pagamento seguro e recorrente via Stripe"

### Footer
- **Layout**: Multi-column (desktop), stacked (mobile)
- **Sections**:
  - Column 1: Logo + tagline
  - Column 2: Links (Termos, Privacidade, Contato)
  - Column 3: Social media icons (orange on hover)
  - Bottom bar: Copyright "© 2025 Hubisck - Todos os direitos reservados"
- Background: Light gray (gray-50) with top border

## Responsive Behavior
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Hero: Stack image below text on mobile
- Features: 1 column mobile, 2 columns tablet, 3 columns desktop
- Header: Collapse to hamburger menu below md breakpoint

## Interactions
- **Language Switcher**: Instant content swap without page reload
- **Currency Detection**: Automatic based on browser locale/IP
- **Buttons**: Orange background, white text, hover: darken, active: scale slightly
- **Cards**: Subtle hover elevation (shadow increase)
- **Minimal animations**: Smooth transitions only, no distracting effects

## Images
- **Hero Image**: Mockup of Hubisck interface showing a personalized link page with multiple social links - right-aligned on desktop (40% width), full-width below headline on mobile
- **Icons**: Use Heroicons or Font Awesome for benefit/feature icons
- **Flags**: Small inline flag emojis or icons for language selector

## Accessibility
- High contrast orange/white combination
- Focus states on all interactive elements
- ARIA labels for language switcher
- Semantic HTML structure
- Minimum touch target 44x44px for mobile

This design delivers a high-energy, conversion-optimized landing page that balances Hubisck's vibrant brand identity with professional SaaS credibility.