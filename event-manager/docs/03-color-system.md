# Color System

> *"Color highlights important areas, communicates status, urgency, and directs attention."*

## Color Philosophy

### Three Core Principles

#### 1. 🎯 Color Has Purpose
**The purpose of using color must be clear.**
- Color supports messages or statuses that need to be easily identifiable
- Each color usage is purposefully tied to specific meaning
- Red = critical errors, Green = success, Blue = tips and offers
- Color as decoration is exclusive to illustration

#### 2. 💥 Color Has Impact  
**Black and white create a neutral backdrop for strategic color use.**
- The interface uses a monochromatic design intentionally
- Elements with color gain heightened visual impact
- Strategic positioning and careful selection grab attention
- Strong, vivid colors convey importance

#### 3. ♿ Color Is Accessible
**Colors are easily understood by all merchants.**
- Consistent color palettes for each role
- Proper contrast ratios for legibility
- Color combined with other discernible elements
- Never use color alone to convey meaning

## Global Palette

The Polaris color palette includes **12 colors**, each with **16 shades**, built using HSLuv Lightness values for perceptual uniformity.

### HSLuv Benefits
- More perceptually uniform color representation
- Consistent contrast ratios across same lightness values
- Predictable color transformations (lightening/darkening)
- Easy color role substitution

## Color Roles

### Primary Roles

#### Default
**Baseline theme for all experiences**
- Styles the entire Shopify admin
- Defines default, secondary, and tertiary visual hierarchy
- Used for neutral messaging and common merchant data

```css
/* Example usage */
--p-color-bg: #ffffff;
--p-color-bg-surface: #ffffff;
--p-color-text: #202223;
--p-color-text-secondary: #6d7175;
```

#### Brand  
**Guides merchants to primary actions**
- Pulls focus on main actions in the UI
- Used when many options are available
- Should be used sparingly to maintain effectiveness

```css
--p-color-bg-fill-brand: #008060;
--p-color-text-on-brand: #ffffff;
```

### Status Roles

#### Success ✅
**Confirms completed actions**
- Positive confirmation messages
- Statuses that don't require immediate action
- "Everything is OK" messaging

#### Info ℹ️
**Important but not urgent information**
- Tips, promotions, incentives
- Information that benefits the merchant
- Catch-all for attention-worthy content

#### Caution ⚠️
**Non-urgent attention needed**
- Incomplete or unstarted statuses
- Information before it becomes severe
- Stalled but not blocked states

#### Warning ⚠️
**Requires merchant intervention**
- In-progress, pending statuses
- Could require merchant action
- Strongest non-blocking color role

#### Critical 🚨
**Highest importance - immediate action needed**
- Impossible, blocked, or error states
- Must convey actionable messaging
- Reserved for true emergencies

### Specialized Roles

#### Magic ✨
**AI and automation technology**
- Sidekick icons and AI indicators
- Shopify Magic features
- Not for general "pop of color" use

#### Emphasis 🎯
**Active and selected states**
- Current selection in editors
- Focus areas within UI
- Interactive element highlighting

#### Transparent 👻
**Low visual affordance**
- Minimizes visual noise
- Secondary repeating elements
- Reduces interface clutter

#### Inverse 🔄
**Dark theme elements**
- Top bar and framing elements
- Used sparingly in admin
- Not for attention-grabbing

#### Input 📝
**Form elements only**
- Ensures WCAG compliance
- Uniform form appearance
- Should not be used outside forms

#### Nav 🧭
**Navigation menu only**
- Shopify admin menu specific
- All levels of navigation
- Not for other navigational elements

## Color Relationships

### Background
- Baseline for all UI elements
- Only other elements can sit on top
- Multiple backgrounds exist side-by-side only

### Surface  
- Background for prominent elements (cards, banners)
- Most versatile in the color system
- Can contain multiple other elements

### Fill
- Background for smaller elements (buttons, badges)
- Usually the most vibrant colors
- Comes with explicit on-fill text colors

### Border
- Primarily for data tables
- Enhances visual structure
- Separates and contains information

### Text
- Fully accessible contrast ratios
- Can be used on corresponding backgrounds
- On-fill text has strict color relationships

### Link
- Exclusively for text links in paragraphs
- Same contrast logic as text colors
- Can style text buttons appropriately

### Icon
- Standalone icons only
- Tailored for interactive elements without text
- Should use corresponding backgrounds

## Implementation Guidelines

### ✅ Do's
- Use color to support different states merchants need to know about
- Combine color with other discernible elements to amplify messages
- Use strong, vivid colors to grab attention for important matters
- Create meaningful combinations of color roles to enhance experience
- Use appropriate color roles for their intended purpose

### ❌ Don'ts
- Don't use color to decorate or distract from tasks
- Don't use color alone to convey meaning
- Don't contradict messaging with subdued colors
- Don't use multiple brand roles in the same area
- Don't use specialized roles outside their intended context

## Color Tokens Structure

### Semantic Token Pattern
```
color-[element]-[role]-[prominence]-[state]
```

**Examples:**
```css
--p-color-bg-surface-secondary
--p-color-text-brand-hover  
--p-color-border-critical-active
--p-color-icon-info-selected
```

### Interaction States
- **Hover**: Visual feedback for cursor interaction
- **Active**: Feedback when pressed
- **Focus**: Keyboard navigation highlight
- **Selected**: Chosen item indication  
- **Disabled**: Non-interactive state

## Accessibility Standards

### Contrast Requirements
- **AA Text**: 4.5:1 contrast ratio minimum
- **AA Interactive**: 3:1 contrast ratio minimum
- **AAA Text**: 7:1 contrast ratio (enhanced)

### Best Practices
- Always pair color with icons or text
- Test with color blindness simulators
- Ensure sufficient contrast in all states
- Provide alternative indicators beyond color
- Use semantic markup for screen readers

---

*Next: [Depth System →](./04-depth-system.md)*
