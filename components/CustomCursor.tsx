import React, { useEffect, useRef, useState } from 'react';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [hoverType, setHoverType] = useState<'default' | 'pointer' | 'text'>('default');
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    // Check if device is touch-enabled (disable custom cursor on mobile)
    if (matchMedia('(pointer:coarse)').matches) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower) return;

    // Movement Logic
    const moveCursor = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // Main Dot (Instant)
      cursor.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
      
      // Follower Ring (Delayed/Smooth)
      // We use a slight timeout or keyframe animation via CSS transition, 
      // but updating position directly is smoother for the center.
      follower.animate({
        transform: `translate3d(${clientX}px, ${clientY}px, 0)`
      }, {
        duration: 500,
        fill: 'forwards',
        easing: 'ease-out'
      });
    };

    // Global Hover Detection
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Detect clickable elements
      const isPointer = window.getComputedStyle(target).cursor === 'pointer' || 
                        target.tagName === 'BUTTON' || 
                        target.tagName === 'A' ||
                        target.onclick !== null ||
                        target.closest('button') ||
                        target.closest('a');

      // Detect text selection areas
      const isText = window.getComputedStyle(target).cursor === 'text' || 
                     target.tagName === 'P' || 
                     target.tagName === 'SPAN' || 
                     target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA';

      if (isPointer) {
        setHoverType('pointer');
      } else if (isText) {
        setHoverType('text');
      } else {
        setHoverType('default');
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Mobile Check
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer:coarse)').matches) {
      return null;
  }

  return (
    <>
      {/* Main Small Dot */}
      <div 
        ref={cursorRef}
        className={`fixed top-0 left-0 w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full pointer-events-none z-[9999] -mt-1.5 -ml-1.5 transition-all duration-100 ease-out mix-blend-difference
          ${hoverType === 'pointer' ? 'scale-0 opacity-0' : 'scale-100'}
          ${hoverType === 'text' ? 'h-5 w-1 rounded-none -mt-2.5' : ''}
        `}
      />
      
      {/* Outer Ring / Follower */}
      <div 
        ref={followerRef}
        className={`fixed top-0 left-0 border border-primary-600 dark:border-primary-400 rounded-full pointer-events-none z-[9998] -mt-4 -ml-4 transition-all duration-300 ease-out
          ${hoverType === 'pointer' ? 'w-12 h-12 -mt-6 -ml-6 bg-primary-600/10 dark:bg-primary-400/20 border-transparent backdrop-blur-sm' : 'w-8 h-8'}
          ${hoverType === 'text' ? 'w-0 h-0 opacity-0' : ''}
          ${isClicking ? 'scale-75 bg-primary-600/20' : 'scale-100'}
        `}
      />
    </>
  );
};

export default CustomCursor;