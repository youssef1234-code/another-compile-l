/**
 * Navigation Progress Component
 * 
 * Shows a progress bar at the top of the page during navigation
 * Provides visual feedback for page transitions
 */

import { useEffect, useState } from "react";
import { useNavigation, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const navigation = useNavigation();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (navigation.state === "loading") {
      setIsVisible(true);
      setProgress(0);
      
      // Simulate progress
      const timer1 = setTimeout(() => setProgress(30), 50);
      const timer2 = setTimeout(() => setProgress(60), 200);
      const timer3 = setTimeout(() => setProgress(80), 400);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [navigation.state, location]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div
        className={cn(
          "h-full bg-primary transition-all duration-300 ease-out",
          progress === 100 && "opacity-0"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
