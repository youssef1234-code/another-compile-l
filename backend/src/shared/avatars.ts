/**
 * Preset Avatar Constants
 * 
 * Geometric SVG patterns that can be referenced by ID
 * instead of storing full base64 images
 */

export const PRESET_AVATARS = {
  circles: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><circle cx="50" cy="50" r="30" fill="#737373"/><circle cx="150" cy="50" r="30" fill="#525252"/><circle cx="50" cy="150" r="30" fill="#525252"/><circle cx="150" cy="150" r="30" fill="#737373"/></svg>`,
  
  triangles: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><polygon points="100,20 20,180 180,180" fill="#737373"/><polygon points="100,80 50,160 150,160" fill="#525252"/></svg>`,
  
  squares: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><rect x="20" y="20" width="80" height="80" fill="#737373"/><rect x="100" y="20" width="80" height="80" fill="#525252"/><rect x="20" y="100" width="80" height="80" fill="#525252"/><rect x="100" y="100" width="80" height="80" fill="#737373"/></svg>`,
  
  hexagons: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><polygon points="100,20 150,50 150,110 100,140 50,110 50,50" fill="#737373"/><polygon points="100,60 130,80 130,120 100,140 70,120 70,80" fill="#525252"/></svg>`,
  
  waves: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><path d="M0,100 Q50,50 100,100 T200,100 L200,200 L0,200 Z" fill="#737373"/><path d="M0,130 Q50,80 100,130 T200,130 L200,200 L0,200 Z" fill="#525252"/></svg>`,
  
  dots: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><circle cx="40" cy="40" r="15" fill="#737373"/><circle cx="100" cy="40" r="15" fill="#525252"/><circle cx="160" cy="40" r="15" fill="#737373"/><circle cx="40" cy="100" r="15" fill="#525252"/><circle cx="100" cy="100" r="15" fill="#737373"/><circle cx="160" cy="100" r="15" fill="#525252"/><circle cx="40" cy="160" r="15" fill="#737373"/><circle cx="100" cy="160" r="15" fill="#525252"/><circle cx="160" cy="160" r="15" fill="#737373"/></svg>`,
  
  lines: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><line x1="0" y1="50" x2="200" y2="50" stroke="#737373" stroke-width="20"/><line x1="0" y1="100" x2="200" y2="100" stroke="#525252" stroke-width="20"/><line x1="0" y1="150" x2="200" y2="150" stroke="#737373" stroke-width="20"/></svg>`,
  
  face: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e5e5e5"/><circle cx="100" cy="100" r="80" fill="#737373"/><circle cx="70" cy="85" r="10" fill="#e5e5e5"/><circle cx="130" cy="85" r="10" fill="#e5e5e5"/><path d="M70,130 Q100,150 130,130" stroke="#e5e5e5" stroke-width="5" fill="none"/></svg>`,
} as const;

export type PresetAvatarId = keyof typeof PRESET_AVATARS;

export const PRESET_AVATAR_IDS = Object.keys(PRESET_AVATARS) as PresetAvatarId[];

/**
 * Get avatar display value
 * If it's a preset ID, return the SVG data URI
 * Otherwise return the value as-is (assuming it's already a data URI or URL)
 */
export function getAvatarSrc(avatar: string | undefined, avatarType: 'upload' | 'preset' | undefined): string | undefined {
  if (!avatar) return undefined;
  
  if (avatarType === 'preset' && avatar in PRESET_AVATARS) {
    const svg = PRESET_AVATARS[avatar as PresetAvatarId];
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  
  return avatar; // Return as-is for uploads
}
