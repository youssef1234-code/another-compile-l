/**
 * JWT Helper Utilities
 * 
 * Helper functions for JWT token management
 * 
 * @module lib/jwtHelpers
 */

interface JWTPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT token (without verification - just reads payload)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded) return true;
  
  // Check if token expires in next 30 seconds (refresh proactively)
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = 30 * 1000; // 30 seconds buffer
  
  return currentTime >= expirationTime - bufferTime;
}

/**
 * Check if JWT token is valid (not expired)
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  return new Date(decoded.exp * 1000);
}

/**
 * Get time until token expires (in milliseconds)
 */
export function getTimeUntilExpiration(token: string): number {
  const decoded = decodeJWT(token);
  if (!decoded) return 0;
  
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return Math.max(0, expirationTime - currentTime);
}
