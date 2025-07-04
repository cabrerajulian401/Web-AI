# AI Article Display Application

## Overview

This is a full-stack web application built with Express.js and React that displays AI-related articles with rich metadata including executive summaries, timelines, related articles, raw facts, and multiple perspectives. The application follows a modern architecture with a clear separation between frontend and backend concerns.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for development and production
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom shadcn/ui styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based session storage
- **Development**: Hot reload with Vite integration

### Project Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express application
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migrations
└── dist/           # Production build output
```

## Key Components

### Database Schema
The application uses a relational database with the following main entities:
- **Articles**: Core article content with metadata
- **Executive Summary**: Key points for each article
- **Timeline Items**: Chronological events related to the article
- **Related Articles**: Links to relevant external content
- **Raw Facts**: Categorized factual information
- **Perspectives**: Different viewpoints on the topic

### API Structure
- **GET /api/article/:slug**: Retrieves complete article data including all related entities
- RESTful design with proper error handling and logging

### UI Components
- **Expandable Sections**: For organizing content like raw facts and perspectives
- **Timeline**: Visual representation of chronological events
- **Related Articles**: Grid layout of related content
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Data Flow

1. **Request Flow**: Client requests article by slug → Express server → Database query via Drizzle ORM
2. **Response Flow**: Database → Server aggregates all related data → JSON response to client
3. **State Management**: TanStack Query handles caching, loading states, and error handling
4. **Rendering**: React components render the structured data with shadcn/ui components

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for production
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Connection**: Environment-based DATABASE_URL configuration

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for UI elements

### Development Tools
- **Vite**: Fast build tool with HMR
- **ESBuild**: Production bundling for server code
- **TypeScript**: Type safety across the entire stack

## Deployment Strategy

### Development
- **Server**: `npm run dev` - Uses tsx for TypeScript execution with hot reload
- **Client**: Vite dev server with HMR integrated into Express
- **Database**: `npm run db:push` - Pushes schema changes to database

### Production
- **Build**: `npm run build` - Vite builds client, ESBuild bundles server
- **Start**: `npm start` - Runs production server from dist directory
- **Static Files**: Express serves built React app from dist/public

### Environment Configuration
- **DATABASE_URL**: Required for database connection
- **NODE_ENV**: Controls development vs production behavior
- **Session Storage**: PostgreSQL-based session management

## Changelog

Changelog:
- July 04, 2025. Initial setup
- July 04, 2025. Added main feed page with article grid layout, TIMIO News branding, and navigation between feed and article pages
- July 04, 2025. Added sidebar with "As seen on PBS and Automateed" promotional image, changed all category tags to "News", updated main heading to "Today's Stories"
- July 04, 2025. Fixed sidebar image loading issue by properly copying image to public directory and updating paths
- July 04, 2025. Added "Learn More" button in sidebar linking to timio.news, implemented dummy placeholder data for timeline and related articles sections

## User Preferences

Preferred communication style: Simple, everyday language.