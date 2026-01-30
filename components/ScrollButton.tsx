
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, ArrowDown, GripHorizontal } from 'lucide-react';

const ScrollButton: React.FC = () => {
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const [isIdle, setIsIdle] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Position State (Persisted with v2 key to force reset if needed)
  const [position, setPosition] = useState(() => {
      // Safety check for SSR or initial load
      if (typeof window === 'undefined') return { x: 0, y: 0 };
      
      const saved = localStorage.getItem('scroll_btn_pos_v2');
      if (saved) {
          try { return JSON.parse(saved); } catch(e) {}
      }
      // Default: Bottom Right (approx)
      return { x: window.innerWidth - 70, y: window.innerHeight - 100 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const hasMoved = useRef(false);
  const idleTimer = useRef<any>(null);
  const activeScrollTarget = useRef<Element | Window>(window);

  useEffect(() => {
      setMounted(true);
      
      // Ensure button is within screen bounds on load/resize
      const checkBounds = () => {
          setPosition(prev => {
              const maxX = window.innerWidth - 60;
              const maxY = window.innerHeight - 60;
              let newX = prev.x;
              let newY = prev.y;

              if (newX > maxX) newX = maxX;
              if (newY > maxY) newY = maxY;
              if (newX < 0) newX = 20;
              if (newY < 0) newY = 20;

              return { x: newX, y: newY };
          });
      };

      checkBounds();
      window.addEventListener('resize', checkBounds);
      return () => window.removeEventListener('resize', checkBounds);
  }, []);

  // Save Position
  useEffect(() => {
      if (mounted) {
          localStorage.setItem('scroll_btn_pos_v2', JSON.stringify(position));
      }
  }, [position, mounted]);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Detect scroll target
      const target = e.target as Element | Document;
      let scrollTop = 0;
      let maxScroll = 0;
      
      if (target === document) {
          scrollTop = window.scrollY;
          maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          activeScrollTarget.current = window;
      } else if (target instanceof Element) {
          scrollTop = target.scrollTop;
          maxScroll = target.scrollHeight - target.clientHeight;
          activeScrollTarget.current = target;
      }

      // Logic: Show DOWN if near top, UP if scrolled down
      if (scrollTop > 300) {
        setDirection('up');
      } else {
        setDirection('down');
      }

      // Reset Idle Timer
      setIsIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIsIdle(true), 3000);
    };

    // Capture phase to detect scroll in nested divs
    window.addEventListener('scroll', handleScroll, { capture: true });
    return () => {
        window.removeEventListener('scroll', handleScroll, { capture: true });
        if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      
      const startX = e.clientX;
      const startY = e.clientY;
      const initialPos = { ...position };
      
      hasMoved.current = false;
      setIsDragging(true);
      setIsIdle(false);

      const handlePointerMove = (moveEvent: PointerEvent) => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
              hasMoved.current = true;
              
              const newX = initialPos.x + dx;
              const newY = initialPos.y + dy;
              
              const maxX = window.innerWidth - 60;
              const maxY = window.innerHeight - 60;

              setPosition({
                  x: Math.min(Math.max(0, newX), maxX),
                  y: Math.min(Math.max(0, newY), maxY)
              });
          }
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
          target.releasePointerCapture(upEvent.pointerId);
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          setIsDragging(false);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
  };

  const handleClick = () => {
    if (hasMoved.current) return; 
    
    let target = activeScrollTarget.current;
    
    // Fallback: If target is lost or window, try to find main scrollable area
    if (!target || target === window || (target instanceof Element && !document.body.contains(target))) {
       // Usually the main content is window, but sometimes it's a div with overflow
       // Default to window
       target = window;
    }

    const behavior = 'smooth';

    if (direction === 'up') {
        if (target instanceof Window) target.scrollTo({ top: 0, behavior });
        else (target as Element).scrollTo({ top: 0, behavior });
    } else {
        if (target instanceof Window) {
            target.scrollTo({ top: document.documentElement.scrollHeight, behavior });
        } else {
            const el = target as Element;
            el.scrollTo({ top: el.scrollHeight, behavior });
        }
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: 'none',
          zIndex: 2147483647 // Max Z-Index
      }}
      className={`
        fixed top-0 left-0
        w-14 h-14 rounded-full 
        bg-gradient-to-br from-[#790000] to-red-600 
        text-white border-2 border-white/50 dark:border-gray-500
        shadow-[0_8px_30px_rgba(0,0,0,0.5)]
        cursor-move select-none transition-all duration-300
        flex flex-col items-center justify-center
        ${isIdle && !isDragging ? 'opacity-40 scale-90 hover:opacity-100 hover:scale-100' : 'opacity-100 scale-100'}
        active:scale-95
      `}
      title={direction === 'up' ? "উপরে যান (ধরে সরাতে পারেন)" : "নিচে যান (ধরে সরাতে পারেন)"}
    >
      {direction === 'up' ? (
        <ArrowUp size={28} strokeWidth={3} className="animate-pulse" />
      ) : (
        <ArrowDown size={28} strokeWidth={3} />
      )}
      
      {/* Grip Indicator */}
      <div className="absolute bottom-1.5 opacity-50">
        <GripHorizontal size={12} />
      </div>
    </div>,
    document.body
  );
};

export default ScrollButton;
