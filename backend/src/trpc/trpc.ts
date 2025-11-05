/**
 * tRPC Initialization
 * 
 * Setup tRPC with middleware and procedures
 * 
 * @module trpc/trpc
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context.js';
import { type IUser } from '../models/user.model.js';

const t = initTRPC.context<Context>().create();

/**
 * Base router and procedure
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async (opts: any) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  if (ctx.user.status === 'BLOCKED') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your account has been blocked',
    });
  }
  
  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user as IUser, // Type-safe user
    },
  });
});

/**
 * Admin only procedure
 */
export const adminProcedure = protectedProcedure.use(async (opts: any) => {
  const { ctx } = opts;
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only administrators can access this resource',
    });
  }
  
  return opts.next({ ctx });
});

/**
 * Events Office procedure (includes ADMIN access)
 */
export const eventsOfficeProcedure = protectedProcedure.use(async (opts: any) => {
  const { ctx } = opts;
  if (ctx.user.role !== 'EVENT_OFFICE' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only Event Office staff can access this resource',
    });
  }
  
  return opts.next({ ctx });
});

/**
 * Events Office only procedure (excludes ADMIN)
 */
export const eventsOfficeOnlyProcedure = protectedProcedure.use(async (opts: any) => {
  const { ctx } = opts;
  if (ctx.user.role !== 'EVENT_OFFICE') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only Event Office staff can access this resource',
    });
  }
  return opts.next({ ctx });
});


export const eventsOfficeProfessorProcedure = protectedProcedure.use(async (opts: any) => {
  const { ctx } = opts;
  if (ctx.user.role !== 'PROFESSOR' && ctx.user.role !== 'ADMIN' && ctx.user.role !== 'EVENT_OFFICE') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only professors and Event Office staff can access this resource',
    });
  }
  
  return opts.next({ ctx });
});


/**
 * Professor procedure (includes ADMIN access)
 */
export const professorProcedure = protectedProcedure.use(async (opts: any) => {
  const { ctx } = opts;
  if (ctx.user.role !== 'PROFESSOR' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only professors can access this resource',
    });
  }
  
  return opts.next({ ctx });
});

/**
 * Vendor procedure (includes ADMIN access)
 */
export const vendorProcedure = protectedProcedure.use(async (opts: any) => {
  const { ctx } = opts;
  if (ctx.user.role !== 'VENDOR' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only vendors can access this resource',
    });
  }
  
  return opts.next({ ctx });
});
