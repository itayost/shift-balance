# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

ShiftBalance is a mobile-first Progressive Web App (PWA) for restaurant shift management, replacing manual WhatsApp/Excel scheduling with an automated, fair, and intelligent system.

### Business Goals
- 100% digital availability submission
- <30 seconds to generate weekly schedule
- >90% mobile usage
- >85% shift quality score average
- <5% last-minute cancellations

### Target Users
- **Restaurant employees**: Submit availability, view shifts, request swaps
- **Shift managers**: View team composition, manage their shifts
- **Restaurant admins**: Create schedules, manage employees, view analytics

## 🏗️ Technical Architecture

### Tech Stack
```yaml
Frontend:
  framework: React 18 + TypeScript
  styling: TailwindCSS
  state: Zustand
  routing: React Router v6
  forms: React Hook Form + Zod
  pwa: Workbox + Web Push API

Backend:
  runtime: Node.js 20 LTS
  framework: Express.js + TypeScript
  database: PostgreSQL 15 + Prisma ORM
  auth: JWT + Refresh Tokens
  queue: Bull + Redis
  realtime: Socket.io

Infrastructure:
  frontend: Vercel
  backend: Railway/Render
  database: Railway PostgreSQL
  monitoring: Sentry
  analytics: Google Analytics
```

### Directory Structure
```
/frontend
  /src
    /components (common, auth, employee, admin)
    /pages
    /hooks
    /services
    /store (Zustand)
    /types
    /utils
    /styles

/backend
  /src
    /controllers
    /services
    /middleware
    /routes
    /types
    /utils
    /config
    /validators
```

## 📊 Database Schema

### Core Models
```typescript
User {
  id, phone, fullName, password
  role: ADMIN | EMPLOYEE  // System permissions
  level: TRAINEE | RUNNER | INTERMEDIATE | EXPERT
  position: SERVER | BARTENDER | SHIFT_MANAGER  // Job type
  isActive, registrationToken, pushToken
  // Note: Shift managers have role=EMPLOYEE, position=SHIFT_MANAGER
  // Admin has role=ADMIN, position=SHIFT_MANAGER
}

WeeklySchedule {
  id, weekStartDate, weekEndDate
  isPublished, publishedAt, publishedBy
  requiredStaff: {lunch: 8, dinner: 12}
}

Shift {
  id, date, type: LUNCH | DINNER
  employees[], shiftManager
  qualityScore: 0-100
  isBalanced: boolean
}

Availability {
  userId, scheduleId
  slots: [{day, lunch: bool, dinner: bool}]
  submittedAt
}

SwapRequest {
  shiftId, requestedBy, acceptedBy
  status: PENDING | APPROVED | REJECTED | CANCELLED
  reason, createdAt, resolvedAt
}
```

## 📏 Business Rules

### Availability Rules
- **Submission window**: Sunday 00:00 - Thursday 16:00
- **Minimum**: 2 shifts per week (recommended)
- **No edits after deadline**
- **New employees**: Must submit within 7 days

### Shift Requirements
```javascript
const SHIFT_RULES = {
  MIN_STAFF: { lunch: 6, dinner: 10 },
  REQUIRED_EXPERT: { expert: 1 OR intermediate: 2 },
  MAX_PERCENTAGE: { trainee: 30, runner: 40 },
  REQUIRED_ROLES: {
    shift_manager: 1,
    bartender: 1,
    server: 4
  }
};
```

### Swap Rules
- Only same/higher level can swap
- Minimum 4 hours before shift
- Max 2 pending requests per employee
- Approved swaps are final

### Fair Share Algorithm
- Balance morning/evening shifts (40-60% ratio)
- Max 3 shift difference between employees
- Max 6 consecutive days
- Min 12 hours rest between shifts

### Shift Quality Score
```typescript
// Quality calculation
Expert: 40pts, Intermediate: 25pts, Runner: 15pts, Trainee: 10pts

// Penalties
No shift manager: -20
No bartender: -15
Too many trainees: -10
Understaffed: -25

// Ratings
80+: 🟢 Excellent
60-79: 🟡 Good
40-59: 🟠 Poor
<40: 🔴 Critical
```

