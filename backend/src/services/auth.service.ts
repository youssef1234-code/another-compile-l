/**
 * Auth Service (Legacy Export)
 * 
 * This file now re-exports the UserService as authService for backward compatibility.
 * All authentication and user management logic has been moved to user.service.ts
 * which extends BaseService for better code organization.
 * 
 * @deprecated Import from user.service.ts instead
 * @module services/auth.service
 */

export { userService as authService, UserService as AuthService } from './user.service.js';
