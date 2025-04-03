# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands
- Root: `npm start` (backend), `npm run dev` (both frontend and backend)
- Frontend: `cd frontend && npm start` (dev server), `npm run build` (production)
- Frontend Tests: `cd frontend && npm test`
- Backend: `cd backend && npm start` (Node), `npm run dev` (Nodemon)

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

Always match existing patterns when modifying files and ensure PDF generation utilities in pdfUtils.js follow established conventions.