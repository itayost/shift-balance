# ShiftBalance - חוקי עסק וולידציות

## 📏 חוקי עסק (Business Rules)

### 1. **חוקי זמינות**
- ✅ הגשת זמינות: ראשון 00:00 - חמישי 16:00
- ✅ מינימום 2 משמרות זמינות בשבוע (המלצה, לא חובה)
- ✅ לא ניתן לערוך זמינות אחרי המועד האחרון
- ✅ עובד חדש חייב להגיש זמינות תוך 7 ימים מההרשמה

### 2. **חוקי שיבוץ**
```javascript
const SHIFT_RULES = {
  // מינימום עובדים לפי משמרת
  MIN_STAFF: {
    lunch: 6,
    dinner: 10
  },
  
  // חובה לפחות אחד מ:
  REQUIRED_EXPERT: {
    expert: 1,      // או
    intermediate: 2 // או
  },
  
  // מקסימום אחוזים לפי רמה
  MAX_PERCENTAGE: {
    trainee: 30,    // מקס 30% מתלמדים
    runner: 40      // מקס 40% ראנרים
  },
  
  // תפקידים חובה
  REQUIRED_ROLES: {
    shift_manager: 1,  // חובה 1 בדיוק
    bartender: 1,      // מינימום 1
    server: 4          // מינימום 4
  }
};
```

### 3. **חוקי החלפות**
- ✅ רק עובד ברמה שווה או גבוהה יכול להחליף
- ✅ מינימום 4 שעות לפני תחילת המשמרת
- ✅ מקסימום 2 בקשות החלפה פתוחות בו-זמנית לעובד
- ✅ החלפה מאושרת = סופית (אין ביטול)
- ❌ אחראי משמרת לא יכול לבקש החלפה (רק דרך מנהל)

### 4. **חוקי Fair Share**
```javascript
const FAIR_SHARE_RULES = {
  // איזון משמרות בוקר/ערב
  SHIFT_RATIO: {
    min: 0.4,  // מינימום 40% מכל סוג
    max: 0.6   // מקסימום 60% מכל סוג
  },
  
  // פער מקסימלי בין עובדים
  MAX_SHIFT_DIFFERENCE: 3, // לא יותר מ-3 משמרות הפרש
  
  // משמרות רצופות
  MAX_CONSECUTIVE: 6,       // מקס 6 ימים רצופים
  MIN_REST_PERIOD: 12       // מינימום 12 שעות בין משמרות
};
```

---

## ✅ ולידציות (Validations)

### 1. **Input Validations**

```typescript
// טלפון ישראלי
const PHONE_REGEX = /^05\d{8}$/;

// שם מלא (עברית/אנגלית)
const NAME_REGEX = /^[א-תa-zA-Z\s]{2,50}$/;

// סיסמה חזקה
const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 32,
  requireNumber: true,
  requireLetter: true
};

interface ValidationRules {
  // User
  phone: {
    required: true,
    pattern: PHONE_REGEX,
    unique: true,
    message: "מספר טלפון לא תקין (05XXXXXXXX)"
  },
  
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: NAME_REGEX,
    message: "שם מלא חייב להכיל 2-50 תווים"
  },
  
  password: {
    required: true,
    minLength: 8,
    maxLength: 32,
    pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
    message: "סיסמה חייבת להכיל לפחות 8 תווים, אות ומספר"
  },
  
  // Shift
  shiftDate: {
    required: true,
    minDate: "today",
    maxDate: "+30 days",
    message: "ניתן לתכנן משמרות עד 30 יום קדימה"
  },
  
  // Swap Request
  swapReason: {
    required: false,
    maxLength: 200,
    message: "הסיבה ארוכה מדי (מקסימום 200 תווים)"
  }
}
```

### 2. **Business Logic Validations**

