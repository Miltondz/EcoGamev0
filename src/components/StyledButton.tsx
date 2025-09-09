// src/components/StyledButton.tsx

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

interface StyledButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'repair' | 'focus';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const StyledButton: React.FC<StyledButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'md',
  icon
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out"
      });
    }
    
    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0.6,
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      });
    }
    
    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleMouseDown = () => {
    if (disabled) return;
    
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out"
      });
    }
  };

  const handleMouseUp = () => {
    if (disabled) return;
    
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.1,
        ease: "power2.out"
      });
    }
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-gradient-to-r from-amber-600 to-amber-700',
          bgHover: 'hover:from-amber-500 hover:to-amber-600',
          border: 'border-amber-500/50',
          text: 'text-amber-100',
          glow: 'shadow-amber-500/50',
          glowColor: 'bg-amber-400'
        };
      case 'secondary':
        return {
          bg: 'bg-gradient-to-r from-slate-600 to-slate-700',
          bgHover: 'hover:from-slate-500 hover:to-slate-600',
          border: 'border-slate-500/50',
          text: 'text-slate-100',
          glow: 'shadow-slate-500/50',
          glowColor: 'bg-slate-400'
        };
      case 'danger':
        return {
          bg: 'bg-gradient-to-r from-red-600 to-red-700',
          bgHover: 'hover:from-red-500 hover:to-red-600',
          border: 'border-red-500/50',
          text: 'text-red-100',
          glow: 'shadow-red-500/50',
          glowColor: 'bg-red-400'
        };
      case 'repair':
        return {
          bg: 'bg-gradient-to-r from-green-600 to-green-700',
          bgHover: 'hover:from-green-500 hover:to-green-600',
          border: 'border-green-500/50',
          text: 'text-green-100',
          glow: 'shadow-green-500/50',
          glowColor: 'bg-green-400'
        };
      case 'focus':
        return {
          bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
          bgHover: 'hover:from-blue-500 hover:to-blue-600',
          border: 'border-blue-500/50',
          text: 'text-blue-100',
          glow: 'shadow-blue-500/50',
          glowColor: 'bg-blue-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-amber-600 to-amber-700',
          bgHover: 'hover:from-amber-500 hover:to-amber-600',
          border: 'border-amber-500/50',
          text: 'text-amber-100',
          glow: 'shadow-amber-500/50',
          glowColor: 'bg-amber-400'
        };
    }
  };

  // Size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const styles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <div className="relative inline-block">
      {/* Glow effect */}
      <div
        ref={glowRef}
        className={`absolute inset-0 ${styles.glowColor} rounded-lg blur-md opacity-0 transition-all duration-300`}
      />
      
      {/* Button */}
      <motion.button
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
        className={`
          relative z-10 ${sizeStyles} rounded-lg font-semibold
          ${styles.bg} ${styles.bgHover} ${styles.text} ${styles.border}
          border-2 shadow-lg ${styles.glow}
          transition-all duration-300 ease-out
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${disabled ? '' : 'hover:shadow-xl active:shadow-md'}
          flex items-center justify-center space-x-2
        `}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        <span>{children}</span>
        
        {/* Inner highlight */}
        <div className="absolute inset-0.5 bg-white/10 rounded-md pointer-events-none" />
      </motion.button>
    </div>
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
