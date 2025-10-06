import React, { useEffect, useRef, useState } from 'react';
import './AnimatedDog.css';

export const AnimatedDog = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isHappy, setIsHappy] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const angle = Math.atan2(deltaY, deltaX);
      const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 30);

      const maxMove = 5;
      const normalizedDistance = (distance / 30) * maxMove;

      setEyePosition({
        x: Math.cos(angle) * normalizedDistance,
        y: Math.sin(angle) * normalizedDistance,
      });

      if (distance < 100) {
        setIsHappy(true);
      } else {
        setIsHappy(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="animated-dog-container">
      <div className={`cartoon-dog ${isHappy ? 'happy' : ''}`}>
        <div className="ear left-ear"></div>
        <div className="ear right-ear"></div>

        <div className="head">
          <div className="eye left-eye">
            <div
              className="pupil"
              style={{
                transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
              }}
            ></div>
          </div>
          <div className="eye right-eye">
            <div
              className="pupil"
              style={{
                transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
              }}
            ></div>
          </div>

          <div className="snout">
            <div className="nose"></div>
            <div className="mouth-line"></div>
          </div>

          {isHappy && <div className="tongue"></div>}
        </div>

        <div className="body">
          <div className="collar"></div>
          <div className="spot spot-1"></div>
          <div className="spot spot-2"></div>
        </div>

        <div className={`tail ${isHappy ? 'wagging' : ''}`}></div>

        <div className="leg front-left"></div>
        <div className="leg front-right"></div>
        <div className="leg back-left"></div>
        <div className="leg back-right"></div>
      </div>
    </div>
  );
};
