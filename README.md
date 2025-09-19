# ShiftBalance - מערכת ניהול משמרות חכמה למסעדות

## 🎯 תיאור

ShiftBalance היא מערכת Progressive Web App (PWA) לניהול משמרות במסעדות, המחליפה את השיטה הידנית של WhatsApp/Excel במערכת אוטומטית, הוגנת וחכמה.

## 🚀 התחלה מהירה

### דרישות מערכת
- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose
- npm 10+

### התקנה

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/shift-balance.git
cd shift-balance
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# ערוך את קובץ ה-.env עם הערכים המתאימים
```

4. **Start Docker services**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npm run db:migrate
```

6. **Seed the database** (אופציונלי)
```bash
npm run db:seed
```

7. **Start development servers**
```bash
npm run dev
```

האפליקציה תרוץ ב:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- PgAdmin: http://localhost:5050
- Redis: localhost:6379

## 📁 מבנה הפרויקט

```
shift-balance/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API services
│   │   ├── store/       # Zustand state management
│   │   └── utils/       # Utilities
│   └── public/          # Static assets
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   └── validators/  # Input validation
│   └── prisma/          # Database schema & migrations
├── shared/            # Shared types & constants
└── docs/              # Documentation
```

## 🛠️ פקודות זמינות

### Development
```bash
npm run dev           # הרצת שני השרתים במקביל
npm run dev:frontend  # הרצת Frontend בלבד
npm run dev:backend   # הרצת Backend בלבד
```

### Database
```bash
npm run db:migrate    # הרצת מיגרציות
npm run db:seed       # הזנת נתוני בדיקה
npm run db:reset      # איפוס הדאטהבייס
npm run db:studio     # פתיחת Prisma Studio
```

### Testing
```bash
npm run test          # הרצת כל הטסטים
npm run test:frontend # טסטים של Frontend
npm run test:backend  # טסטים של Backend
```

### Build
```bash
npm run build         # בניית כל הפרויקט
npm run build:frontend # בניית Frontend
npm run build:backend  # בניית Backend
```

### Code Quality
```bash
npm run lint          # בדיקת קוד
npm run format        # פורמט אוטומטי
npm run typecheck     # בדיקת TypeScript
```

## 📋 Features

### לעובדים
- ✅ הגשת זמינות שבועית
- ✅ צפייה במשמרות אישיות
- ✅ בקשת החלפות
- ✅ קבלת התראות בזמן אמת
- ✅ צפייה בסידור מלא

### למנהלים
- ✅ ניהול עובדים
- ✅ יצירת סידור אוטומטי
- ✅ עריכה ידנית של סידורים
- ✅ מעקב אחר איזון משמרות
- ✅ דשבורד ניהולי
- ✅ דוחות וסטטיסטיקות

## 🔒 חוקי עסק

### זמינות
- הגשה: ראשון 00:00 - חמישי 16:00
- מינימום 2 משמרות מומלץ

### שיבוץ
- מינימום 1 expert או 2 intermediate
- מקסימום 30% מתלמדים
- מקסימום 40% ראנרים
- חובה: אחראי משמרת (position=SHIFT_MANAGER) + ברמן (position=BARTENDER)
- הערה: אחראי משמרת הוא תפקיד (position), לא הרשאה (role)

### החלפות
- רק עובד באותה רמה או גבוהה יותר
- מינימום 4 שעות לפני המשמרת
- מקסימום 2 בקשות פתוחות

## 🚦 סטטוס הפרויקט

פאזה נוכחית: **Phase 0 - Initial Setup** ✅

### הושלם
- ✅ מבנה monorepo
- ✅ Frontend setup (Vite + React + TypeScript)
- ✅ Backend setup (Express + TypeScript)
- ✅ Shared types package
- ✅ Database schema (Prisma)
- ✅ Docker configuration
- ✅ Environment setup

### בתהליך
- 🔄 JWT Authentication
- 🔄 Basic UI components
- 🔄 API endpoints

### מתוכנן
- ⏳ User management CRUD
- ⏳ Availability submission
- ⏳ Schedule generation algorithm
- ⏳ Swap request system
- ⏳ Push notifications

## 📚 Documentation

- [Development Plan](docs/shiftbalance-development-plan.md)
- [Architecture](docs/shiftbalance-architecture.md)
- [Business Rules](docs/shiftbalance-business-rules.md)
- [API Documentation](docs/shiftbalance-api.ts)
- [User Flows](docs/shiftbalance-flow.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 👥 Team

- Backend Development
- Frontend Development
- UI/UX Design
- Project Management

## 📞 Support

לתמיכה ושאלות, פנו ל: support@shiftbalance.co.il