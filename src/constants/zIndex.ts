/**
 * Sistema de Z-Index organizado para prevenir conflictos visuales
 * Basado en sistema de capas para garantizar orden correcto
 * 
 * PROBLEMA RESUELTO: Menú contextual y botones no clickeables
 * SOLUCIÓN: Capas bien definidas con espacios suficientes
 */

export const Z_INDEX = {
  // Background and Layout (0-99)
  BACKGROUND: 0,
  GAME_LAYOUT: 10,
  FRAME_BORDER: 50,
  
  // Game Content (100-999) - Mantenemos PIXI en rango bajo
  PIXI_CANVAS: 100,
  CARD_BASE: 200,
  CARD_SELECTED: 250,
  PARTICLE_EFFECTS: 300,
  
  // UI Elements (1000-4999) - Incrementamos significativamente
  UI_BASE: 1000,
  BUTTONS: 1500,        // CRÍTICO: Botones deben estar por encima de PIXI
  TOOLTIPS: 2000,
  NOTIFICATIONS: 2500,
  
  // Visual Effects (5000-7999) - Mantenemos separados
  VFX_LAYER: 5000,
  SCREEN_EFFECTS: 6000,
  TRANSITIONS: 7000,
  
  // Interactive UI (8000-8999) - NUEVA CAPA CRÍTICA
  UI_INTERACTIVE: 8000,   // Para elementos que DEBEN ser clickeables
  UI_OVERLAY: 8500,       // Para overlays de UI
  
  // Modals and Popups (9000-9799)
  MODAL_BACKDROP: 9000,
  MODAL_CONTENT: 9100,
  EVENT_MODAL: 9200,
  NARRATIVE_MODAL: 9300,
  
  // Context Menus (9800-9899) - MÁS ALTO que antes
  CONTEXT_MENU: 9800,     // CRÍTICO: Debe estar sobre TODO
  
  // Critical UI (9900-9999)
  CRITICAL_ALERTS: 9950,
  EMERGENCY_UI: 9980,
  
  // Debug and Development (10000+)
  DEBUG_TOOLS: 10000,
  DEV_OVERLAY: 10500
} as const;

/**
 * Utility para obtener un z-index relativo a una base
 */
export const getZIndex = (base: keyof typeof Z_INDEX, offset: number = 0): number => {
  return Z_INDEX[base] + offset;
};

/**
 * Validar que un z-index no exceda el máximo recomendado
 */
export const validateZIndex = (value: number): number => {
  if (value > Z_INDEX.DEV_OVERLAY) {
    console.warn(`Z-Index ${value} excede el máximo recomendado. Usando DEV_OVERLAY.`);
    return Z_INDEX.DEV_OVERLAY;
  }
  return value;
};

export type ZIndexKey = keyof typeof Z_INDEX;
