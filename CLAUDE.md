# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands
- Root: `npm start` (backend), `npm run dev` (both frontend and backend)
- Frontend: `cd frontend && npm start` (dev server), `npm run build` (production)
- Frontend Tests: `cd frontend && npm test`
- Backend: `cd backend && npm start` (Node), `npm run dev` (Nodemon)

## Database Structure
- PostgreSQL database with tables for users, equipment, categories, customers, orders, rentals, returns
- User permissions handled through user_customer_access and user_order_access tables
- Authentication using JWT tokens

## Code Style Guidelines
- Language: Czech for comments, variable names, and UI text
- Format: 2-space indentation, single quotes, semicolons required
- Naming: camelCase for variables/functions, PascalCase for React components
- Imports: React/framework first, third-party next, local modules last
- Components: Functional components with hooks, organized by feature
- State Management: Context API (see AuthContext.js)
- Backend: Express.js with PostgreSQL, Controller/Route/Model pattern
- Error Handling: try/catch with specific HTTP status codes on backend, context-based on frontend
- File Organization: Feature-based directory structure

## Project Structure
- Frontend: React.js with Bootstrap for UI components
- Backend: Node.js/Express.js API with PostgreSQL database
- Authentication: JWT token-based authentication with role-based access control
- File structure:
  - `/backend`: Server-side code (controllers, routes, models)
  - `/frontend`: Client-side code (components, pages, contexts)
  - `/database`: SQL scripts for database initialization

## API Integration
- Always use the axios instance from `frontend/src/axios-config.js` (not direct axios imports)
- All API endpoints must use the `/api` prefix in production environment
- Example: `/api/customers`, `/api/orders/:id/rentals`, etc.
- The axios configuration handles different baseURL settings for development vs. production

## Error Handling Best Practices
- Add null checks with optional chaining (`?.`) before filter/map/reduce operations
- Provide fallback values (`|| []`) for potentially undefined arrays
- Example: `const filtered = items?.filter(item => item.active) || []`
- Use try/catch blocks for all async operations with proper error logging

## Deployment
- Application is deployed on Heroku at https://pujcovna-stavebnin.herokuapp.com
- Database is hosted on Heroku PostgreSQL
- Use `migrate-database.sh` script for database migrations between environments

Always match existing patterns when modifying files and ensure PDF generation utilities in pdfUtils.js follow established conventions.

## User Management
- Role-based access control: 'admin' or 'user' roles
- Admins have full access to all features
- Regular users have access only to assigned customers and orders
- Access levels: 'read', 'write', 'admin'