## 🔗 API Structure

### Authentication
```
POST /api/auth/register    - Register with token
POST /api/auth/login       - Login
GET  /api/auth/me          - Current user
POST /api/auth/refresh     - Refresh token
```

### Core Operations
```
# Availability
GET  /api/availability/current
POST /api/availability
GET  /api/availability/missing

# Schedule
GET  /api/schedule/current
POST /api/schedule/generate
POST /api/schedule/:id/publish

# Shifts
GET  /api/shifts/my
POST /api/shifts/:id/assign

# Swaps
POST /api/swaps
POST /api/swaps/:id/accept
GET  /api/swaps/available
```

## 🛠️ Development Setup

### Initial Project Setup (Not Yet Implemented)
```bash
# Frontend setup
cd frontend
npm install
npm run dev          # Start development server on port 3000

# Backend setup
cd backend
npm install
cp .env.example .env # Configure environment variables
npm run migrate:dev  # Run database migrations
npm run seed         # Seed initial data
npm run dev          # Start server on port 5000
```

### Database Setup
```bash
# PostgreSQL required (v15+)
createdb shiftbalance_dev
createdb shiftbalance_test

# Prisma commands
npx prisma migrate dev   # Create/run migrations
npx prisma studio        # Visual database editor
npx prisma generate      # Generate Prisma Client
```

## 🔐 Security Requirements

```typescript
const SECURITY = {
  rateLimit: { max: 100/15min, loginMax: 5 },
  passwords: { bcrypt: 12, minLength: 8 },
  tokens: { jwt: '24h', refresh: '7d' },
  cors: { origin: 'https://app.shiftbalance.co.il' },
  headers: { helmet: true, csp: true }
};
```

## 🚀 Common Commands

### Environment Setup
```bash
# Install dependencies for both frontend and backend
npm run install:all

# Start both frontend and backend in dev mode
npm run dev:all

# Run database migrations
npm run db:migrate

# Seed database with test data
npm run db:seed

# Reset database (drop, create, migrate, seed)
npm run db:reset
```

### Development Commands
```bash
# Frontend only
cd frontend && npm run dev      # Start React dev server
cd frontend && npm run build    # Production build
cd frontend && npm run preview  # Preview production build

# Backend only
cd backend && npm run dev       # Start Express with nodemon
cd backend && npm run build     # Compile TypeScript
cd backend && npm run start     # Start production server
```

### Testing Commands
```bash
# Run all tests
npm run test

# Frontend tests
cd frontend && npm run test           # Run tests in watch mode
cd frontend && npm run test:coverage  # With coverage report

# Backend tests
cd backend && npm run test            # Run all backend tests
cd backend && npm run test:unit       # Unit tests only
cd backend && npm run test:integration # Integration tests

# E2E tests
npm run test:e2e                      # Run Playwright/Cypress tests
```

### Code Quality
```bash
# Linting
npm run lint          # Lint both frontend and backend
npm run lint:fix      # Auto-fix linting issues

# Type checking
npm run typecheck     # Run TypeScript compiler checks

# Format code
npm run format        # Run Prettier on all files
```

## ⚠️ Edge Cases & Error Handling

### Critical Edge Cases
1. **No availability submitted**: Block from auto-scheduling
2. **All experts unavailable**: Alert admin, suggest solutions
3. **100% trainees in shift**: Hard block - require 1+ intermediate
4. **Concurrent edits**: Optimistic locking with notifications
5. **Push notifications fail**: Fallback to SMS (Twilio)

### Error Messages (Hebrew)
```javascript
NETWORK_ERROR: "בעיית תקשורת. בדוק את החיבור לאינטרנט 📶"
AUTH_FAILED: "שם משתמש או סיסמה לא נכונים 🔐"
DEADLINE_PASSED: "המועד האחרון להגשה עבר ⏰"
INSUFFICIENT_STAFF: "אין מספיק עובדים זמינים למשמרת זו ⚠️"
```

