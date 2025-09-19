// Business Rules Constants
export const SHIFT_RULES = {
  MIN_STAFF: {
    LUNCH: 6,
    DINNER: 10,
  },
  REQUIRED_EXPERT: {
    EXPERT: 1,
    INTERMEDIATE: 2,
  },
  MAX_PERCENTAGE: {
    TRAINEE: 30,
    RUNNER: 40,
  },
  REQUIRED_ROLES: {
    SHIFT_MANAGER: 1,
    BARTENDER: 1,
    SERVER: 4,
  },
} as const;

export const FAIR_SHARE_RULES = {
  SHIFT_RATIO: {
    MIN: 0.4,
    MAX: 0.6,
  },
  MAX_SHIFT_DIFFERENCE: 3,
  MAX_CONSECUTIVE: 6,
  MIN_REST_PERIOD: 12,
} as const;

export const SWAP_RULES = {
  MIN_HOURS_BEFORE_SHIFT: 4,
  MAX_PENDING_REQUESTS: 2,
} as const;

// Time Constants
export const AVAILABILITY_DEADLINE = {
  DAY: 'thursday',
  TIME: '16:00',
} as const;

export const SHIFT_TIMES = {
  LUNCH: {
    START: '11:00',
    END: '17:00',
  },
  DINNER: {
    START: '17:00',
    END: '23:00',
  },
} as const;

// Quality Score Constants
export const QUALITY_WEIGHTS = {
  EXPERT: 40,
  INTERMEDIATE: 25,
  RUNNER: 15,
  TRAINEE: 10,
} as const;

export const QUALITY_PENALTIES = {
  NO_SHIFT_MANAGER: -20,
  NO_BARTENDER: -15,
  TOO_MANY_TRAINEES: -10,
  UNDERSTAFFED: -25,
  NO_EXPERT_OR_INTERMEDIATE: -30,
} as const;

export const QUALITY_RATINGS = {
  EXCELLENT: { MIN: 80, COLOR: 'green', EMOJI: '🟢' },
  GOOD: { MIN: 60, COLOR: 'yellow', EMOJI: '🟡' },
  FAIR: { MIN: 40, COLOR: 'orange', EMOJI: '🟠' },
  POOR: { MIN: 20, COLOR: 'orange-dark', EMOJI: '🔶' },
  CRITICAL: { MIN: 0, COLOR: 'red', EMOJI: '🔴' },
} as const;

// Validation Constants
export const VALIDATION = {
  PHONE_REGEX: /^05\d{8}$/,
  NAME_REGEX: /^[א-תa-zA-Z\s]{2,50}$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 32,
    REQUIRE_NUMBER: true,
    REQUIRE_LETTER: true,
  },
} as const;

// Hebrew Days
export const HEBREW_DAYS = {
  sunday: 'ראשון',
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
  saturday: 'שבת',
} as const;

// Hebrew UI Text
export const HEBREW_TEXT = {
  SHIFT_TYPES: {
    LUNCH: 'צהריים',
    DINNER: 'ערב',
  },
  EMPLOYEE_LEVELS: {
    EXPERT: 'חזק',
    INTERMEDIATE: 'בינוני',
    RUNNER: 'ראנר',
    TRAINEE: 'מתלמד',
  },
  EMPLOYEE_POSITIONS: {
    SERVER: 'מלצר',
    BARTENDER: 'ברמן',
    SHIFT_MANAGER: 'אחראי משמרת',
  },
  USER_ROLES: {
    ADMIN: 'מנהל',
    SHIFT_MANAGER: 'אחראי משמרת',
    EMPLOYEE: 'עובד',
  },
} as const;