```typescript
// בדיקת איזון משמרת
function validateShiftBalance(shift: Shift): ValidationResult {
  const errors = [];
  
  // ספירת עובדים לפי רמה
  const levels = countByLevel(shift.employees);
  
  // חוק 1: מינימום עובדים חזקים
  if (levels.expert < 1 && levels.intermediate < 2) {
    errors.push("חייב לפחות 1 expert או 2 intermediate");
  }
  
  // חוק 2: מקסימום מתלמדים
  const traineePercentage = (levels.trainee / shift.employees.length) * 100;
  if (traineePercentage > 30) {
    errors.push("יותר מדי מתלמדים (מקסימום 30%)");
  }
  
  // חוק 3: תפקידים חובה
  const roles = countByRole(shift.employees);
  if (!roles.shift_manager) {
    errors.push("חסר אחראי משמרת");
  }
  if (!roles.bartender) {
    errors.push("חסר ברמן");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: calculateShiftScore(shift)
  };
}
```

### 3. **Security Validations**

```typescript
const SECURITY_RULES = {
  // Rate Limiting
  LOGIN_ATTEMPTS: {
    maxAttempts: 5,
    windowMinutes: 15,
    blockMinutes: 30
  },
  
  // Token Expiry
  JWT_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  REGISTRATION_TOKEN_EXPIRY: '48h',
  
  // Password Reset
  RESET_TOKEN_EXPIRY: '1h',
  MIN_PASSWORD_AGE: '24h', // לא ניתן לשנות סיסמה יותר מפעם ביום
  
  // Session
  MAX_CONCURRENT_SESSIONS: 3,
  SESSION_TIMEOUT: '4h'
};
```

---

## 🔒 הרשאות (Permissions)

### Permission Matrix

**Note:** Permissions are based on `role` (ADMIN/EMPLOYEE), not `position` (SERVER/BARTENDER/SHIFT_MANAGER)
- Shift managers are employees with position=SHIFT_MANAGER
- Only role=ADMIN has administrative permissions

| פעולה | Admin (role=ADMIN) | Employee (role=EMPLOYEE) |
|-------|-------------------|------------------------|
| **עובדים** |
| צפייה בכל העובדים | ✅ | ❌ |
| יצירת עובד חדש | ✅ | ❌ |
| עריכת פרטי עובד | ✅ | ❌ |
| מחיקת עובד | ✅ | ❌ |
| **זמינות** |
| הגשת זמינות אישית | ✅ | ✅ |
| צפייה בזמינות של כולם | ✅ | ❌ |
| **סידור עבודה** |
| יצירת סידור | ✅ | ❌ |
| עריכת סידור | ✅ | ❌ |
| פרסום סידור | ✅ | ❌ |
| צפייה בסידור מלא | ✅ | ✅* |
| צפייה במשמרות אישיות | ✅ | ✅ |
| **החלפות** |
| בקשת החלפה | ❌** | ✅ |
| אישור החלפה | ✅ | ✅ |
| ביטול החלפה | ✅ | ✅*** |
| **דוחות** |
| דשבורד מנהל | ✅ | ❌ |
| סטטיסטיקות עובדים | ✅ | ✅* |
| דוחות fair share | ✅ | ❌ |

* עובדים עם position=SHIFT_MANAGER יכולים לראות את הסידור המלא והסטטיסטיקות של המשמרת שלהם
** Admin לא צריך לבקש החלפה, הוא עורך ישירות
*** רק אם הוא יצר את הבקשה ועדיין pending

---

## 🎯 ציון איכות משמרת

```typescript
function calculateShiftScore(shift: Shift): number {
  let score = 100;
  
  // ניקוד לפי רמת עובדים
  const avgLevel = calculateAverageLevel(shift.employees);
  score = score * (avgLevel / 4); // 4 = expert level
  
  // קנסות
  const penalties = {
    noShiftManager: -20,
    noBartender: -15,
    tooManyTrainees: -10,
    underStaffed: -25,
    noExpertOrIntermediate: -30
  };
  
  // החלת קנסות
  if (!hasShiftManager(shift)) score += penalties.noShiftManager;
  if (!hasBartender(shift)) score += penalties.noBartender;
  // ... ושאר הבדיקות
  
  return Math.max(0, Math.min(100, score));
}

// דירוג משמרת
function getShiftRating(score: number): ShiftRating {
  if (score >= 80) return { level: 'EXCELLENT', color: 'green', emoji: '🟢' };
  if (score >= 60) return { level: 'GOOD', color: 'yellow', emoji: '🟡' };
  if (score >= 40) return { level: 'POOR', color: 'orange', emoji: '🟠' };
  return { level: 'CRITICAL', color: 'red', emoji: '🔴' };
}
```