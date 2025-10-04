/**
 * Base Router Utility
 * 
 * Helper functions for tRPC routers
 * 
 * @module routers/base.router
 */

import { z } from 'zod';

/**
 * Helper to create search schema
 * Used by events router and can be reused by other routers
 * 
 * @example
 * ```typescript
 * search: publicProcedure
 *   .input(createSearchSchema())
 *   .query(async ({ input }) => {
 *     return service.search(input.query, {
 *       page: input.page,
 *       limit: input.limit
 *     });
 *   })
 * ```
 */
export const createSearchSchema = () => {
  return z.object({
    query: z.string().min(1, 'Search query is required'),
    page: z.number().min(1).optional().default(1),
    limit: z.number().min(1).max(100).optional().default(10),
  });
};

