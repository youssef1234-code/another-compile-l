# Event Management System - Frontend

Modern, enterprise-grade React frontend built with Vite, TypeScript, TailwindCSS v4, tRPC, TanStack Query, and Zustand.

## 🏗️ Architecture

```
event-manager/
├── src/
│   ├── app/                 # Application setup
│   │   ├── App.tsx          # Main app component
│   │   ├── router.tsx       # React Router setup
│   │   └── providers.tsx    # Context providers
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── auth/            # Authentication components
│   │   └── shared/          # Shared components
│   ├── features/            # Feature modules
│   │   ├── auth/            # Authentication feature
│   │   ├── events/          # Events feature
│   │   ├── dashboard/       # Dashboard feature
│   │   └── admin/           # Admin feature
│   ├── lib/                 # Libraries and utilities
│   │   ├── trpc.ts          # tRPC client setup
│   │   ├── utils.ts         # Utility functions
│   │   └── constants.ts     # App constants
│   ├── store/               # Zustand stores
│   │   ├── authStore.ts     # Auth state
│   │   └── uiStore.ts       # UI state (theme, sidebar)
│   ├── styles/              # Global styles
│   │   ├── globals.css      # Global CSS
│   │   └── design-system.css # Design system tokens
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Shared types
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (Modern, Professional)
- **Secondary**: Slate (Neutral, Clean)
- **Accent**: Violet (Engaging, Vibrant)
- **Success**: Emerald
- **Warning**: Amber
- **Error**: Red
- **Info**: Blue

### Typography
- **Font Family**: Inter (Primary), System fonts fallback
- **Headings**: Bold, Tracking tight
- **Body**: Regular, Line height comfortable

### Design Principles
- **Minimal but not primitive**: Clean design with thoughtful details
- **Consistent**: Unified design language across all pages
- **Accessible**: WCAG 2.1 AA compliant
- **Responsive**: Mobile-first approach

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## 🔧 Technology Stack

- **React 19** + **TypeScript**
- **Vite**: Build tool
- **TailwindCSS v4**: Styling
- **Zustand**: Global state
- **TanStack Query**: Server state
- **tRPC**: Typesafe API
- **shadcn/ui**: UI components
- **Framer Motion**: Animations
- **React Router v7**: Routing

## 📋 Features

- Authentication & Authorization
- Event Management
- User Dashboard
- Admin Panel
- Dark/Light Mode
- Responsive Design

## 🔐 Authentication Flow

1. User signs up → Email verification sent
2. User verifies email → Account activated
3. User logs in → JWT token received
4. Protected routes enforce auth
5. Role-based access control

## 📝 Code Style

- Functional Components with Hooks
- TypeScript for type safety
- PascalCase for components
- camelCase for functions
- Clean, documented code

See backend README for API documentation.


- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
