import React, { useRef, useEffect, useState } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onStop: () => void;
  size?: number;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onStop, size = 100 }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const joystick = joystickRef.current;
    const knob = knobRef.current;
    if (!joystick || !knob) return;

    const handleStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      let x = clientX - centerX;
      let y = clientY - centerY;

      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = size / 2;

      if (distance > maxDistance) {
        x = (x / distance) * maxDistance;
        y = (y / distance) * maxDistance;
      }

      setPosition({ x, y });
      onMove(x / maxDistance, y / maxDistance);
    };

    const handleEnd = () => {
      setIsDragging(false);
      setPosition({ x: 0, y: 0 });
      onStop();
    };

    joystick.addEventListener('mousedown', handleStart);
    joystick.addEventListener('touchstart', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      joystick.removeEventListener('mousedown', handleStart);
      joystick.removeEventListener('touchstart', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, onMove, onStop, size]);

  return (
    <div
      ref={joystickRef}
      className="joystick"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.2)',
        border: '2px solid rgba(255, 255, 255, 0.4)',
      }}
    >
      <div
        ref={knobRef}
        className="joystick-knob"
        style={{
          width: size / 2,
          height: size / 2,
          borderRadius: '50%',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
          background: 'rgba(255, 255, 255, 0.5)',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      />
    </div>
  );
};
