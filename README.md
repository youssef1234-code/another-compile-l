# 🎓 Event Management System - GUC

Enterprise-grade event management platform for the German University in Cairo (GUC). Built with modern technologies and clean architecture principles.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Features](#features)
- [Architecture](#architecture)
- [Development](#development)

## 🌟 Overview

A comprehensive event management system that handles:
- Event creation and management (Workshops, Trips, Bazaars, Conferences, Gym Sessions)
- User authentication and authorization with role-based access control
- Event registration and payment processing (Stripe integration)
- Vendor management and booth/bazaar participation
- Rating and feedback system
- Loyalty program and more

## 🚀 Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **TailwindCSS v4** + **shadcn/ui**
- **Zustand** (Global State) + **TanStack Query** (Server State)
- **tRPC** (Type-safe APIs)
- **React Router v7** + **Framer Motion**

### Backend
- **Node.js** + **Express** + **TypeScript**
- **tRPC** + **Zod** validation
- **MongoDB** + **Mongoose**
- **JWT** authentication
- **Nodemailer** + **Stripe**

## 📁 Project Structure

```
Another-Compile-L/
├── backend/                 # Backend API (Express + tRPC)
├── event-manager/          # Frontend (React + Vite)
├── .vscode/tasks.json      # VS Code tasks for dev
└── requirements.csv        # Project requirements
```

## 🎯 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

### Quick Start

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd Another-Compile-L
   ```

2. **Install dependencies**
   - Use VS Code Task: "Install All Dependencies"
   - Or manually: `cd backend && npm install` then `cd event-manager && npm install`

3. **Configure environment**
   - Backend: Copy `backend/.env.example` to `backend/.env` and configure
   - Frontend: Copy `event-manager/.env.example` to `event-manager/.env`

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Start the application**
   - **VS Code Task (Recommended)**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Full Stack"
   - **Manual**: Run `npm run dev` in both `backend/` and `event-manager/` directories

6. **Access**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## ✨ Features

### Sprint 1 ✅
- Authentication & Authorization (all roles)
- Email verification
- Admin user management
- Clean architecture setup
- tRPC integration
- Modern UI with dark mode
- Protected routes

### Sprint 2+ (See requirements.csv)
- Event CRUD
- Registration & payments
- Ratings & comments
- Vendor participation
- Loyalty program
- Reports & analytics

## 🏛️ Architecture

### Type Safety
- Shared types between FE & BE via tRPC
- Zod schemas for validation
- Full end-to-end type safety

### State Management
- **Zustand**: Auth, UI preferences
- **TanStack Query**: Server state, caching

### Backend Layers
- Models → Routers → Utils → Config
- Clean, documented code
- Enterprise-ready structure

## 📚 Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./event-manager/README.md)
- [Requirements](./requirements.csv)

## 🤝 Contributing

1. Create feature branch
2. Follow code style
3. Document changes
4. Submit PR

---

**Built with ❤️ for GUC - Advanced Computer Lab 2025**
