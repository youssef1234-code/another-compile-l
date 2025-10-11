# Quick Reference Guide

This is a condensed reference for implementing Polaris design principles in your application.

## Installation

```bash
npm install @shopify/polaris
```

## Key Design Principles

### Pro Design Language
1. **Assign Meaning** - Clear visual language with purposeful color
2. **Increase Density** - Optimized space with high usability  
3. **Craft Juicy Interactions** - Realistic, responsive feedback
4. **Make it Predictable** - Consistent behavior for similar elements

### Color Philosophy
- **Purpose**: Each color usage tied to specific meaning
- **Impact**: Monochromatic base makes colors stand out
- **Accessibility**: Never use color alone to convey meaning

### Depth Strategy
- **Hierarchy**: Higher elements appear more important
- **Interactivity**: Depth indicates interactive elements
- **Focus**: Guides merchant attention strategically

## Color Roles Quick Reference

| Role | Purpose | Usage |
|------|---------|-------|
| Default | Baseline theme | All admin elements |
| Brand | Primary actions | Main CTAs, important actions |
| Success | Completed actions | Confirmations, positive states |
| Info | Important information | Tips, promotions, general info |
| Caution | Non-urgent attention | Incomplete states, stalled processes |
| Warning | Needs intervention | Pending states, requires action |
| Critical | Immediate action | Errors, blocked states |
| Magic | AI/automation | Sidekick, AI features |
| Emphasis | Active/selected | Editor selections, focus areas |

## Shadow Tokens

| Components | Shadow Tokens |
|------------|---------------|
| Cards, Tables, Resource lists | `--p-shadow-100`, `--p-shadow-bevel-100` |
| Banners, Callout cards | `--p-shadow-200`, `--p-shadow-bevel-100` |
| Popovers, Tooltips | `--p-shadow-300`, `--p-shadow-bevel-100` |
| Toasts | `--p-shadow-400`, `--p-shadow-bevel-100` |
| Modals | `--p-shadow-600`, `--p-shadow-bevel-100` |

## Space Token System

- **Base Unit**: 4px
- **Token Format**: `space-[multiplier]` (e.g., `space-100` = 4px, `space-400` = 16px)
- **Usage**: padding, margin, gap properties only
- **Semantic First**: Use semantic tokens over primitive when available

## Icon Guidelines

- **Container**: 20×20px
- **Safe Area**: 16×16px  
- **Stroke Weight**: 1.5px
- **Style**: Outlined (default), Filled (navigation only)
- **Alignment**: Vertical with typography

## Layout Density

### High Density
- Data tables and index pages
- Option lists and popovers
- Search results
- Use divider lines for separation

### Low Density  
- Product detail pages
- Settings and configuration
- Form completion flows
- Use cards for context switching

## Quick Do's and Don'ts

### ✅ Always Do
- Group related information together
- Use consistent interaction patterns  
- Apply appropriate color roles
- Align icons with typography
- Size elements based on importance
- Test for accessibility

### ❌ Never Do
- Use color alone to convey meaning
- Break established visual patterns
- Resize icons (breaks typography relationship)
- Use divider lines outside data tables
- Apply decorative color usage
- Create inconsistent depth patterns

## Component Token Reference

### Button Depth
```css
box-shadow: var(--p-shadow-bevel-100);
```

### Card Elevation
```css
box-shadow: var(--p-shadow-100), var(--p-shadow-bevel-100);
```

### Token Pairing Example
```css
.elevated-surface {
  position: relative;
  box-shadow: var(--p-shadow-200);
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    box-shadow: var(--p-shadow-bevel-100);
    mix-blend-mode: luminosity;
    pointer-events: none;
  }
}
```

## Implementation Checklist

- [ ] Install Polaris React components
- [ ] Set up design tokens (colors, shadows, spacing)
- [ ] Define component hierarchy and roles
- [ ] Apply consistent interaction patterns
- [ ] Test color contrast and accessibility
- [ ] Validate responsive behavior
- [ ] Review against Pro design principles

---

*For detailed information, refer to the complete documentation sections.*
