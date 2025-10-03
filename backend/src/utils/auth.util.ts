/**
 * Authentication Utilities
 * 
 * JWT token generation/verification and password hashing
 * 
 * @module utils/auth
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config/env.js';

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcryptRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn } as jwt.SignOptions
  );
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): { userId: string; role: string } => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate random verification token
 */
export const generateVerificationToken = (): string => {
  return jwt.sign(
    { random: Math.random() },
    config.jwtSecret,
    { expiresIn: config.verificationTokenExpires } as jwt.SignOptions
  );
};
