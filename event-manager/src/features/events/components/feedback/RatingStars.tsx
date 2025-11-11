/**
 * Rating Stars Component
 * 
 * Reusable star rating display and input component
 * - Display mode: Shows filled stars based on rating
 * - Input mode: Interactive stars with hover effect
 * 
 * Usage:
 * <RatingStars rating={4} /> // Display
 * <RatingStars rating={rating} onRatingChange={setRating} /> // Input
 */

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  className?: string;
}

export function RatingStars({ 
  rating, 
  onRatingChange, 
  size = 'md',
  readonly = false,
  className 
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const isInteractive = !readonly && onRatingChange;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const handleClick = (value: number) => {
    if (isInteractive) {
      onRatingChange(value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={!isInteractive}
          onClick={() => handleClick(value)}
          onMouseEnter={() => isInteractive && setHoverRating(value)}
          onMouseLeave={() => isInteractive && setHoverRating(0)}
          className={cn(
            'transition-all',
            isInteractive && 'cursor-pointer hover:scale-110',
            !isInteractive && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-all',
              value <= displayRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  );
}
