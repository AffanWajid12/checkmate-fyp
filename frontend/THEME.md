# Checkmate Theme Guide

This document describes the consistent theme colors and design tokens used throughout the Checkmate application.

## Color Palette

### Primary Colors
- **primary**: `#000000` (Black) - Main brand color
  - Usage: Primary buttons, logos, main UI elements
  - Variants:
    - `primary-hover`: Slightly lighter for hover states
  - Classes: `bg-primary`, `text-primary`, `border-primary`

### Accent Colors (Teal/Cyan)
The accent color represents energy, innovation, and technology.

- **accent-50**: `#f0fdfa` - Lightest teal for backgrounds
- **accent-100**: `#ccfbf1` - Light borders and subtle backgrounds
- **accent-200**: `#99f6e4` - Light accents and gradient endpoints
- **accent-300**: `#5eead4` - Medium accents
- **accent-400**: `#2dd4bf` - **Main accent color** (default)
- **accent-500**: `#14b8a6` - Darker accent for contrast

Classes: `bg-accent`, `text-accent`, `border-accent`, `from-accent-400`, `to-accent-200`

### Neutral/Gray Scale
Used for text, borders, backgrounds, and UI elements.

- **neutral-50**: `#f9fafb` - Almost white backgrounds
- **neutral-100**: `#f3f4f6` - Light gray backgrounds
- **neutral-200**: `#e5e7eb` - Borders and dividers
- **neutral-400**: `#9ca3af` - Muted text
- **neutral-500**: `#6b7280` - Secondary text (default)
- **neutral-600**: `#4b5563` - Primary text (dark gray)
- **neutral-700**: `#374151` - Darker text
- **neutral-800**: `#1f2937` - Very dark gray
- **neutral-900**: `#111827` - Almost black

Classes: `bg-neutral-100`, `text-neutral-600`, `border-neutral-200`

### Semantic Colors

#### Background
- **background**: `#ffffff` (White) - Default background
- **background-secondary**: `#f9fafb` (Gray-50) - Secondary sections
- **background-dark**: `#000000` (Black) - Dark sections like footer/CTA

Classes: `bg-background`, `bg-background-secondary`, `bg-background-dark`

#### Text
- **text-primary**: `#111827` - Main text color (almost black)
- **text-secondary**: `#6b7280` - Secondary text (medium gray)
- **text-muted**: `#9ca3af` - Muted/placeholder text (light gray)
- **text-inverse**: `#ffffff` - White text on dark backgrounds

Classes: `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-inverse`

#### Status Colors
- **success**: `#10b981` (Green) - Success states, positive indicators
- **success-light**: `#d1fae5` - Light success backgrounds
- **error**: `#ef4444` (Red) - Error states, negative indicators
- **error-light**: `#fee2e2` - Light error backgrounds

Classes: `bg-success`, `text-success`, `bg-error`, `text-error`

## Gradients

Pre-configured gradient backgrounds:

1. **Accent Gradient**: Teal gradient (accent-400 → accent-200)
   - Class: `bg-gradient-accent`
   - Used for hero text, highlights

2. **Success Gradient**: Teal to green (accent-400 → success)
   - Class: `bg-gradient-success`
   - Used for progress bars, achievement indicators

### Text Gradients
```jsx
<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-200">
  Gradient Text
</span>
```

## Typography Scale

Use Tailwind's default typography scale with these colors:
- Headings: `text-text-primary`
- Body text: `text-text-secondary`
- Captions/metadata: `text-text-muted`

## Border Radius

Custom border radius values:
- `rounded-xl`: 0.75rem (12px)
- `rounded-2xl`: 1rem (16px)
- `rounded-3xl`: 1.5rem (24px)

## Shadows

Tailwind's shadow utilities with custom values:
- `shadow-sm`: Subtle shadow for cards
- `shadow-md`: Medium shadow for elevated elements
- `shadow-lg`: Large shadow for modals/popovers
- `shadow-xl`: Extra large shadow for prominent elements
- `shadow-2xl`: Dramatic shadow for hero sections

## Usage Examples

### Primary Button
```jsx
<button className="bg-primary text-text-inverse px-8 py-4 rounded-full font-semibold hover:bg-primary-hover transition-colors">
  Get Started
</button>
```

### Secondary Button
```jsx
<button className="bg-background text-text-primary border border-neutral-200 px-8 py-4 rounded-full font-semibold hover:bg-neutral-50 transition-colors">
  Learn More
</button>
```

### Accent Button (CTA)
```jsx
<button className="bg-accent text-primary px-8 py-4 rounded-full font-semibold hover:bg-accent-300 transition-colors">
  Start Free Trial
</button>
```

### Card
```jsx
<div className="bg-background rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow p-6">
  {/* Card content */}
</div>
```

### Badge/Tag
```jsx
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-100">
  <span className="w-2 h-2 rounded-full bg-accent-400"></span>
  <span className="text-xs font-semibold text-text-secondary">New Feature</span>
</div>
```

### Section Headers
```jsx
<h2 className="text-3xl font-bold text-text-primary mb-4">
  Section Title
</h2>
<p className="text-text-secondary">
  Section description text
</p>
```

## Dark Mode Considerations

The current theme is optimized for light mode. For dark mode support, consider:
- Inverting background and text colors
- Adjusting accent colors for better contrast
- Using `dark:` variants in Tailwind classes

## Accessibility

- Ensure contrast ratios meet WCAG AA standards (4.5:1 for normal text)
- Use semantic color names (success/error) instead of colors like "green/red"
- Test with screen readers and keyboard navigation
- Provide focus indicators using `focus:ring-accent-400`

## Consistency Tips

1. Always use theme colors instead of arbitrary values
2. Use semantic color names (text-primary, bg-accent) for maintainability
3. Keep hover states consistent (lighter for light backgrounds, darker for dark backgrounds)
4. Use rounded-full for buttons, rounded-2xl/3xl for cards
5. Apply transition-colors for smooth hover effects
6. Layer shadows appropriately (sm for cards, xl for modals)

## Extending the Theme

To add new colors or modify existing ones:

1. Edit `tailwind.config.js` in the `theme.extend.colors` section
2. Follow the naming convention (primary, accent, neutral, semantic names)
3. Update this documentation
4. Test across all components for consistency
