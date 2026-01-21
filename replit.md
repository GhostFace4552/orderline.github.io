# Orderline Personal - PWA Task Manager

## Overview

Orderline Personal is a Progressive Web Application (PWA) designed as an ADHD-friendly personal task scheduler and to-do list. The application enforces strict task limits to prevent overwhelm: maximum 3 active tasks, maximum 3 hold tasks, with unlimited backlog. It features a clean, mobile-first interface with local data persistence and optional lightweight authentication for multi-device synchronization.

The application is built as a full-stack web app with React frontend, Express backend, and PostgreSQL database support, though it primarily operates using local browser storage for standalone functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: React hooks with custom local storage integration
- **Data Fetching**: TanStack Query for server state management (though primarily using local storage)
- **PWA Features**: Service worker for offline functionality and app-like experience

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Development**: Hot reload with Vite integration in development mode
- **Database Integration**: Drizzle ORM configured for PostgreSQL
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development
- **API Design**: RESTful API structure with `/api` prefix routing

### Data Storage Solutions
- **Primary**: Browser LocalStorage for task persistence (offline-first approach)
- **Data Protection**: Multi-layered data safety system with versioning, automatic backups, and corruption detection
- **Migration System**: Automatic data format migration ensures compatibility across updates
- **Backup Strategy**: Automatic local backups before every change, manual export/import capability
- **Recovery Mechanisms**: Emergency data recovery, integrity validation, and cross-tab synchronization
- **Secondary**: PostgreSQL database via Neon serverless for optional multi-device sync
- **Schema**: User authentication table with extensible design for task data
- **ORM**: Drizzle ORM with Zod validation for type-safe database operations

### Authentication and Authorization
- **Lightweight System**: Optional username/password authentication for multi-device use
- **Session Management**: Express sessions with PostgreSQL session store
- **Local-First**: Primary usage doesn't require authentication, stored locally

### Task Management Logic
- **Business Rules**: Enforced task limits (3 active, 3 hold, unlimited backlog)
- **Task States**: Active, Hold, Completed, Backlog with automatic state transitions
- **Scheduling**: Date-based task scheduling with automatic activation
- **Repeating Tasks**: Support for Daily, Weekly, Monthly recurring tasks
- **Completion Tracking**: Daily completion statistics and history

### PWA Implementation
- **Manifest**: Comprehensive web app manifest with shortcuts and screenshots
- **Service Worker**: Caching strategy for offline functionality
- **Icons**: Multiple icon sizes for various device contexts
- **Mobile Optimization**: Touch-friendly interface with floating action button

## External Dependencies

### Core Frontend Libraries
- **React Ecosystem**: React 18, React DOM, React Hook Form with Zod validation
- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React icon library
- **Date Handling**: date-fns for date manipulation and formatting

### Backend Dependencies
- **Database**: Neon Database (serverless PostgreSQL) via @neondatabase/serverless
- **ORM**: Drizzle ORM with PostgreSQL dialect and Zod integration
- **Session Storage**: connect-pg-simple for PostgreSQL session management
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build System**: Vite with React plugin and Replit-specific plugins
- **TypeScript**: Full TypeScript support with strict configuration
- **Database Migrations**: Drizzle Kit for schema migrations and database management
- **Code Quality**: ESLint configuration for code standards

### PWA and Performance
- **Service Worker**: Custom caching implementation for offline support
- **Font Loading**: Google Fonts (Inter) with preconnect optimization
- **Bundle Optimization**: Vite's built-in code splitting and tree shaking
- **Mobile Performance**: Viewport meta tags and touch optimization