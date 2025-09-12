// UI Constants - Centralized configuration
export const MODAL_CONFIG = {
  OPACITY: {
    DEFAULT: 0.7,
    HIGH_VISIBILITY: 0.92
  },
  DIMENSIONS: {
    CHAPTER_SELECTION: { width: '800px', height: '420px' },
    PROFILE: { width: '950px', height: '520px' },
    SCENARIOS: { width: '900px', height: '500px' },
    CONFIG: { width: '750px', height: '450px' }
  },
  PADDING: {
    DEFAULT: '20px',
    COMPACT: '12px'
  },
  Z_INDEX: {
    MODAL: 15,
    OVERLAY: 1000
  }
} as const;

export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: '0.2s',
    NORMAL: '0.3s',
    SLOW: '0.5s'
  },
  EASING: {
    DEFAULT: 'ease',
    SMOOTH: 'ease-in-out',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
} as const;

export const SCROLL_CONFIG = {
  MAX_HEIGHT: {
    CHAPTER_LIST: '320px',
    MODAL_CONTENT: '60vh'
  },
  SCROLLBAR: {
    WIDTH: '8px',
    TRACK_COLOR: 'rgba(15, 23, 42, 0.3)',
    THUMB_COLOR: 'rgba(182, 149, 82, 0.5)',
    THUMB_HOVER: 'rgba(182, 149, 82, 0.7)'
  }
} as const;
