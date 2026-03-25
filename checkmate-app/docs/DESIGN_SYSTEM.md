# CheckMate Design System

## Brand Identity

### App Name
**CHECKMATE**

### Tagline
*Grading Made Easy*

### Logo
The CheckMate logo features a chess knight piece combined with a brain, symbolizing strategic thinking and intelligence, with a checkmark representing completion and verification.

## Color Palette

### Primary Colors
- **Primary**: `#13B2A9` (Teal) - Used for primary buttons, links, and key interactive elements
- **Primary Dark**: `#0F8C84` - Used for hover states and pressed states
- **Black/Dark**: `#2C3E50` - Used for primary text and headings

### Background Colors
- **Background**: `#FFFFFF` (White) - Main background color
- **Surface**: `#F8F8F8` - Card backgrounds and secondary surfaces
- **Input Background**: `#F7F7F7` - Input field backgrounds

### Text Colors
- **Text Primary**: `#2C3E50` - Main text content
- **Text Secondary**: `#7F8C8D` - Secondary text, labels
- **Text Tertiary**: `#95A5A6` - Disabled or tertiary text
- **Placeholder**: `#BDC3C7` - Input placeholder text

### Semantic Colors
- **Success**: `#13B2A9` - Success messages and states
- **Error**: `#FF5252` - Error messages and states
- **Warning**: `#FFC107` - Warning messages
- **Info**: `#2196F3` - Informational messages

### Border & Divider
- **Border**: `#E0E0E0` - Standard borders
- **Divider**: `#F0F0F0` - Section dividers

## Typography

### Font Sizes
- **H1**: 32px, Weight: 700
- **H2**: 24px, Weight: 600
- **H3**: 20px, Weight: 600
- **Body**: 16px, Weight: 400
- **Caption**: 14px, Weight: 400
- **Small**: 12px, Weight: 400

### Font Weights
- Regular: 400
- Medium: 500
- Semi-bold: 600
- Bold: 700

## Spacing

### Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

## Border Radius

- **sm**: 8px - Input fields, buttons
- **md**: 12px - Cards
- **lg**: 16px - Larger containers
- **xl**: 24px - Modal dialogs
- **round**: 9999px - Circular elements

## Components

### Buttons

#### Primary Button
- Background: `theme.colors.primary` (#13B2A9)
- Text: White
- Border Radius: 8px
- Padding: 16px vertical, 48px horizontal
- Font Size: 16px
- Font Weight: 600

#### States
- Hover: `theme.colors.primaryDark` (#0F8C84)
- Pressed: Slightly darker with opacity
- Disabled: 50% opacity

### Input Fields

- Background: `theme.colors.inputBackground` (#F7F7F7)
- Border Radius: 8px
- Padding: 16px
- Font Size: 16px
- Icon Color: `theme.colors.textSecondary` (#7F8C8D)
- Placeholder Color: `theme.colors.placeholder` (#BDC3C7)

### Cards
- Background: `theme.colors.card` (#FFFFFF)
- Border Radius: 12px
- Shadow: Subtle elevation
- Padding: 24px

## Iconography

### Icon Library
We use **Ionicons** from `@expo/vector-icons`

### Common Icons
- `mail-outline` - Email input
- `lock-closed-outline` - Password input
- `person-outline` - Name/Profile input
- `eye-outline` / `eye-off-outline` - Password visibility toggle

### Icon Sizes
- Small: 16px
- Medium: 20px
- Large: 24px
- XLarge: 32px

## Shadows

### Shadow Definitions
```typescript
sm: {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
}

md: {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

lg: {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 5,
}
```

## Screen Layouts

### Authentication Screens
- Centered content with vertical alignment
- Logo at the top
- App title and subtitle
- Form fields with icons
- Primary action button
- Secondary links at the bottom

### Spacing Guidelines
- Screen padding: 32px horizontal
- Form elements margin: 16px vertical
- Section spacing: 24px

### Main App Screens (Courses, Students, Exams, Settings)
- Header with title at the top
- Content area with cards or list items
- Bottom tab navigation
- Floating action buttons where needed

### Bottom Navigation
- 60px height with padding
- 4 tabs: Courses, Students, Exams, Settings
- Active tab color: Primary teal (#13B2A9)
- Inactive tab color: Text secondary (#7F8C8D)
- Icons from Ionicons (outline variants)
- Border top with subtle color

### Course Cards
- White background with subtle shadow
- 12px border radius
- Left-aligned content with right chevron
- Course title, code, semester, and student count
- Touch feedback for navigation

## Best Practices

1. **Always use theme colors** - Never hardcode color values
2. **Consistent spacing** - Use the spacing scale from the theme
3. **Accessible touch targets** - Minimum 44px height for interactive elements
4. **Icon consistency** - Use Ionicons for all icon needs
5. **Typography hierarchy** - Use defined font sizes and weights
6. **Shadow depth** - Use appropriate shadow levels for visual hierarchy

## Usage Example

```typescript
import { theme } from '@/constants/theme';

// Use theme colors
backgroundColor: theme.colors.primary
color: theme.colors.textPrimary

// Use theme spacing
padding: theme.spacing.md
marginBottom: theme.spacing.lg

// Use theme border radius
borderRadius: theme.borderRadius.sm

// Use theme typography
fontSize: theme.typography.h2.fontSize
fontWeight: theme.typography.h2.fontWeight
```
