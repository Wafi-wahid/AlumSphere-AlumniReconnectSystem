import React, { useState } from 'react';

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  cooldown?: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  cooldown = 0,
}) => {
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  const handleClick = () => {
    if (isOnCooldown || disabled) return;

    onClick();
    
    if (cooldown > 0) {
      setIsOnCooldown(true);
      setTimeout(() => setIsOnCooldown(false), cooldown * 1000);
    }
  };

  return (
    <button
      className={`action-button ${isOnCooldown || disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={isOnCooldown || disabled}
    >
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
      {isOnCooldown && <div className="cooldown-overlay" />}
    </button>
  );
};
