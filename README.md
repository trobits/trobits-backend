# Trobits Backend Documentation

## Overview

This project is a backend application built with Node.js and TypeScript, utilizing the Prisma ORM for database management. It is organized into modular components, each responsible for a specific feature or concern. The project follows best practices for structure, error handling, and scalability.

---

## Project Structure

```
.
├── .env                   # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies and scripts
├── package-lock.json      # Dependency lock file
├── prisma/                # Prisma schema and migrations
│   └── schema.prisma      # Database schema definition
├── src/                   # Main source code
│   ├── app.ts             # Application entry point
│   ├── server.ts          # Server bootstrap
│   ├── config/            # Configuration logic
│   │   └── index.ts
│   ├── constants/         # Project-wide constants
│   │   └── pagination.ts
│   ├── errors/            # Error handling utilities
│   │   ├── ApiErrors.ts
│   │   ├── handleClientError.ts
│   │   ├── handleValidationError.ts
│   │   ├── handleZodError.ts
│   │   └── parsePrismaValidationError.ts
│   ├── helpars/           # Helper utilities (email, JWT, file, etc.)
│   │   ├── emailSender.ts
│   │   ├── fileUploader.ts
│   │   ├── jwtHelpers.ts
│   │   ├── paginationHelper.ts
│   │   └── socketIo.ts
│   ├── interfaces/        # TypeScript interfaces
│   │   ├── common.ts
│   │   ├── error.ts
│   │   ├── file.ts
│   │   ├── index.d.ts
│   │   └── paginations.ts
│   ├── shared/            # Shared utilities
│   │   ├── catchAsync.ts
│   │   ├── pick.ts
│   │   ├── prisma.ts
│   │   └── sendResponse.ts
│   ├── utils/             # Utility functions
│   │   ├── cloudinary.ts
│   │   ├── deletePreviousFile.ts
│   │   ├── getRandomCharsFromString.ts
│   │   ├── normalizeDate.ts
│   │   └── uploadFileOnDigitalOcean.ts
│   ├── app/               # Application logic
│   │   ├── middlewares/   # Express middlewares
│   │   │   ├── auth.ts
│   │   ���   ├── globalErrorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── modules/       # Feature modules
│   │   │   ├── Article/
│   │   │   ├── Comment/
│   │   │   ├── ContactUs/
│   │   │   ├── GameScore/
│   │   │   ├── Lunc/
│   │   │   ├── LuncBurn/
│   │   │   ├── Post/
│   │   │   ├── Shiba/
│   │   │   ├── ShibaBurn/
│   │   │   ├── Topic/
│   │   │   └── User/
│   │   └── routes/        # Route definitions
│   │       └── index.ts
├── uploads/               # Uploaded files
├── tsconfig.json          # TypeScript configuration
├── vercel.json            # Vercel deployment config
└── README.md              # Project documentation
```

---

## Key Files and Directories

### Root Level
- **.env**: Stores environment variables (database URL, secrets, etc.).
- **package.json / package-lock.json**: Define dependencies and scripts.
- **prisma/schema.prisma**: Prisma ORM schema for database models.
- **uploads/**: Directory for uploaded files.
- **vercel.json**: Configuration for Vercel deployment.

### src/
- **app.ts**: Main application entry point. Sets up Express, middleware, and routes.
- **server.ts**: Starts the HTTP server.

#### config/
- **index.ts**: Centralized configuration (reads from .env, sets up config values).

#### constants/
- **pagination.ts**: Constants for pagination logic.

#### errors/
- **ApiErrors.ts**: Custom API error class.
- **handleClientError.ts**: Handles client-side errors.
- **handleValidationError.ts**: Handles validation errors.
- **handleZodError.ts**: Handles errors from Zod validation library.
- **parsePrismaValidationError.ts**: Parses Prisma validation errors.

#### helpars/
- **emailSender.ts**: Utility for sending emails.
- **fileUploader.ts**: Handles file uploads.
- **jwtHelpers.ts**: JWT token creation and verification.
- **paginationHelper.ts**: Helper for paginating results.
- **socketIo.ts**: Socket.IO integration for real-time features.

#### interfaces/
- **common.ts, error.ts, file.ts, paginations.ts**: TypeScript interfaces for type safety.
- **index.d.ts**: Global type definitions.

#### shared/
- **catchAsync.ts**: Utility to catch async errors in controllers.
- **pick.ts**: Utility to pick specific object properties.
- **prisma.ts**: Prisma client instance.
- **sendResponse.ts**: Standardized API response sender.

#### utils/
- **cloudinary.ts**: Cloudinary integration for media uploads.
- **deletePreviousFile.ts**: Deletes files from storage.
- **getRandomCharsFromString.ts**: Generates random strings.
- **normalizeDate.ts**: Normalizes date formats.
- **uploadFileOnDigitalOcean.ts**: Uploads files to DigitalOcean Spaces.

#### app/
- **middlewares/**: Express middleware for authentication, error handling, and request validation.
- **modules/**: Each folder represents a feature module (e.g., User, Article, Comment, etc.).
  - Each module typically contains:
    - `*.controller.ts`: Handles HTTP requests and responses.
    - `*.service.ts`: Business logic and data access.
    - `*.routes.ts`: Route definitions for the module.
    - `*.interface.ts`: TypeScript interfaces for the module.
    - `*.validation.ts`: Validation logic for incoming data.
- **routes/index.ts**: Main router that combines all module routes.

---

## How the Project Works

1. **Startup**: The application starts from `src/server.ts`, which loads the Express app from `src/app.ts` and begins listening for HTTP requests.
2. **Configuration**: Environment variables are loaded from `.env` and used throughout the app via `src/config/index.ts`.
3. **Routing**: All routes are defined in `src/app/routes/index.ts`, which imports and mounts routes from each module in `src/app/modules/`.
4. **Modules**: Each feature (User, Article, etc.) is encapsulated in its own module, following the controller-service-route pattern for separation of concerns.
5. **Middleware**: Authentication, error handling, and request validation are handled by middleware in `src/app/middlewares/`.
6. **Database**: Prisma ORM is used for database access, with models defined in `prisma/schema.prisma` and the client instantiated in `src/shared/prisma.ts`.
7. **Utilities**: Common logic (email, file upload, JWT, etc.) is abstracted into helpers and utils for reuse.
8. **Error Handling**: Centralized error handling ensures consistent API responses and logging.

---

## Adding a New Feature Module

1. Create a new folder in `src/app/modules/` (e.g., `Example/`).
2. Add the following files:
   - `example.controller.ts`: Controller logic.
   - `example.service.ts`: Business logic.
   - `example.routes.ts`: Route definitions.
   - `example.interface.ts`: TypeScript interfaces.
   - `example.validation.ts`: Validation logic.
3. Register the new routes in `src/app/routes/index.ts`.

---

## Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file with the required environment variables.
3. Run database migrations (if using Prisma):
   ```bash
   npx prisma migrate deploy
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## Deployment

- The project is ready for deployment on Vercel (see `vercel.json`).
- Ensure environment variables are set in your deployment environment.

---

## Contact

For questions or contributions, please refer to the module maintainers or open an issue in the repository.
