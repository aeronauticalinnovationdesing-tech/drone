import React, { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function RefreshableContent({ children, onRefresh, isLoading = false }) {
  const containerRef = useRef(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartRef = useRef(0);

  const handleTouchStart = (e) => {
    const container = containerRef.current;
    if (!container) return;
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartRef.current;

    if (distance > 0) {
      setPullDistance(Math.min(distance, 100));
      setIsPulling(distance > 60);
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && !isLoading) {
      setPullDistance(100);
      setIsPulling(false);
      await onRefresh?.();
      setTimeout(() => {
        setPullDistance(0);
      }, 300);
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all pointer-events-none"
          style={{
            height: `${pullDistance}px`,
            opacity: Math.min(pullDistance / 60, 1),
          }}
        >
          <RefreshCw
            className="w-5 h-5 text-primary"
            style={{
              transform: `rotate(${(pullDistance / 100) * 360}deg)`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ paddingTop: `${Math.max(0, pullDistance - 60)}px` }}>
        {children}
      </div>
    </div>
  );
}