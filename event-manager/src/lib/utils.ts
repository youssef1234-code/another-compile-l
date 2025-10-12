import clsx, { type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

export type { ClassValue } from 'clsx';

// Novu's custom Tailwind merge configuration
// Extends tailwind-merge to recognize custom text sizes, shadows, and border radii
export const twMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'title-h1', 'title-h2', 'title-h3', 'title-h4', 'title-h5', 'title-h6',
            'label-xl', 'label-lg', 'label-md', 'label-sm', 'label-xs', 'label-2xs',
            'paragraph-xl', 'paragraph-lg', 'paragraph-md', 'paragraph-sm', 'paragraph-xs', 'paragraph-2xs',
            'subheading-md', 'subheading-sm', 'subheading-xs', 'subheading-2xs',
            'code-xs'
          ],
        },
      ],
      shadow: [
        {
          shadow: ['xs', 'button-primary-focus'],
        },
      ],
      rounded: [
        {
          rounded: ['4', '6', '8', '10', '12', '16', '20', '24', 'full'],
        },
      ],
    },
  },
};

const customTwMerge = extendTailwindMerge(twMergeConfig);

export function cn(...classes: ClassValue[]) {
  return customTwMerge(clsx(...classes));
}
