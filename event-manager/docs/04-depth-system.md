# Depth System

> *"Depth introduces a sense of realism, helps establish visual hierarchy, and creates focus."*

## Core Principles

### 1. 📊 Hierarchy
**Higher elements in the Z scale appear more important**
- Guides merchant navigation through the interface
- Differentiates between primary and secondary elements
- Establishes clear information architecture

### 2. 🖱️ Interactivity
**Depth indicates interactive elements**
- Interactive components get more depth
- Signals what merchants can interact with
- Provides visual feedback for actions

### 3. 🎯 Focus
**Depth guides merchant attention**
- Higher depth elements draw focus
- Highlights important information
- Creates visual flow through interfaces

## Creating Depth

### Visual Hierarchy Techniques

#### Shadows & Bevels
Create the illusion of elevation above the interface:

```css
/* Elevation shadows */
--p-shadow-100: 0px 1px 0px rgba(22, 29, 37, 0.05);
--p-shadow-200: 0px 3px 2px rgba(22, 29, 37, 0.06);
--p-shadow-300: 0px 4px 8px rgba(22, 29, 37, 0.12);
--p-shadow-600: 0px 26px 80px rgba(22, 29, 37, 0.25);

/* Bevel effects for dimensionality */
--p-shadow-bevel-100: inset 0px 1px 0px rgba(255, 255, 255, 0.15);
```

#### Lighting Effects
Reinforces interactivity and guides attention:

- **Pressed Down**: Decrease brightness when element moves down in Z-index
- **Elevated Up**: Increase brightness when element moves up in Z-index
- **Consistent Light Source**: Maintain uniform lighting direction

#### Layering System
Organize elements with clear Z-index hierarchy:

```css
/* Z-index scale */
.menu-background { z-index: -1; }
.page-background { z-index: 0; }
.card-surface { z-index: 1; }
.dropdown-menu { z-index: 2; }
.modal-overlay { z-index: 100; }
.tooltip { z-index: 200; }
```

## Shadow Token System

### Primitive Shadow Tokens

#### Elevation Tokens
Simulate shadows cast on surfaces below:
- `shadow-100` to `shadow-600` in increments of 100
- Base value starts at 100
- Used for cards, dropdowns, modals

#### Inset Tokens  
Create embedded element appearance:
- `shadow-inset-100` to `shadow-inset-200`
- Used for pressed button states
- Creates depth within elements

#### Bevel Tokens
Add dimensional appearance:
- `shadow-bevel-100`
- Enhances perceived shape and structure
- Combined with elevation for enhanced effect

### Component-Specific Tokens

#### Button Shadows
Specialized tokens for tactile button appearance:

```css
/* Button variants */
--p-shadow-button: var(--p-shadow-100);
--p-shadow-button-primary-critical: var(--p-shadow-200);
--p-shadow-button-inset: var(--p-shadow-inset-100);
--p-shadow-button-primary-critical-inset: var(--p-shadow-inset-200);
```

### Token Pairing
Combine bevel with elevation for enhanced distinction:

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

## Component Shadow Reference

| Component | Shadow Tokens |
|-----------|---------------|
| Card, Data table, Resource list | `--p-shadow-100`, `--p-shadow-bevel-100` |
| Banner, Callout card | `--p-shadow-200`, `--p-shadow-bevel-100` |
| Popover, Tooltip, Date picker | `--p-shadow-300`, `--p-shadow-bevel-100` |
| Toast | `--p-shadow-400`, `--p-shadow-bevel-100` |
| Modal | `--p-shadow-600`, `--p-shadow-bevel-100` |
| Search overlay | `--p-shadow-600` |

## Surface Depth Techniques

### Container Backgrounds
Use background colors to create depth perception:

```css
/* Receding background - de-emphasizes content */
.container-receded {
  background: var(--p-color-bg-surface-secondary);
}

/* Elevated surface - emphasizes content */
.container-elevated {
  background: var(--p-color-bg-surface);
  box-shadow: var(--p-shadow-100);
}
```

### Visual Boundaries
Create indentation or elevation suggestions:
- Use consistent border radius for cohesive depth
- Avoid unique surface styles that create noise
- Maintain clear parent-child relationships

## Implementation Guidelines

### ✅ Do's
- Use depth tactically to differentiate primary/secondary elements
- Apply intuitive depth changes on interaction (push buttons down)
- Use consistent shadow styles across similar elements
- Indicate interactive elements with appropriate depth
- Keep most elements on the same layer for visual baseline
- Use gray backgrounds to de-emphasize contained information

### ❌ Don'ts  
- Don't overuse depth - it creates cluttered interfaces
- Don't add unnecessary depth to static elements
- Don't let elements protrude outside parent containers
- Don't apply unexpected depth changes on interaction
- Don't use too many layers in one screen
- Don't use bright colors for container backgrounds
- Don't use unique surface styles like inset shadows
- Don't rely solely on depth for focus (accessibility)

### ⚠️ Cautions
- Subtle hints of third dimension acceptable for conceptual clarity
- Not all merchants perceive depth the same way
- Use combination of techniques for accessibility
- Resort to layering only when other emphasis techniques insufficient

## Interaction States

### Button Press Feedback
```css
.button {
  box-shadow: var(--p-shadow-button);
  transition: box-shadow 0.1s ease;
  
  &:active {
    box-shadow: var(--p-shadow-button-inset);
    transform: translateY(1px);
  }
}
```

### Hover States
```css
.interactive-card {
  box-shadow: var(--p-shadow-100);
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: var(--p-shadow-200);
  }
}
```

### Focus Indicators
```css
.focusable-element:focus {
  outline: 2px solid var(--p-color-border-focus);
  outline-offset: 2px;
  box-shadow: var(--p-shadow-200);
}
```

---

*Next: [Icons →](./05-icons.md)*
