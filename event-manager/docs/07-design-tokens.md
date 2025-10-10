# Design Tokens

> *"Tokens are a method of applying color in a consistent and meaningful way across the admin."*

Design tokens provide a layer of abstraction from raw values, making it easy to implement large-scale changes and maintain consistency across your application.

## Color Tokens

### Semantic Token Structure

Semantic tokens help communicate the intent of a given color and create predictable behavior across our tokens. They start with declaring the token group color, followed by the element it's applied to, such as a bg, border, text, or icon.

Following the element, semantic tokens may have one or more modifiers to further represent color application: color role, prominence, and state.

**Element**: The UI element being styled: bg, bg-surface, bg-fill, text, border, and icon.

**Role**: Assigns roles to specific colors for consistent application.

**Prominence**: Communicates what the token is used for.

**State**: Communicates the state of a UI element.

### Specialty Tokens

Some concepts have their own specific color tokens, known as specialty tokens. Specialty tokens start with declaring the concept and any associated variants, followed by the semantic token structure. These tokens should never be used for anything other than the concept they're referencing.

### Interaction States

Interaction states are communicated by adding -hover, -active, -selected, or -disabled to the end of the semantic token.

#### Hover
Hover state tokens provide visual feedback to merchants when they hover their cursor over an interactive element, like a button or link.

#### Active
Active state tokens communicate when an interactive element is pressed (by a cursor or finger).

#### Focus
Focus states are triggered by the merchant and highlight elements when using a keyboard to navigate the UI.

Focus states usually take on the element's hover state and add a blue outline using the border-focus token.

#### Selected
Selected state tokens communicate an item or option has been chosen. They can be applied to elements like buttons, tabs, checkboxes, radio buttons, or navigation items.

#### Disabled
Disabled state tokens indicate when the user isn't allowed to interact with an element. They remove all interactivity from a component.

Disabled elements don't need to meet WC3 contrast standards and are intentionally de-emphasized to clearly communicate their state.

## Shadow Tokens

### Primitive Shadow Tokens

The primitive shadow tokens scale offers a versatile range of shadows that can be applied to components, providing a fundamental foundation for creating visual cues of depth in the UI. These tokens are categorized into three sets:

#### Token Scales
- **Elevation tokens**: These tokens visually represent a shadow being cast on a surface below the element, effectively simulating a sense of elevation.
- **Inset tokens**: Demonstrate an inner shadow creating the impression of an embedded element.
- **Bevel tokens**: provide a dimensional appearance to an element, enhancing its perceived shape and structure.

#### Token Structure
Each of these sets is declared with the shadow token group name. In addition, the scales offer comprehensive ranges in increments of 100, and the base value is set at 100.

### Component Specific Tokens
Components such as buttons require component-specific shadows to visually exhibit their unique tactility. To achieve this button styling, component-specific shadow tokens are assigned to each variant of the button.

### Token Pairing
When combining the bevel token with elevation tokens, builders can achieve a desired visual distinction that is necessary to create contrast between an elevated surface and its background. The bevel token adds dimensionality to the element, while elevation tokens provide a drop shadow effect that creates the perception of distance. To implement this pairing, assign the bevel token as a pseudo class with absolute positioning and set the mix-blend-mode CSS property to luminosity to create the desired effect.

```css
position: relative;
box-shadow: $boxShadow;
border-radius: $borderRadius;
border: $border;

&::before {
content: $content;
position: absolute;
top: 0;
left: 0;
right: 0;
bottom: 0;
z-index: $zIndex;
box-shadow: var(--p-shadow-bevel-100);
border-radius: $borderRadius;
pointer-events: none;
mix-blend-mode: luminosity;
}
```

### Polaris Component Shadows

Components use specific shadow tokens. The following table can be a useful resource:

| Polaris Components | Shadow tokens |
|-------------------|---------------|
| Account connection, Card, Data table, Empty states, Fullscreen bar, Index table, Media card, Resource list, Setting toggle, Top bar | --p-shadow-100, --p-shadow-bevel-100 |
| Banner, Callout card | --p-shadow-200, --p-shadow-bevel-100 |
| Action list, Option list, Color picker, Date picker, Popover, Tooltip | --p-shadow-300, --p-shadow-bevel-100 |
| Toast | --p-shadow-400, --p-shadow-bevel-100 |
| Modal | --p-shadow-600, --p-shadow-bevel-100 |
| Search | --p-shadow-600 |

## Space Tokens

### Using Space Tokens
Space tokens should be used whenever you need to apply space around or between elements within. You should apply space tokens to all space related css properties such as padding, margin and gap. They should not be used for non-space declarations such as height, width, outline-offset, etc. Always use the proper token group when using Polaris tokens.

### Primitive Tokens
Primitive tokens refer to generic tokens that can be applied to provide spacing around or between components. They give access to the full scale of values offered by Polaris for managing space within the interface.

Each is simply named by declaring the token group and then the percentage multiplier of our base value of 4px. Therefore, space-100 is equal to 4px while space-400 equals 16px.

### Semantic Tokens
Similar to color tokens, semantic space tokens provide spacing for specific and defined contexts within the admin. These tokens should only be used for that explicit purpose. When no semantic token seems to fit your need, use a primitive token instead.

Semantic tokens explicitly declare what css selector they should be applied to. For example, space-card-padding should only be used to set the padding within the Card component.

#### Guidelines:
- Always use semantic tokens over primitive ones when possible
- Only use semantic tokens for the type of space as specified

### How to Apply Tokens

#### Figma
Semantic and primitive space tokens can be accessed via the auto layout padding and gap inputs in the right panel.

#### Polaris React
Space tokens can be applied in two main ways in Polaris React. First, all of the layout components such as Box have access to the tokens via their prop api. Second, when writing your own css you can use the token directly via the css variables that come with the Polaris token package.

## Implementation

### Figma
Accessing Polaris color tokens is simple using Figma variables, found in the fill, stroke and text color library menus on the right panel.

### Polaris React
Color tokens are applied to components and are available via css variables to style custom UI elements within the Shopify admin.

---

*Next: [Component Guidelines →](./08-component-guidelines.md)*
