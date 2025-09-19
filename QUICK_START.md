# ShiftBalance - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop running
- npm or yarn

### Start Development Environment

1. **Start Docker services** (PostgreSQL, Redis, PgAdmin):
```bash
docker-compose up -d
```

2. **Install dependencies**:
```bash
npm install
```

3. **Build shared package**:
```bash
npm run build:shared
```

4. **Run database migrations**:
```bash
npm run db:migrate
```

5. **Seed database** (creates test users):
```bash
npm run db:seed
```

6. **Start development servers**:
```bash
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **PgAdmin**: http://localhost:5050
  - Email: admin@admin.com
  - Password: admin

### Test Credentials

**Admin User:**
- Phone: `0501234567`
- Password: `Admin123!`

**Regular Employee:**
- Phone: `0507654321`
- Password: `Employee123!`

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Database
npm run db:migrate       # Run migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Build
npm run build           # Build all packages
npm run build:shared    # Build shared package only

# Testing
npm run test            # Run tests
npm run test:login      # Test login endpoint
```

### Project Structure

```
shift-balance/
├── backend/            # Express.js API server
├── frontend/           # React + Vite app
├── shared/            # Shared types and schemas
├── docker-compose.yml # Docker services
└── package.json       # Monorepo root
```

### Common Issues

1. **Port 5000 in use**: macOS AirPlay uses port 5000. Backend runs on 5001.

2. **Module not found errors**: Rebuild shared package:
```bash
npm run build:shared
```

3. **Database connection error**: Ensure Docker is running:
```bash
docker ps
```

4. **Login not working**: Check backend is running:
```bash
curl http://localhost:5001/api/health
```

### Development Tips

- Frontend auto-refreshes on code changes
- Backend auto-restarts with nodemon
- Use Prisma Studio to view database: `npm run db:studio`
- View logs: `docker logs -f postgres-shift`

### Next Steps

1. ✅ Authentication system complete
2. 🔄 User management (in progress)
3. ⏳ Availability submission
4. ⏳ Schedule creation
5. ⏳ Shift swapping