// src/components/StyledButton.tsx

import React from 'react';
import { createStoneButtonStyle, createSmallStoneButtonStyle, createCompactStoneButtonStyle, handleStoneButtonHover, colors } from '../utils/styles';

interface StyledButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'repair' | 'focus' | 'urgent';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const StyledButton: React.FC<StyledButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'md',
  icon,
  className = '',
  style = {}
}) => {
  // Get variant color
  const getVariantColor = () => {
    switch (variant) {
      case 'primary': return colors.gold;
      case 'repair': return '#22c55e';
      case 'focus': return '#3b82f6';
      case 'danger': return '#ef4444';
      case 'urgent': return '#dc2626';
      case 'secondary': return colors.muted;
      default: return colors.gold;
    }
  };

  // Get button style based on size
  const getButtonStyle = () => {
    const baseStyle = size === 'sm' ? createCompactStoneButtonStyle() :
                     size === 'lg' ? createStoneButtonStyle({ width: '280px', fontSize: '20px' }) :
                     createSmallStoneButtonStyle();
    
    // Apply variant-specific overrides
    const variantOverrides: Partial<React.CSSProperties> = {};
    if (variant === 'urgent') {
      variantOverrides.animation = 'pulse 1s infinite';
    }
    if (disabled) {
      variantOverrides.opacity = 0.5;
      variantOverrides.cursor = 'not-allowed';
    }

    return {
      ...baseStyle,
      ...variantOverrides,
      ...style
    };
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    handleStoneButtonHover(e, true, getVariantColor());
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    handleStoneButtonHover(e, false);
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      style={getButtonStyle()}
      className={className}
    >
      {icon && <span style={{ marginRight: '8px', display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

// Specialized button components
export const RepairButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton {...props} variant="repair" />
);

export const FocusButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton {...props} variant="focus" />
);

export const EndTurnButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton {...props} variant="danger" />
);

export const ActionButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton {...props} variant="primary" />
);
