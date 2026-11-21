---
name: FloodGuard AI
colors:
  surface: '#f8faf9'
  surface-dim: '#d8dada'
  surface-bright: '#f8faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f3'
  surface-container: '#eceeed'
  surface-container-high: '#e6e9e8'
  surface-container-highest: '#e1e3e2'
  on-surface: '#191c1c'
  on-surface-variant: '#414845'
  inverse-surface: '#2e3131'
  inverse-on-surface: '#eff1f0'
  outline: '#717975'
  outline-variant: '#c1c8c4'
  surface-tint: '#406659'
  primary: '#00271d'
  on-primary: '#ffffff'
  primary-container: '#173d32'
  on-primary-container: '#81a899'
  inverse-primary: '#a7cfc0'
  secondary: '#006c4b'
  on-secondary: '#ffffff'
  secondary-container: '#88f5c3'
  on-secondary-container: '#00714e'
  tertiary: '#00223f'
  on-tertiary: '#ffffff'
  tertiary-container: '#003861'
  on-tertiary-container: '#67a3e4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c2ebdb'
  primary-fixed-dim: '#a7cfc0'
  on-primary-fixed: '#002018'
  on-primary-fixed-variant: '#284e42'
  secondary-fixed: '#8af7c6'
  secondary-fixed-dim: '#6edbab'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005138'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#9ecaff'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#00497c'
  background: '#f8faf9'
  on-background: '#191c1c'
  surface-variant: '#e1e3e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a calm, authoritative, and precision-driven interface for emergency management and hydrological GIS intelligence. Designed for emergency operations centers, municipal planners, and field responders, it prioritizes rapid situational awareness and cognitive clarity under high-stress conditions.

The visual language blends **Corporate / Modern** structure with **Minimalism** and **Low-contrast outlines**. By pairing a crisp, light-mode cartographic canvas with disciplined typography and a strict emergency color hierarchy, the interface ensures that critical flood-risk data stands out immediately without visual noise. Translucent risk overlays sit cleanly atop light geographical basemaps, avoiding heavy shadows, glassmorphism, or decorative purple-blue gradients.

## Colors

The palette is anchored in a high-legibility light mode engineered for extended monitoring and bright-environment field use.

### Surface & Neutral Tokens
- **Primary Background (`#F7F9F8`):** The foundational canvas for dashboards and map-adjacent workspaces.
- **Card Background (`#FFFFFF`):** Elevated content containers, data panels, and floating map controls.
- **Secondary Surface (`#E9F1ED`):** Subtle tinted containers for grouped telemetry, table headers, and active sidebar states.
- **Borders (`#E3EAE6`):** Crisp 1px structural dividers and card outlines.
- **Main Text (`#1C2924`):** High-contrast charcoal-green for primary headings, metrics, and body copy.
- **Secondary Text (`#64736C`):** Muted slate-green for timestamps, coordinates, and supporting metadata.

### Brand & Action Tokens
- **Primary Brand (`#173D32`):** Deep forest green used for navigation headers, brand anchors, and primary structural emphasis.
- **Primary Action (`#249B70`):** Emerald green reserved for primary CTAs, active toggles, and positive confirmation states.

### Emergency Colour System & GIS Overlays
- **Low Risk (`#249B70`):** Normal hydrological levels and safe zones.
- **Moderate Risk (`#E7AC38`):** Watch status, rising water levels, and advisory alerts.
- **High Risk (`#E47B39`):** Warning status, imminent flooding, and evacuation preparation.
- **Critical Risk (`#D94848`):** Emergency status, severe inundation, and immediate life-safety action.
- **Information (`#3979B7`):** Sensor status, weather feeds, and neutral system notifications.

On light geographical GIS basemaps, emergency colors are applied as translucent polygon fills (15%–30% opacity) with 1.5px solid borders in the corresponding full-saturation hue to preserve underlying street and terrain legibility.

## Typography

**Inter** serves as the sole typeface across headlines, body copy, and UI labels, delivering neutral, utilitarian clarity for dense telemetry and map annotations.

