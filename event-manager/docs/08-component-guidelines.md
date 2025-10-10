# Component Guidelines

This guide shows how to apply Polaris design principles to create consistent, professional components for your application.

## Using Polaris Components Directly

### Installation
```bash
npm install @shopify/polaris
```

### Basic Usage
Import components and tokens from the Polaris React library to maintain consistency with Shopify's design system.

## Applying Polaris Principles to Custom Components

### Pro Design Language Application

#### Assign Meaning
- Use color to support different states merchants need to be informed about
- Leverage established symbols to identify key functionality
- Create clear and predictable experiences through consistent visual language

#### Increase Density
- Space is optimized while maintaining high usability
- Adapt density to the task: high density for data-rich environments, low density for focused areas
- Structure information in clear visual hierarchy through size, weight, and color

#### Craft Juicy Interactions
- Provide dramatic visual response to primary interaction points
- Use smooth hover transitions and visceral click feedback
- Create seamless transitions that help with intuitive navigation
- Add detailed animations that reference real-world object interactions

#### Make it Predictable
- Ensure elements with similar appearance share common behavior
- Use consistent signifiers throughout the user experience
- Apply consistent visual treatment to elements with the same function

### Color Application in Components

#### Color Has Purpose
- Each color usage must be purposefully tied to specific meaning
- Red = critical errors, Green = success, Blue = tips and offers
- Don't use color for decoration - reserve it for clear communication

#### Color Has Impact
- Use the monochromatic interface design to make colored elements stand out
- Apply strong, vivid colors to grab attention for important matters
- Create strategic positioning for maximum visual impact

#### Color Is Accessible
- Always combine color with other discernible elements (icons, text)
- Never use color alone to convey meaning
- Ensure sufficient contrast ratios for all text and interactive elements

### Depth and Hierarchy

#### Creating Visual Hierarchy
- Use depth tactically to differentiate between primary and secondary elements
- Apply intuitive depth changes on interaction (buttons press down)
- Keep most elements on the same layer for visual baseline

#### Indicating Interactivity
- Give interactive elements appropriate depth to signal they can be interacted with
- Avoid giving static elements unnecessary depth that misleads users
- Use consistent shadow styles across similar elements

### Icon Integration

#### Streamlining Interface
- Use icons to replace text for common actions with universally understood meanings
- Pair specific icons consistently with objects for quick recognition
- Align icons vertically with accompanying typography

#### Icon Design Standards
- Follow 20×20px container with 16×16px safe area
- Use 1.5px stroke weight with round terminals
- Maintain two-dimensional representation facing forward
- Keep designs simple and avoid unnecessary complexity

### Layout and Spacing

#### Space Defines Proximity
- Group similar items together for faster decision-making
- Use whitespace to separate different concepts
- Create clear visual relationships through spacing

#### Building with Surfaces
- Use cards, modals, and popovers as surfaces that contain other elements
- Divide surfaces using nested elements rather than divider lines (except in data tables)
- Reduce border radius of nested surfaces to create proper nesting effect

#### Density Patterns
- Apply high density for information-rich interfaces like index pages and data tables
- Use low density for focused editing interfaces like product detail pages
- Size elements appropriately based on their function and importance

## Component Examples from Raw Document

### Button Components
Components such as buttons require component-specific shadows to visually exhibit their unique tactility. Different button variants should use appropriate shadow tokens for their specific styling needs.

### Card Components
Cards serve as surfaces that contain other elements and should use appropriate shadow tokens like `--p-shadow-100` and `--p-shadow-bevel-100` for proper elevation and depth.

### Form Components
Input elements should use the input color role to ensure WCAG compliance and uniform appearance across forms. The input color role should only be used on form elements.

### Navigation Components
Navigation elements should use the nav color role, which is specifically reserved for the Shopify admin menu and all levels of navigation.

## Implementation Best Practices

### Do's
- Use established Polaris components when possible for consistency
- Apply color roles appropriately for their intended purposes
- Create compact components for specialized, minute tasks
- Group similar data points or tasks in the same card
- Use appropriate shadow tokens for component types
- Nest surfaces properly with reduced border radius
- Apply high density consistently for action components

### Don'ts
- Don't use color to decorate or distract from tasks
- Don't use specialized color roles outside their intended context
- Don't contradict task importance with inappropriate sizing
- Don't use divider lines outside of data/index tables
- Don't break established interaction patterns
- Don't resize icons as it breaks typography relationships
- Don't overuse depth as it creates cluttered interfaces

### Accessibility Considerations
- Ensure sufficient color contrast for all elements
- Provide text alternatives for icons when needed
- Don't rely solely on color to convey meaning
- Test with screen readers and keyboard navigation
- Follow WCAG guidelines for interactive element sizing

---

*Next: [Best Practices →](./09-best-practices.md)*
