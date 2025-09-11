// Font and Style Utilities for "Crónicas del Abismo"
// Based on the reference design from menu.html

export const fonts = {
  // Cinzel for titles and important headings
  title: '"Cinzel", serif',
  // Roboto Condensed for body text and UI elements
  body: '"Roboto Condensed", sans-serif'
} as const;

export const colors = {
  gold: '#b69552',
  muted: '#cfc6b9',
  mutedAlpha: 'rgba(207,198,179,0.9)',
  background: 'rgba(255,255,255,0.06)',
  stone: {
    light: 'rgba(255,255,255,0.02)',
    dark: 'rgba(0,0,0,0.28)',
    border: 'rgba(255,255,255,0.04)',
    borderHover: 'rgba(180,140,80,0.18)'
  },
  warning: '#d97706',
  warningMuted: '#e5b880'
} as const;

// Typography styles
export const textStyles = {
  // Main saga title (very large)
  sagaTitle: {
    fontFamily: fonts.title,
    fontWeight: 900,
    fontSize: '64px',
    letterSpacing: '6px',
    color: colors.gold,
    textTransform: 'uppercase' as const,
    textShadow: '0 6px 18px rgba(0,0,0,0.8)',
    lineHeight: 1
  },
  
  // Book/Chapter title (large)
  bookTitle: {
    fontFamily: fonts.title,
    fontWeight: 900,
    fontSize: '48px',
    color: colors.gold,
    textShadow: '0 10px 30px rgba(0,0,0,0.85)',
    margin: '0 0 6px 0'
  },
  
  // Section headings (medium)
  sectionTitle: {
    fontFamily: fonts.title,
    fontWeight: 700,
    fontSize: '32px',
    color: colors.gold,
    textShadow: '0 4px 12px rgba(0,0,0,0.8)',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px'
  },
  
  // Subsection headings (smaller)
  subsectionTitle: {
    fontFamily: fonts.title,
    fontWeight: 600,
    fontSize: '24px',
    color: colors.gold,
    textShadow: '0 2px 8px rgba(0,0,0,0.7)',
    letterSpacing: '1px'
  },
  
  // Small headings/labels
  smallTitle: {
    fontFamily: fonts.title,
    fontWeight: 600,
    fontSize: '18px',
    color: colors.gold,
    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
    letterSpacing: '0.5px'
  },
  
  // Body text (normal)
  body: {
    fontFamily: fonts.body,
    fontSize: '16px',
    color: colors.muted,
    lineHeight: 1.5
  },
  
  // Small body text
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: '14px',
    color: colors.mutedAlpha,
    lineHeight: 1.4
  },
  
  // UI labels and controls
  label: {
    fontFamily: fonts.body,
    fontSize: '13px',
    letterSpacing: '2px',
    color: colors.mutedAlpha,
    textTransform: 'uppercase' as const,
    fontWeight: 500
  },
  
  // Taglines and subtle text
  tagline: {
    fontFamily: fonts.body,
    fontSize: '13px',
    letterSpacing: '2px',
    color: colors.mutedAlpha,
    fontStyle: 'italic' as const
  }
} as const;

// Button styles
export const createStoneButtonStyle = (overrides?: Partial<React.CSSProperties>) => ({
  background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.28))',
  border: '1px solid rgba(255,255,255,0.04)',
  color: colors.muted,
  fontFamily: fonts.body,
  fontWeight: 700,
  padding: '14px 18px',
  borderRadius: '10px',
  fontSize: '18px',
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(0,0,0,0.6), inset 0 -6px 12px rgba(0,0,0,0.55)',
  position: 'relative' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1.6px',
  transition: 'all 0.3s ease',
  width: '360px',
  ...overrides
});

export const createSmallStoneButtonStyle = (overrides?: Partial<React.CSSProperties>) => ({
  ...createStoneButtonStyle(),
  fontSize: '14px',
  padding: '10px 16px',
  width: '200px',
  letterSpacing: '1.2px',
  ...overrides
});

export const createCompactStoneButtonStyle = (overrides?: Partial<React.CSSProperties>) => ({
  ...createStoneButtonStyle(),
  fontSize: '12px',
  padding: '8px 12px',
  width: 'auto',
  minWidth: '120px',
  letterSpacing: '1px',
  ...overrides
});

// Button hover handlers
export const handleStoneButtonHover = (e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean, color: string = colors.gold) => {
  if (isEnter) {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.7), inset 0 -6px 12px rgba(0,0,0,0.5)';
    e.currentTarget.style.color = color;
    e.currentTarget.style.borderColor = color === colors.gold ? colors.stone.borderHover : 'rgba(217,119,6,0.18)';
  } else {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.6), inset 0 -6px 12px rgba(0,0,0,0.55)';
    e.currentTarget.style.color = colors.muted;
    e.currentTarget.style.borderColor = colors.stone.border;
  }
};

// Panel/Container styles
export const panelStyles = {
  // Main container panels
  primary: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8))',
    border: `2px solid ${colors.stone.border}`,
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)'
  },
  
  // Secondary panels
  secondary: {
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.8))',
    border: `1px solid ${colors.stone.border}`,
    borderRadius: '8px',
    backdropFilter: 'blur(6px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)'
  },
  
  // HUD elements
  hud: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
    border: `1px solid ${colors.stone.border}`,
    borderRadius: '6px',
    backdropFilter: 'blur(6px)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.5)'
  }
} as const;

// Utility functions for responsive sizing
export const getResponsiveTitleSize = (baseSize: number, containerWidth: number = 1280) => {
  const scaleFactor = Math.min(containerWidth / 1280, 1);
  return Math.max(baseSize * scaleFactor, baseSize * 0.7); // Min 70% of original size
};

export const getResponsiveSpacing = (baseSpacing: number, containerWidth: number = 1280) => {
  const scaleFactor = Math.min(containerWidth / 1280, 1);
  return Math.max(baseSpacing * scaleFactor, baseSpacing * 0.8); // Min 80% of original spacing
};
