import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  phone: string;
  role: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate access token
 */
export const generateAccessToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, config.jwt.secret) as DecodedToken;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as DecodedToken;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate registration token (for user invitations)
 */
export const generateRegistrationToken = (): string => {
  // Generate a random token for registration
  const randomString = Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15);

  return jwt.sign(
    { token: randomString, type: 'registration' },
    config.jwt.secret,
    { expiresIn: config.registrationTokenExpiry }
  );
};