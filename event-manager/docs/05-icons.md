# Icons

> *"Icons enhance an experience by providing intuitive and efficient navigation, conveying information concisely, and making it more visually appealing."*

## Design Principles

### 1. 🎯 Clear
**Simple and effectively convey intended meaning**
- Avoid unnecessary complexity
- Make icons easy to recognize
- Communicate quickly and clearly
- Use basic geometric shapes

### 2. 🔄 Consistent  
**Cohesive visual style across the interface**
- Consistent line weights, shapes, dimensions
- Unified perspective and general style
- Reuse visual elements across icon set
- Enable quick recognition and navigation

### 3. 🌍 Universal
**Recognized by broad user base**
- Use universally recognized symbols
- Leverage established metaphors
- Avoid cultural-specific references
- Create inclusive design experiences

## Icon Specifications

### Grid and Keylines
**Container**: 20 × 20 px
**Safe Area**: 16 × 16 px (content must stay within)
**Optical Adjustment**: Allowed for visual balance

#### Shape Guidelines
- **Square objects**: 13 × 13 px
- **Circular objects**: 14 × 14 px diameter  
- **Rectangular objects**: 14 × 12 px
- **Optical centering**: Adjust positioning as needed

### Design Standards

#### Stroke Properties
- **Weight**: 1.5px default
- **Terminals**: Round endings
- **Corners**: 1px to 3px radius (rounded joints required)
- **Minimum Gap**: 1px between strokes
- **Grid Alignment**: Half-pixel strokes aligned to pixel grid

#### Style Requirements
- **Dimension**: Two-dimensional, objects face forward
- **Perspective**: No 3D or perspective views
- **Colors**: Single color only, no transparency
- **Details**: Simple geometric shapes, avoid organic forms

## Icon Styles

### Outlined Icons (Default)
**Primary style used throughout admin**

#### Specifications:
- Stroke weight: 1.5px
- Round terminals and joints
- Corner radius: 1px to 3px
- No sharp corners except intersections
- Filled shapes only for tiny details (exclamation dots)

```css
/* Icon styling */
.icon {
  width: 20px;
  height: 20px;
  stroke-width: 1.5px;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  stroke: currentColor;
}
```

### Filled Icons (Limited Use)
**Reserved for navigation and semi-permanent states**

#### Usage Guidelines:
- **Main Navigation**: Only use filled icons in primary nav
- **Selected States**: Semi-permanent selections like pinned apps
- **Not for Emphasis**: Don't use to create visual emphasis

#### Specifications:
- Align closely to outline pairs
- Made of contiguous shapes (1-3 shapes max)
- Stroke weight: 1.5px (1.25px for cutouts)
- 2px stroke alternative when fill not possible

## Usage Patterns

### Streamlining Interface

#### Common Actions
Use established icons for universal actions:
- ✏️ **Edit**: Pencil icon
- 🗑️ **Delete**: Trash/delete icon  
- 🔍 **Search**: Magnifying glass
- 📋 **Copy**: Clipboard icon
- 📤 **Export**: Upload/export arrow
- 📥 **Import**: Download/import arrow

#### Common Objects
Consistent pairing with interface elements:
- 📧 **Orders**: Inbox icon
- 👤 **Customers**: Person icon  
- 📦 **Products**: Package icon
- 📊 **Analytics**: Chart icon
- ⚙️ **Settings**: Gear icon

### Icon Sizing and Alignment

#### Typography Pairing
```css
.icon-with-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
```

#### Vertical Alignment
- Align icons vertically with accompanying typography
- Don't resize icons - maintains relationship with typography
- Use consistent spacing between icon and text

## Implementation Guidelines

### ✅ Do's
- Draw simple objects that are easy to identify
- Reuse parts of other icons for visual harmony
- Use universally recognized symbols
- Use icons to replace text for common actions
- Align icons vertically with typography
- Center icons in their containers
- Use consistent visual style and stroke weight
- Leverage established metaphors for new icons

### ❌ Don'ts
- Don't embellish with unnecessary details
- Don't reinterpret universally recognized icons
- Don't use ambiguous icons without text labels
- Don't resize icons (breaks typography relationship)
- Don't use perspective or 3D representations
- Don't use transparency effects
- Don't use multiple colors
- Don't rely on cultural-specific metaphors

### ⚠️ Cautions
- Subtle 3D hints acceptable for conceptual clarity
- Avoid excessive details or organic shapes
- Don't overuse icons - leads to visual clutter
- Optical adjustments allowed for visual balance

## Icon Categories

### Navigation Icons
- Home, Menu, Back, Forward
- Used in primary navigation
- Often use filled versions when active

### Action Icons  
- Edit, Delete, Copy, Share, Export
- Represent user actions
- Typically use outlined style

### Status Icons
- Success checkmark, Warning triangle, Error X
- Communicate system states
- Often paired with color roles

### Object Icons
- File types, product categories, user roles
- Represent content or entities
- Help with quick content identification

### Utility Icons
- Search, Filter, Sort, Settings
- Interface functionality
- Should be instantly recognizable

## Accessibility Considerations

### Screen Readers
```html
<!-- Decorative icons -->
<icon aria-hidden="true" />

<!-- Functional icons -->
<icon aria-label="Edit product" />

<!-- Icons with text -->
<button>
  <icon aria-hidden="true" />
  Edit
</button>
```

### Color Independence
- Don't rely solely on color for meaning
- Ensure icons work in high contrast mode
- Provide text alternatives when needed
- Test with colorblind users

### Touch Targets
- Minimum 44px touch target for mobile
- Adequate spacing between interactive icons
- Clear visual boundaries for clickable areas

---

*Next: [Layout System →](./06-layout-system.md)*
