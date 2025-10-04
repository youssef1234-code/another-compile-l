/**
 * tRPC Context
 * 
 * Context creation for tRPC procedures
 * 
 * @module trpc/context
 */

import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyAccessToken } from '../utils/auth.util.js';
import { User, type IUser } from '../models/user.model.js';

/**
 * Create context for each request
 */
export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  let user: IUser | null = null;
  
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      user = await User.findById(decoded.userId).select('-password') as IUser | null;
    } catch (error) {
      // Token invalid or expired, user remains null
    }
  }
  
  return {
    req,
    res,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
