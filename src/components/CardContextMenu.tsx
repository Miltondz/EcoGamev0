// src/components/CardContextMenu.tsx

/**
 * Sistema de menú contextual de cartas con opciones de texto
 * 
 * PROBLEMAS RESUELTOS EN v1.2.0:
 * - Menú no clickeable (z-index bajo) → LayerManager integrado
 * - Conflictos con otros elementos UI → Sistema de capas centralizado
 * - Animaciones interfiriendo → Auto-gestión de prioridad visual
 * 
 * Características:
 * - Menú circular con opciones de texto legibles
 * - Efectos hover suaves y responsivos
 * - Sistema de logging completo para debug
 * - Configuración flexible de posición y opciones
 * - Tema visual coherente con el juego
 * - Soporte para animaciones de entrada/salida
 * - Sistema de callbacks para diferentes acciones
 * - LayerManager: Garantiza visibilidad por encima de otros elementos
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Card } from '../engine/types';
import { colors, createCompactStoneButtonStyle } from '../utils/styles';
import { useLayer, GameLayer, layerSystem } from '../engine/LayerManager';
// import { Z_INDEX } from '../constants/zIndex'; // Reemplazado por LayerManager

// Tipos de acciones disponibles en el menú
export type CardActionType = 
  | 'play'      // Usar la carta normalmente
  | 'research'  // Investigar/Enfocar (descarta y roba nueva)
  | 'discard'   // Descartar sin efecto
  | 'sacrifice' // Sacrificar para efecto especial
  | 'cancel';   // Cancelar y cerrar menú

// Configuración de una opción del menú
export interface MenuOption {
  action: CardActionType;
  label: string;           // Texto visible
  description: string;     // Descripción detallada (tooltip)
  color: string;          // Color base del botón
  hoverColor: string;     // Color al hacer hover
  icon?: string;          // Emoji o símbolo opcional
  enabled: boolean;       // Si la opción está disponible
  shortkey?: string;      // Tecla de acceso rápido (ej: "U", "R")
}

// Props del componente
export interface CardContextMenuProps {
  card: Card | null;                             // Carta asociada al menú (puede ser null)
  position: { x: number; y: number };          // Posición del centro del menú
  isVisible: boolean;                           // Si el menú debe mostrarse
  onAction: (action: CardActionType) => void;   // Callback al seleccionar acción
  customOptions?: Partial<MenuOption>[];        // Opciones personalizadas
  radius?: number;                             // Radio del círculo de opciones
  animationDuration?: number;                  // Duración de animaciones (ms)
}

// Configuración predeterminada de opciones
const DEFAULT_OPTIONS: Record<CardActionType, Omit<MenuOption, 'enabled'>> = {
  play: {
    action: 'play',
    label: 'USAR',
    description: 'Jugar la carta y aplicar sus efectos',
    color: '#22c55e',
    hoverColor: '#16a34a',
    icon: '▶',
    shortkey: 'U'
  },
  research: {
    action: 'research',
    label: 'INVESTIGAR',
    description: 'Descartar esta carta y robar una nueva',
    color: '#3b82f6',
    hoverColor: '#2563eb',
    icon: '🔍',
    shortkey: 'R'
  },
  discard: {
    action: 'discard',
    label: 'DESCARTAR',
    description: 'Descartar la carta sin efecto',
    color: '#6b7280',
    hoverColor: '#4b5563',
    icon: '🗑',
    shortkey: 'D'
  },
  sacrifice: {
    action: 'sacrifice',
    label: 'SACRIFICAR',
    description: 'Sacrificar para efecto especial (si disponible)',
    color: '#ef4444',
    hoverColor: '#dc2626',
    icon: '⚔',
    shortkey: 'S'
  },
  cancel: {
    action: 'cancel',
    label: 'CANCELAR',
    description: 'Cerrar menú sin hacer nada',
    color: '#374151',
    hoverColor: '#1f2937',
    icon: '✕',
    shortkey: 'C'
  }
};

/**
 * Componente principal del menú contextual
 * 
 * INTEGRACIÓN LayerManager v1.2.0:
 * - useLayer(GameLayer.CONTEXT_MENU): Hook que garantiza z-index correcto
 * - bringToFront(): Se activa automáticamente cuando el menú se vuelve visible
 * - layerSystem.resolve(): Resuelve conflictos con otros elementos UI
 * 
 * @param card - Carta asociada al menú (null si no hay carta seleccionada)
 * @param position - Coordenadas {x, y} donde mostrar el menú
 * @param isVisible - Estado de visibilidad del menú
 * @param onAction - Callback que maneja las acciones seleccionadas
 * @param radius - Radio del círculo de opciones (default: 120px)
 * @param animationDuration - Duración de animaciones en ms (default: 300ms)
 */
