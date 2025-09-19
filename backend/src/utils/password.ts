import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain password with a hashed password
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('סיסמה חייבת להכיל לפחות 8 תווים');
  }

  if (password.length > 32) {
    errors.push('סיסמה ארוכה מדי (מקסימום 32 תווים)');
  }

  if (!/[A-Za-z]/.test(password)) {
    errors.push('סיסמה חייבת להכיל לפחות אות אחת');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('סיסמה חייבת להכיל לפחות מספר אחד');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};