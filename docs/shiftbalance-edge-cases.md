# ShiftBalance - טיפול במצבי קצה ושגיאות

## 🔴 מצבי קצה קריטיים

### 1. **זמינות**
| מצב | הטיפול |
|-----|---------|
| עובד לא הגיש זמינות כלל | התראת אזהרה + לא משובץ אוטומטית |
| עובד הגיש 0 משמרות זמינות | התראה למנהל "עובד X לא זמין כלל השבוע" |
| כל העובדים זמינים רק למשמרת אחת | התראה למנהל לפני יצירת סידור |
| עובד מעדכן זמינות אחרי 16:00 חמישי | חסימה + הודעת שגיאה |

### 2. **סידור עבודה**
| מצב | הטיפול |
|-----|---------|
| אין מספיק עובדים למשמרת | אזהרה אדומה + חסימת פרסום |
| אין אחראי משמרת זמין | התראה למנהל + הצעה לשדרג עובד זמני |
| כל החזקים לא זמינים למשמרת | הצעת פתרון: פיצול עובד חזק בין משמרות |
| משמרת עם 100% מתלמדים | חסימה מוחלטת - חייב לפחות 1 בינוני |

### 3. **החלפות**
| מצב | הטיפול |
|-----|---------|
| בקשת החלפה 1 שעה לפני משמרת | חסימה - מינימום 4 שעות לפני |
| אין עובדים זמינים להחלפה | הודעה לעובד + התראה למנהל |
| עובד מבטל החלפה אחרי אישור | חסימה - החלפה מאושרת היא סופית |
| 2 עובדים אישרו החלפה במקביל | FIFO - הראשון זוכה |
| עובד מחליף נהיה לא זמין | התראה דחופה למנהל |

### 4. **מערכת**
| מצב | הטיפול |
|-----|---------|
| איבוד חיבור באמצע הגשת זמינות | שמירה אוטומטית כל 30 שניות |
| 2 מנהלים עורכים סידור במקביל | נעילה אופטימיסטית + הודעה |
| Push notifications לא עובד | fallback ל-SMS (Twilio) |
| עובד מנסה להיכנס עם טוקן משומש | הודעת שגיאה + פנייה למנהל |

---

## 🟡 תקלות שכיחות

### Network Errors
```javascript
// Retry Logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

async function apiCall(url, options, retries = 0) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY * (retries + 1));
      return apiCall(url, options, retries + 1);
    }
    throw error;
  }
}
```

### Validation Errors
- **טלפון לא תקין**: "מספר טלפון חייב להיות 10 ספרות"
- **סיסמה חלשה**: "סיסמה חייבת לכלול 8 תווים לפחות"
- **תאריך לא חוקי**: "לא ניתן לבחור תאריך בעבר"

---

## 📱 הודעות שגיאה User-Friendly

### במקום:
❌ "Error 500: Internal Server Error"

### נציג:
✅ "אופס! משהו השתבש. אנחנו כבר עובדים על זה 🔧"

### דוגמאות נוספות:
```javascript
const ERROR_MESSAGES = {
  NETWORK_ERROR: "בעיית תקשורת. בדוק את החיבור לאינטרנט 📶",
  AUTH_FAILED: "שם משתמש או סיסמה לא נכונים 🔐",
  PERMISSION_DENIED: "אין לך הרשאה לבצע פעולה זו 🚫",
  DEADLINE_PASSED: "המועד האחרון להגשה עבר ⏰",
  NOT_FOUND: "המידע שחיפשת לא נמצא 🔍",
  DUPLICATE_REQUEST: "בקשה זהה כבר קיימת במערכת 📋",
  INSUFFICIENT_STAFF: "אין מספיק עובדים זמינים למשמרת זו ⚠️"
};
```

---

## 🔄 Recovery Strategies

### 1. **Auto-Save**
```javascript
// שמירה אוטומטית כל 30 שניות
useEffect(() => {
  const interval = setInterval(() => {
    saveToLocalStorage(formData);
  }, 30000);
  return () => clearInterval(interval);
}, [formData]);
```

### 2. **Optimistic Updates**
```javascript
// עדכון UI מיידי + rollback במקרה של כישלון
const updateShift = async (shiftData) => {
  // עדכון אופטימי
  setShifts(prev => [...prev, shiftData]);
  
  try {
    await api.updateShift(shiftData);
  } catch (error) {
    // Rollback
    setShifts(prev => prev.filter(s => s.id !== shiftData.id));
    showError("העדכון נכשל, נסה שוב");
  }
};
```

### 3. **Graceful Degradation**
- אם Push לא עובד → SMS
- אם SMS לא עובד → Email
- אם Email לא עובד → הודעה במערכת

---

## 🚨 Critical Failures

### מה קורה אם:
1. **השרת קורס בזמן סידור?**
   - Backup אוטומטי כל 5 דקות
   - יכולת לשחזר מהנקודה האחרונה

2. **DB מלא?**
   - מחיקת logs ישנים (30+ ימים)
   - התראה למנהל ב-80% capacity

3. **המנהל נעל את עצמו בחוץ?**
   - Super Admin עם גישת חירום
   - Reset password via SMS

---

## 📊 Monitoring & Alerts

### התראות למנהל המערכת:
```javascript
const SYSTEM_ALERTS = {
  HIGH_ERROR_RATE: "מעל 5% מהבקשות נכשלות",
  SLOW_RESPONSE: "זמן תגובה ממוצע מעל 3 שניות",
  LOW_DISK_SPACE: "נותרו פחות מ-1GB",
  MANY_FAILED_LOGINS: "10+ ניסיונות כושלים מ-IP אחד"
};
```