export const CardContextMenu: React.FC<CardContextMenuProps> = ({
  card,
  position,
  isVisible,
  onAction,
  radius = 120,
  animationDuration = 300
}) => {
  // LayerManager Integration - Garantiza z-index correcto
  const { zIndex, bringToFront } = useLayer(GameLayer.CONTEXT_MENU, false);
  
  // Estados locales
  const [hoveredAction, setHoveredAction] = useState<CardActionType | null>(null);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  /**
   * Logger especializado para el menú contextual
   */
  const log = useCallback((level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] 🎯 CardContextMenu`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix}: ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix}: ⚠️ ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix}: ❌ ${message}`, data || '');
        break;
    }
  }, []);

  /**
   * Determina qué opciones mostrar basándose en el contexto de la carta
   */
  const getAvailableOptions = useCallback((): MenuOption[] => {
    if (!card) {
      log('warn', 'No card provided, returning default options');
      return [{ ...DEFAULT_OPTIONS.cancel, enabled: true }];
    }
    
    log('info', `Computing available options for card ${card.rank}${card.suit}`, { 
      cardId: card.id, 
      cardValue: card.value 
    });

    const options: MenuOption[] = [
      { ...DEFAULT_OPTIONS.play, enabled: true },      // Siempre disponible
      { ...DEFAULT_OPTIONS.research, enabled: true },  // Siempre disponible
      { ...DEFAULT_OPTIONS.discard, enabled: true },   // Siempre disponible
      { ...DEFAULT_OPTIONS.sacrifice, enabled: false }, // Solo para cartas especiales
      { ...DEFAULT_OPTIONS.cancel, enabled: true }     // Siempre disponible
    ];

    // Lógica para determinar si sacrifice está disponible
    // TODO: Implementar lógica específica del juego
    const canSacrifice = card.value >= 10; // Por ejemplo, solo cartas altas
    if (canSacrifice) {
      options.find(opt => opt.action === 'sacrifice')!.enabled = true;
      log('info', `Sacrifice option enabled for high-value card (${card.value})`);
    }

    const enabledCount = options.filter(opt => opt.enabled).length;
    log('info', `Generated ${enabledCount} enabled options from ${options.length} total`);

    return options;
  }, [card, log]);

  /**
   * Maneja la selección de una acción
   */
  const handleActionSelect = useCallback((action: CardActionType) => {
    if (!card) {
      log('warn', 'Action selected but no card available', { action });
      onAction(action);
      return;
    }
    
    log('info', `Action selected: ${action}`, { cardId: card.id, position });
    
    setIsAnimatingOut(true);
    
    // Pequeño delay para la animación de salida
    setTimeout(() => {
      onAction(action);
      setIsAnimatingOut(false);
    }, animationDuration / 2);
  }, [card, position, onAction, animationDuration, log]);

  /**
   * Maneja eventos de teclado para shortcuts
   */
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isVisible) return;

    const key = event.key.toUpperCase();
    const options = getAvailableOptions();
    const option = options.find(opt => opt.enabled && opt.shortkey === key);
    
    if (option) {
      log('info', `Keyboard shortcut activated: ${key} -> ${option.action}`);
      handleActionSelect(option.action);
      event.preventDefault();
    }
  }, [isVisible, getAvailableOptions, handleActionSelect, log]);

  // Efectos de ciclo de vida

  /**
   * LayerManager Integration: Trae menú al frente cuando se vuelve visible
   * Configura listeners de teclado cuando el menú es visible
   */
  useEffect(() => {
    if (isVisible) {
      log('info', 'Menu became visible, bringing to front and setting up keyboard listeners');
      
      // CRÍTICO: Traer menú al frente usando LayerManager
      bringToFront();
      
      // Resolver conflictos automáticamente
      layerSystem.resolve('context_menu');
      
      setIsAnimatingIn(true);
      
      // Desactivar animación de entrada después del delay
      const timer = setTimeout(() => setIsAnimatingIn(false), animationDuration);
      
      // Configurar listener de teclado
      document.addEventListener('keydown', handleKeyPress);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyPress);
        log('info', 'Menu hidden, cleaned up keyboard listeners');
      };
    }
  }, [isVisible, animationDuration, handleKeyPress, log, bringToFront]);

  /**
   * Log cuando cambia la carta asociada
   */
  useEffect(() => {
    if (!isVisible) return; // Evitar logs cuando el menú no está visible
    if (!card) {
      log('warn', 'Menu card changed to undefined/null');
      return;
    }
    
    log('info', `Menu card changed`, { 
      newCard: `${card.rank}${card.suit}`, 
      cardId: card.id 
    });
  }, [card, log, isVisible]);

  // Renderizado condicional
  if (!isVisible || !card) {
    return null;
  }

  const availableOptions = getAvailableOptions();
  const enabledOptions = availableOptions.filter(opt => opt.enabled);

  log('info', `Rendering menu with ${enabledOptions.length} enabled options at (${position.x}, ${position.y})`);

  return (
    <>
      {/* Backdrop para cerrar el menú al hacer click fuera */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: zIndex - 1, // LayerManager: Un nivel por debajo del menú principal
          opacity: isAnimatingIn ? 0 : 1,
          transition: `opacity ${animationDuration}ms ease-out`
        }}
        onClick={() => handleActionSelect('cancel')}
      />

      {/* Contenedor principal del menú */}
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: zIndex, // LayerManager: Z-index gestionado centralizadamente
          pointerEvents: 'auto', // Allow all pointer events on container
          transform: `scale(${isAnimatingIn ? 0.5 : isAnimatingOut ? 0.8 : 1})`,
          opacity: isAnimatingIn ? 0 : isAnimatingOut ? 0.5 : 1,
          transition: `all ${animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
          // Force rendering above everything
          isolation: 'isolate',
          willChange: 'transform, opacity'
        }}
      >
        {/* Indicador central */}
        <div
          style={{
            position: 'absolute',
            left: -15,
            top: -15,
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '3px solid #d97706',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#d97706',
            fontWeight: 'bold'
          }}
        >
          {card.rank}
        </div>

        {/* Opciones del menú en círculo */}
        {enabledOptions.map((option, index) => {
          const angle = (index / enabledOptions.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isHovered = hoveredAction === option.action;

          return (
            <button
              key={option.action}
              style={{
                ...createCompactStoneButtonStyle({
                  position: 'absolute',
                  left: x - 70, // Slightly wider for better text fit
                  top: y - 22,  // Slightly taller
                  width: 140,
                  height: 44,
                  fontSize: '11px',
                  padding: '8px 12px',
                  letterSpacing: '0.8px',
                  pointerEvents: 'auto',
                  transform: `scale(${isHovered ? 1.05 : 1}) translateZ(0)`,
                  transition: 'all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  // Override colors based on action type
                  borderColor: isHovered ? option.hoverColor + '88' : option.color + '44',
                  color: isHovered ? option.color : colors.muted
                }),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                setHoveredAction(option.action);
                log('info', `Hovered option: ${option.action}`);
                // Custom hover effect with action-specific colors
                e.currentTarget.style.borderColor = option.color;
                e.currentTarget.style.color = option.color;
                e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 12px 25px rgba(0,0,0,0.7), 0 0 0 1px ${option.color}44`;
              }}
              onMouseLeave={(e) => {
                setHoveredAction(null);
                // Reset to default stone button style
                e.currentTarget.style.borderColor = colors.stone.border;
                e.currentTarget.style.color = colors.muted;
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.6), inset 0 -6px 12px rgba(0,0,0,0.55)';
              }}
              onClick={() => handleActionSelect(option.action)}
              title={`${option.description}${option.shortkey ? ` (Tecla: ${option.shortkey})` : ''}`}
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
              {option.shortkey && (
                <span style={{ 
                  fontSize: '9px', 
                  opacity: 0.7,
                  marginLeft: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  color: colors.gold,
                  padding: '2px 4px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 'bold'
                }}>
                  {option.shortkey}
                </span>
              )}
            </button>
          );
        })}

        {/* Información de la carta en la parte inferior */}
        <div
          style={{
            position: 'absolute',
            left: -100,
            top: radius + 40,
            width: 200,
            textAlign: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '8px 12px',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div>{card.rank} de {card.suit}</div>
          {hoveredAction && (
            <div style={{ 
              fontSize: '11px', 
              marginTop: '4px', 
              opacity: 0.9,
              fontWeight: 'normal'
            }}>
              {availableOptions.find(opt => opt.action === hoveredAction)?.description}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
