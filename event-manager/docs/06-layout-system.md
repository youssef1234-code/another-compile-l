# Layout System

> *"Layout determines the placement, positioning, and organization of various components within the UI."*

## Core Principles

### 1. 📍 Space Defines Proximity
**The closer objects are, the stronger their perceived relationship**
- Group similar items together for faster decision-making
- Use whitespace to separate different concepts
- Create clear visual relationships through spacing

### 2. 📊 Emphasis Creates Hierarchy  
**Size, weight, and contrast establish importance**
- Larger, heavier elements attract attention
- Contrasting elements create visual rhythm
- Smaller, lighter elements provide detailed information

### 3. 🛠️ Software, Not Website
**Elements sized based on function and importance**
- Compact elements for specialized tasks
- Larger elements for primary actions
- Surfaces adapt to provide optimized views

## Building Layouts

### Surface Hierarchy

#### Background
- **Purpose**: Baseline for all UI elements
- **Usage**: Admin background, never stacked
- **Relationship**: Only other elements can sit on top

#### Surface  
- **Purpose**: Container for prominent elements
- **Examples**: Cards, modals, popovers, banners
- **Capability**: Can contain multiple other elements
- **Most versatile**: Works in many contexts

#### Shaped Elements
- **Purpose**: Smaller functional components  
- **Examples**: Buttons, badges, form controls
- **Characteristics**: Single purpose, often interactive
- **Sizing**: Varies based on content and context

### Dividing Surfaces

#### Nested Surfaces
Group related elements within larger containers:

```css
.card {
  background: var(--p-color-bg-surface);
  border-radius: 12px;
  
  .nested-section {
    background: var(--p-color-bg-surface-secondary);
    border-radius: 8px; /* Reduced radius for nesting */
    margin: 16px;
  }
}
```

#### Divider Lines
**Reserved for data and index tables only**
- Enhance visual structure in information-heavy layouts
- Separate rows of data for easier scanning
- Not for general content separation

#### Grid Patterns
For complex selection interfaces:
- Use different surface colors instead of lines
- Create clear visual zones
- Support selection and comparison tasks

## Spacing System

### Spatial Organization

#### Proximity Grouping
```css
/* Related items close together */
.related-group {
  gap: 8px; /* Tight spacing */
}

/* Separate concepts */
.section-separator {
  margin-bottom: 24px; /* Larger gaps */
}
```

#### Visual Hierarchy Spacing
```css
/* Primary to secondary relationship */
.title-to-subtitle { margin-bottom: 4px; }

/* Section to content relationship */  
.section-to-content { margin-bottom: 16px; }

/* Major section separation */
.major-sections { margin-bottom: 32px; }
```

### Nesting Guidelines

#### Border Radius Reduction
```css
.parent-surface {
  border-radius: 12px;
  
  .nested-surface {
    border-radius: 8px; /* Reduced for nesting effect */
  }
  
  .deeply-nested {
    border-radius: 4px; /* Further reduced */
  }
}
```

#### Table Nesting
```css
.nested-table {
  /* Adjust padding for more data space */
  .table-cell {
    padding: 8px 12px; /* Reduced horizontal padding */
  }
}
```

## Density Patterns

### High Density
**For information-rich interfaces**

#### Use Cases:
- Index pages and data tables
- Option lists and popovers  
- Search results and filters
- Dashboard metrics
- Action menus

#### Implementation:
```css
.high-density-row {
  padding: 8px 12px;
  border-bottom: 1px solid var(--p-color-border-secondary);
  
  &:hover {
    background: var(--p-color-bg-surface-hover);
  }
}
```

#### Visual Techniques:
- Divider lines for clear delineation
- Different surface colors for hierarchy
- Compact typography and spacing
- Efficient use of vertical space

### Low Density  
**For focused editing interfaces**

#### Use Cases:
- Product detail pages
- Settings and configuration
- Form completion flows
- Content creation interfaces

#### Implementation:
```css
.low-density-section {
  padding: 24px;
  margin-bottom: 24px;
  
  .form-field {
    margin-bottom: 20px;
  }
}
```

#### Characteristics:
- Larger hit targets for interaction
- More descriptive button labels
- Top-to-bottom visual rhythm
- Context switching between cards

## Component Sizing

### Button Sizing
Context-dependent sizing for optimal balance:

```css
/* Default button */
.button-default {
  padding: 6px 12px;
  min-height: 36px;
}

/* Large button for primary actions */
.button-large {
  padding: 10px 16px; 
  min-height: 44px;
}

/* Compact button for tables */
.button-compact {
  padding: 4px 8px;
  min-height: 28px;
}
```

### Form Element Alignment
```css
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .input {
    min-height: 36px; /* Match button height */
  }
  
  .button {
    min-height: 36px; /* Consistent alignment */
  }
}
```

## Layout Patterns

### Card-Based Layouts
For context switching and organization:

```css
.card-layout {
  display: grid;
  gap: 20px;
  
  .card {
    background: var(--p-color-bg-surface);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--p-shadow-100);
  }
}
```

### Table-Based Layouts  
For data presentation and comparison:

```css
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th, td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--p-color-border);
    text-align: left;
  }
  
  tbody tr:hover {
    background: var(--p-color-bg-surface-hover);
  }
}
```

### Grid Layouts
For selection and comparison interfaces:

```css
.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  
  .option-card {
    padding: 16px;
    border: 2px solid var(--p-color-border);
    border-radius: 8px;
    cursor: pointer;
    
    &:hover {
      border-color: var(--p-color-border-hover);
    }
    
    &.selected {
      border-color: var(--p-color-border-brand);
      background: var(--p-color-bg-surface-brand);
    }
  }
}
```

## Implementation Guidelines

### ✅ Do's
- Group similar data points in the same card
- Nest inset shapes and surfaces appropriately
- Use size, weight, and contrast for hierarchy
- Create compact components for specialized tasks
- Adjust padding in nested tables for optimal space
- Use consistent button sizing within context
- Reduce border radius for nested elements
- Apply high density for data-rich interfaces

### ❌ Don'ts
- Don't use divider lines outside data/index tables
- Don't contradict task importance with inappropriate sizing
- Don't break symmetry when grouping surfaces
- Don't mix low-density info with high-density components
- Don't nest tables unnecessarily if they're the only content
- Don't make nested elements have larger border radius than parents
- Don't use vertical dividers for unrelated content columns

### ⚠️ Cautions
- Breaking alignment may be required for visual balance
- Use imaginary keylines for neat container alignment
- Different alignment should apply to separate containers only
- Building data tables with nested surfaces can feel inefficient

## Responsive Considerations

### Mobile Adaptations
```css
@media (max-width: 768px) {
  .card-layout {
    gap: 16px; /* Reduced spacing */
  }
  
  .card {
    padding: 16px; /* Reduced padding */
    border-radius: 8px; /* Smaller radius */
  }
  
  .high-density-row {
    padding: 12px 16px; /* Increased touch targets */
  }
}
```

### Breakpoint Strategy
- **Mobile**: Single column, larger touch targets
- **Tablet**: Two-column grids, medium density
- **Desktop**: Multi-column, high density options
- **Large screens**: Maximum content width, optimal spacing

---

*Next: [Design Tokens →](./07-design-tokens.md)*
