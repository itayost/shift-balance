// API Endpoints - כל הנתיבים במערכת ShiftBalance

// ========== AUTH ==========
POST   /api/auth/register          // הרשמה עם טוקן חד פעמי
POST   /api/auth/login             // התחברות
POST   /api/auth/logout            // התנתקות
GET    /api/auth/me                // פרטי המשתמש המחובר
POST   /api/auth/refresh           // רענון טוקן

// ========== USERS (Admin Only) ==========
GET    /api/users                  // רשימת כל העובדים
POST   /api/users                  // יצירת עובד חדש + שליחת טוקן
GET    /api/users/:id              // פרטי עובד
PUT    /api/users/:id              // עדכון עובד (רמה, תפקיד, וכו')
DELETE /api/users/:id              // מחיקת עובד
POST   /api/users/:id/reset-token  // יצירת טוקן חדש לעובד

// ========== AVAILABILITY ==========
GET    /api/availability/current   // הזמינות לשבוע הנוכחי
POST   /api/availability           // הגשת זמינות
PUT    /api/availability/:id       // עדכון זמינות (עד יום חמישי 16:00)
GET    /api/availability/week/:weekId // כל הזמינויות לשבוע (Admin)
GET    /api/availability/missing   // עובדים שלא הגישו זמינות (Admin)

// ========== SCHEDULE ==========
GET    /api/schedule/current       // הסידור הנוכחי
GET    /api/schedule/week/:weekId  // סידור לשבוע ספציפי
POST   /api/schedule/generate      // יצירת סידור אוטומטי (Admin)
PUT    /api/schedule/:id           // עריכת סידור (Admin)
POST   /api/schedule/:id/publish   // פרסום סידור (Admin)

// ========== SHIFTS ==========
GET    /api/shifts/my              // המשמרות שלי
GET    /api/shifts/:id             // פרטי משמרת
GET    /api/shifts/:id/employees   // עובדים במשמרת
POST   /api/shifts/:id/assign      // שיבוץ עובד למשמרת (Admin)
DELETE /api/shifts/:id/remove/:userId // הסרת עובד ממשמרת (Admin)

// ========== SWAP REQUESTS ==========
GET    /api/swaps                  // בקשות החלפה (שלי/כולם לפי הרשאה)
POST   /api/swaps                  // יצירת בקשת החלפה
POST   /api/swaps/:id/accept       // אישור החלפה
POST   /api/swaps/:id/cancel       // ביטול בקשה
GET    /api/swaps/available        // החלפות זמינות לי

// ========== NOTIFICATIONS ==========
GET    /api/notifications          // ההתראות שלי
POST   /api/notifications/:id/read // סימון כנקראה
POST   /api/notifications/read-all // סימון הכל כנקרא
POST   /api/notifications/subscribe // רישום ל-push notifications

// ========== STATISTICS (Admin/Manager) ==========
GET    /api/stats/dashboard        // נתונים לדשבורד
GET    /api/stats/shift-balance    // איזון משמרות
GET    /api/stats/employee/:id     // סטטיסטיקת עובד
GET    /api/stats/fair-share       // ניתוח חלוקה הוגנת

// ========== SETTINGS (Admin) ==========
GET    /api/settings               // הגדרות מערכת
PUT    /api/settings/:key          // עדכון הגדרה

// ========== UTILS ==========
POST   /api/utils/send-reminder    // שליחת תזכורת להגיש זמינות
GET    /api/utils/export/schedule/:weekId // ייצוא סידור ל-PDF

// ========== WebSocket Events ==========
// Real-time updates via Socket.io / Server-Sent Events

WS     /ws/connect                 // התחברות
WS     /ws/notification            // התראה חדשה
WS     /ws/swap-request            // בקשת החלפה חדשה
WS     /ws/schedule-published      // סידור פורסם
WS     /ws/shift-updated          // משמרת עודכנה

// ========== Response Format ==========
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// ========== Auth Middleware ==========
// כל הנתיבים דורשים אימות חוץ מ:
// - POST /api/auth/register
// - POST /api/auth/login

// ========== Role-Based Access ==========
/*
ADMIN: גישה מלאה
SHIFT_MANAGER: 
  - צפייה בכל המשמרות והעובדים
  - אין אפשרות לערוך סידורים
  - יכול לראות סטטיסטיקות
EMPLOYEE:
  - רק המידע האישי שלו
  - הגשת זמינות
  - בקשות החלפה
*/