- **Numeric Precision:** Enable tabular figures (`font-variant-numeric: tabular-nums`) on all sensor readings, water-level metrics, timestamps, and coordinate readouts to prevent layout jitter during live updates.
- **Hierarchy:** Headlines use tight tracking (`-0.01em` to `-0.02em`) and semibold-to-bold weights, while uppercase micro-labels (`label-sm`) use wide tracking (`0.04em`) for rapid scanning in dense data tables and GIS legends.

## Layout & Spacing

The layout employs a **12-column fluid grid** with `1rem` (16px) gutters and `1.5rem` (24px) outer margins, allowing split-screen GIS map viewports and telemetry sidebars to scale seamlessly.

- **Desktop (≥ 1024px):** Full 12-column grid. Typically structured as a persistent left navigation rail, a fluid 7–8 column GIS map canvas, and a 4–5 column docked intelligence panel.
- **Tablet (768px – 1023px):** Collapses to an 8-column grid with `1rem` margins; secondary telemetry panels dock as slide-over drawers.
- **Mobile (< 768px):** 4-column grid with `1rem` margins. The map occupies the primary viewport with a bottom-sheet summary card for active alerts.

## Elevation & Depth

Hierarchy is communicated through **tonal surface layering** and **low-contrast 1px `#E3EAE6` borders** rather than heavy drop shadows or glassmorphism.

- **Base Canvas (`#F7F9F8`):** Hosts the primary workspace and recessed layout regions.
- **Standard Cards (`#FFFFFF`):** Separated from the canvas by a crisp `1px solid #E3EAE6` border with zero shadow.
- **Floating Map Controls & Popovers (`#FFFFFF`):** Use a `1px solid #E3EAE6` border paired with a minimal ambient shadow (`0 2px 8px rgba(23, 61, 50, 0.06)`) to ensure legibility over complex cartographic terrain.

## Shapes

The design system uses a **Rounded** shape language (`0.5rem` / `8px` base radius) to balance technical precision with approachable clarity.

- **Standard Controls & Cards:** `8px` (`0.5rem`) corner radius for buttons, input fields, alert banners, and data cards.
- **Large Containers:** `16px` (`1rem`) for modal dialogs and bottom sheets.
- **Status Pills & Badges:** Full pill rounding (`9999px`) for compact risk-level indicators and map filter chips.

## Components

- **Buttons:** Primary actions use `#249B70` fill with `#FFFFFF` text and `8px` radius. Secondary actions use `#FFFFFF` fill, `1px solid #E3EAE6` border, and `#1C2924` text. Destructive/critical overrides use `#D94848`.
- **Chips & Risk Badges:** Compact pill-shaped indicators (`label-sm`) using tinted backgrounds (12% opacity of the respective emergency color) paired with full-saturation text and a `1px` border in the same hue.
- **Cards:** `#FFFFFF` background, `1px solid #E3EAE6` border, `8px` radius, and `1.5rem` (`space-lg`) internal padding.
- **Input Fields:** `#FFFFFF` background, `1px solid #E3EAE6` border, `8px` radius, `#1C2924` text, and `#64736C` placeholder text. Focus states apply a `2px` `#249B70` ring.
- **Lists & Data Tables:** Alternating `#FFFFFF` and `#F7F9F8` rows separated by `1px solid #E3EAE6` dividers, with `#E9F1ED` for hover and selected states.
- **Checkboxes & Radio Buttons:** `1px solid #E3EAE6` borders on `#FFFFFF` backgrounds, transitioning to `#249B70` fill with crisp white checkmarks when active.
- **GIS Map Controls & Alert Banners:** Floating `#FFFFFF` control clusters with `1px solid #E3EAE6` borders and minimal ambient shadow. Alert banners feature a `4px` left accent bar in the corresponding emergency color (`#249B70`, `#E7AC38`, `#E47B39`, `#D94848`, or `#3979B7`) on a `#FFFFFF` surface.