### Recovery Strategies
- Auto-save every 30 seconds
- Optimistic UI updates with rollback
- Retry logic (3 attempts with exponential backoff)
- Graceful degradation: Push → SMS → Email → In-app

## 📱 User Flows

### Employee Flow
1. Receive registration link via WhatsApp
2. Set password, enable notifications
3. Submit weekly availability (Sun-Thu 16:00)
4. Receive schedule notification (Saturday)
5. Request swaps if needed (4hr minimum)

### Admin Flow
1. Add new employees → Generate tokens
2. Review availability submissions (Thu 16:00+)
3. Generate auto-schedule → Review quality scores
4. Manual adjustments if needed
5. Publish schedule → Auto-notify all

### Shift Manager Flow
1. View upcoming shift team composition
2. See employee levels & contact info
3. Receive swap notifications
4. Access team performance metrics

## 🎨 UI/UX Guidelines

### Mobile-First Design
- Touch targets: min 44px height
- Bottom navigation for easy thumb access
- Swipe gestures for common actions
- RTL support for Hebrew

### Visual Indicators
- Employee levels: Color-coded badges
- Shift quality: Traffic light system
- Availability: Checkbox grid
- Loading states: Skeleton screens

### Performance Targets
- First paint: <1.5s
- Interactive: <3s
- API responses: <500ms
- Offline capability via PWA

## 📈 Monitoring & Analytics

### Key Metrics
```yaml
Performance:
  - API response time <500ms
  - Page load <3s
  - Error rate <1%

Business:
  - Availability submission rate
  - Shift quality average
  - Swap request success rate
  - Fair share distribution

User:
  - Daily active users
  - Feature adoption
  - Session duration
```

## 🔄 Version Control

### Git Workflow
```
main → production
develop → staging
feature/* → new features
hotfix/* → urgent fixes
```

### Commit Convention
```
feat: Add feature
fix: Fix bug
docs: Update docs
style: Format code
refactor: Refactor code
test: Add tests
chore: Update deps
```

## 🏗️ Project Structure

### Current Status
The project is in the planning and design phase with comprehensive documentation. No code implementation has started yet.

### Documentation Structure
```
/docs
  shiftbalance-development-plan.md  # 6-week implementation timeline
  shiftbalance-architecture.md      # Technical architecture details
  shiftbalance-business-rules.md    # Business logic & validations
  shiftbalance-flow.md              # User flow descriptions
  shiftbalance-edge-cases.md       # Edge cases & error handling
  shiftbalance-api.ts               # API endpoint definitions
  shiftbalance-schema.txt           # Prisma database schema

/design
  /wireframes                       # HTML wireframe files
  shiftbalance-design-system.css   # Complete CSS design system
```

### Implementation Priority
1. **Week 1**: Authentication + User Management
2. **Week 2**: Availability + Schedule Display
3. **Week 3**: Smart Algorithm + Swaps
4. **Week 4**: Testing + Polish
5. **Week 5-6**: Deployment + Production

## 📝 Critical Implementation Notes

### Hebrew/RTL Support
- All user-facing text must be in Hebrew
- Use `dir="rtl"` for proper right-to-left layout
- Test all UI components with Hebrew text

### Mobile-First Requirements
- Minimum touch target: 44px
- Bottom navigation for thumb accessibility
- Optimize for viewport: 375px - 428px width
- PWA with offline capability required

### Algorithm Constraints
```javascript
// Must enforce these rules in shift balancing:
NEVER: Allow 100% trainee shifts
ALWAYS: Require 1 expert OR 2 intermediate minimum
ENFORCE: 12-hour minimum rest between shifts
LIMIT: 30% trainees, 40% runners maximum
REQUIRE: Shift manager + bartender roles
```

### State Management
- Use Zustand for global state (no Redux/MobX)
- Local state with useState for component-specific data
- React Query for server state management
- Form state with React Hook Form + Zod

### Performance Requirements
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- API response time: <500ms
- Implement code splitting for routes
- Use React.lazy() for heavy components

### Data Validation
- Frontend: Zod schemas for all forms
- Backend: Joi/Zod for API validation
- Database: Prisma schema constraints
- Never trust client-side validation alone