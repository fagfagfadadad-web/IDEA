import React, { useEffect, useRef, useState } from 'react';
import './AnimatedDog.css';

export const AnimatedDog = () => {
  const dogRef = useRef<HTMLDivElement>(null);
  const [eyeLeftPosition, setEyeLeftPosition] = useState({ x: 0, y: 0 });
  const [eyeRightPosition, setEyeRightPosition] = useState({ x: 0, y: 0 });
  const [isHappy, setIsHappy] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dogRef.current) return;

      const rect = dogRef.current.getBoundingClientRect();

      const leftEyeCenterX = rect.left + 215;
      const leftEyeCenterY = rect.top + 195;
      const rightEyeCenterX = rect.left + 345;
      const rightEyeCenterY = rect.top + 195;

      const calculateEyePosition = (eyeCenterX: number, eyeCenterY: number) => {
        const deltaX = e.clientX - eyeCenterX;
        const deltaY = e.clientY - eyeCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 100);
        const maxMove = 8;
        const normalizedDistance = (distance / 100) * maxMove;

        return {
          x: Math.cos(angle) * normalizedDistance,
          y: Math.sin(angle) * normalizedDistance,
        };
      };

      setEyeLeftPosition(calculateEyePosition(leftEyeCenterX, leftEyeCenterY));
      setEyeRightPosition(calculateEyePosition(rightEyeCenterX, rightEyeCenterY));

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceToCenter = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      );

      setIsHappy(distanceToCenter < 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={dogRef} className={`dog ${isHappy ? 'happy' : ''}`}>
      <div className="collar"></div>
      <div className="neck"></div>
      <div className="tongue"></div>
      <div className="mouth"></div>
      <div className="face"></div>
      <div className="ear--left"></div>
      <div className="ear--right"></div>
      <div className="eye--left">
        <div
          className="eye-pupil"
          style={{
            transform: `translate(${eyeLeftPosition.x}px, ${eyeLeftPosition.y}px)`
          }}
        ></div>
      </div>
      <div className="eye--right">
        <div
          className="eye-pupil"
          style={{
            transform: `translate(${eyeRightPosition.x}px, ${eyeRightPosition.y}px)`
          }}
        ></div>
      </div>
      <div className="nose"></div>
      <div className="freckles--left"></div>
      <div className="freckles--right"></div>
    </div>
  );
};
