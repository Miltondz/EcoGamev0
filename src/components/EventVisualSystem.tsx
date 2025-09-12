// src/components/EventVisualSystem.tsx

import React, { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import type { Card, DynamicEvent } from '../engine/types';
import { pixiScreenEffects } from '../engine/PixiScreenEffects';
import type { ScreenEffectType } from '../engine/PixiScreenEffects';
import { colors, textStyles, panelStyles, createStoneButtonStyle, handleStoneButtonHover } from '../utils/styles';
import { assetManager } from '../engine/AssetManager';
import { Z_INDEX } from '../constants/zIndex';

interface EventVisualSystemProps {
  isVisible: boolean;
  eventCard: Card | null;
  event: DynamicEvent | null;
  onClose: () => void;
}

// Configuración de tipos de presentación por evento
const EVENT_VISUAL_CONFIG: Record<string, {
  presentationType: 'card' | 'image' | 'gif' | 'video';
  screenEffect: ScreenEffectType;
  duration?: number;
  intensity?: 'low' | 'medium' | 'high';
}> = {
  // SPADES - Eventos Negativos/Peligrosos
  '2S': { presentationType: 'card', screenEffect: 'sparks' }, // Fallo del Sistema
  '3S': { presentationType: 'card', screenEffect: 'static' }, // Ruido Blanco
  '4S': { presentationType: 'card', screenEffect: 'glitch' }, // Sombra Fugaz
  '5S': { presentationType: 'card', screenEffect: 'shake', intensity: 'low' }, // Golpe Metálico
  '6S': { presentationType: 'card', screenEffect: 'sparks' }, // Herramienta Rota
  '7S': { presentationType: 'card', screenEffect: 'darkness', duration: 2000 }, // Corte de Energía
  '8S': { presentationType: 'image', screenEffect: 'corruption' }, // Corrosión Acelerada
  '9S': { presentationType: 'card', screenEffect: 'lightning', intensity: 'medium' }, // Sistema Comprometido
  '10S': { presentationType: 'image', screenEffect: 'corruption', intensity: 'high' }, // El Vacío Llama
  'JS': { presentationType: 'gif', screenEffect: 'glitch', intensity: 'high' }, // Aparición
  'QS': { presentationType: 'card', screenEffect: 'shake', intensity: 'high' }, // Brecha en el Casco
  'KS': { presentationType: 'video', screenEffect: 'energy', intensity: 'high' }, // Sobrecarga del Núcleo
  'AS': { presentationType: 'video', screenEffect: 'corruption', intensity: 'high' }, // Presencia Directa

  // HEARTS - Eventos Positivos/Curativos
  '2H': { presentationType: 'card', screenEffect: 'glow', intensity: 'low' }, // Recuerdo Agridulce
  '3H': { presentationType: 'card', screenEffect: 'glow' }, // Voluntad Férrea
  '4H': { presentationType: 'card', screenEffect: 'none' }, // Pequeño Hallazgo
  '5H': { presentationType: 'image', screenEffect: 'fog', intensity: 'low' }, // Un Momento de Calma
  '6H': { presentationType: 'card', screenEffect: 'glow' }, // Determinación
  '7H': { presentationType: 'image', screenEffect: 'glow', intensity: 'medium' }, // Suministros Médicos
  '8H': { presentationType: 'card', screenEffect: 'energy', intensity: 'low' }, // Plan de Contingencia
  '9H': { presentationType: 'image', screenEffect: 'energy' }, // Adrenalina
  '10H': { presentationType: 'gif', screenEffect: 'glow', intensity: 'high' }, // Esperanza
  'JH': { presentationType: 'video', screenEffect: 'energy', intensity: 'medium' }, // Instinto de Supervivencia
  'QH': { presentationType: 'image', screenEffect: 'glow', intensity: 'high' }, // Lucidez Absoluta
  'KH': { presentationType: 'video', screenEffect: 'energy', intensity: 'high' }, // Epifanía
  'AH': { presentationType: 'video', screenEffect: 'glow', intensity: 'high' }, // Momento Heroico

  // CLUBS - Eventos Técnicos/Información
  '2C': { presentationType: 'card', screenEffect: 'glitch' }, // Dato Corrupto
  '3C': { presentationType: 'card', screenEffect: 'static' }, // Pista Falsa
  '4C': { presentationType: 'card', screenEffect: 'sparks' }, // Circuito Quemado
  '5C': { presentationType: 'image', screenEffect: 'glitch', intensity: 'medium' }, // Registro de Datos
  '6C': { presentationType: 'card', screenEffect: 'energy', intensity: 'low' }, // Patrón Anómalo
  '7C': { presentationType: 'image', screenEffect: 'glow', intensity: 'low' }, // Diagrama Útil
  '8C': { presentationType: 'card', screenEffect: 'static', intensity: 'high' }, // Frecuencia Extraña
  '9C': { presentationType: 'card', screenEffect: 'glitch' }, // Mensaje Oculto
  '10C': { presentationType: 'gif', screenEffect: 'lightning', intensity: 'high' }, // Fallo en Cascada
  'JC': { presentationType: 'video', screenEffect: 'corruption', intensity: 'high' }, // Conocimiento Prohibido
  'QC': { presentationType: 'image', screenEffect: 'energy', intensity: 'medium' }, // Análisis Exitoso
  'KC': { presentationType: 'video', screenEffect: 'corruption', intensity: 'high' }, // La Verdad
  'AC': { presentationType: 'video', screenEffect: 'energy', intensity: 'high' }, // Control Manual

  // DIAMONDS - Eventos de Recursos/Hallazgos
  '2D': { presentationType: 'card', screenEffect: 'corruption' }, // Recursos Contaminados
  '3D': { presentationType: 'card', screenEffect: 'fog' }, // Almacén Vacío
  '4D': { presentationType: 'card', screenEffect: 'glow', intensity: 'low' }, // Raciones de Emergencia
  '5D': { presentationType: 'card', screenEffect: 'glow' }, // Componentes Útiles
  '6D': { presentationType: 'image', screenEffect: 'glitch', intensity: 'low' }, // Dilema
  '7D': { presentationType: 'image', screenEffect: 'glow', intensity: 'medium' }, // Escondite Secreto
  '8D': { presentationType: 'gif', screenEffect: 'shake', intensity: 'medium' }, // Trampa
  '9D': { presentationType: 'card', screenEffect: 'sparks', intensity: 'low' }, // Reciclaje
  '10D': { presentationType: 'image', screenEffect: 'glow', intensity: 'high' }, // Suministros Abundantes
  'JD': { presentationType: 'gif', screenEffect: 'shake', intensity: 'medium' }, // Decisión Arriesgada
  'QD': { presentationType: 'image', screenEffect: 'energy', intensity: 'medium' }, // Hallazgo Inesperado
  'KD': { presentationType: 'video', screenEffect: 'glow', intensity: 'high' }, // El Arsenal
  'AD': { presentationType: 'video', screenEffect: 'glow', intensity: 'high' } // La Reserva del Capitán
};

export const EventVisualSystem: React.FC<EventVisualSystemProps> = ({
  isVisible,
  eventCard,
  event,
  onClose
}) => {
  const [showContent, setShowContent] = useState(false);
  const [, setCurrentEffect] = useState<string>('none');

  const config = eventCard ? EVENT_VISUAL_CONFIG[eventCard.id] || { presentationType: 'card' as const, screenEffect: 'none' as const } : null;

  useEffect(() => {
    if (isVisible && eventCard && event && config) {
      // Iniciar efectos de pantalla
      setCurrentEffect(config.screenEffect);
      
      // Timeline de animación
      const timeline = gsap.timeline();
      
      // 1. Efecto de pantalla inicial
      applyScreenEffect(config.screenEffect, config.intensity || 'medium', config.duration);
      
      // 2. Mostrar contenido después de un breve delay
      timeline.call(() => setShowContent(true), [], 0.5);
      
      // NO auto-cerrar - esperamos que el usuario haga clic en OK
    }
  }, [isVisible, eventCard, event, config]);

  const applyScreenEffect = async (effect: ScreenEffectType, intensity: 'low' | 'medium' | 'high' = 'medium', duration?: number) => {
    const effectDuration = duration || 3000;
    
    // Usar el sistema PixiJS para efectos de pantalla
    if (effect !== 'none') {
      try {
        await pixiScreenEffects.playEffect({
          type: effect,
          intensity,
          duration: effectDuration
        });
        console.log(`🎆 EventVisualSystem: Efecto PixiJS ${effect} ejecutado`);
      } catch (error) {
        console.error(`⚠️ EventVisualSystem: Error ejecutando efecto ${effect}:`, error);
      }
    }
  };


  if (!isVisible || !eventCard || !event || !config) return null;

  return (
    <>
      {/* Main Modal - Con z-index muy alto para estar por encima de todo */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: Z_INDEX.EVENT_MODAL,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Backdrop - NO clickeable para forzar uso del botón OK */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {showContent && (
          <EventContentRenderer 
            presentationType={config.presentationType}
            eventCard={eventCard}
            event={event}
            onClose={onClose}
          />
        )}
      </div>
    </>
  );
};

// Componente para renderizar el contenido según el tipo
const EventContentRenderer: React.FC<{
  presentationType: 'card' | 'image' | 'gif' | 'video';
  eventCard: Card;
  event: DynamicEvent;
  onClose: () => void;
}> = ({ presentationType, eventCard, event, onClose }) => {
  
  // Utility functions for card rendering (currently unused)
  // const getSuitSymbol = (suit: string) => {
  //   switch (suit) {
  //     case 'Spades': return '♠';
  //     case 'Hearts': return '♥';
  //     case 'Diamonds': return '♦';
  //     case 'Clubs': return '♣';
  //     default: return '';
  //   }
  // };

  // const getSuitColor = (suit: string) => {
  //   return ['Hearts', 'Diamonds'].includes(suit) ? '#ef4444' : '#1f2937';
  // };

  switch (presentationType) {
    case 'card':
      return <CardPresentation eventCard={eventCard} event={event} onClose={onClose} />;
    
    case 'image':
      return <ImagePresentation eventCard={eventCard} event={event} onClose={onClose} />;
    
    case 'gif':
      return <GifPresentation eventCard={eventCard} event={event} onClose={onClose} />;
    
    case 'video':
      return <VideoPresentation eventCard={eventCard} event={event} onClose={onClose} />;
    
    default:
      return <CardPresentation eventCard={eventCard} event={event} onClose={onClose} />;
  }
};

// Componentes de presentación específicos
const CardPresentation: React.FC<{
  eventCard: Card;
  event: DynamicEvent;
  onClose: () => void;
}> = ({ eventCard, event, onClose }) => {
  const [cardImageSrc, setCardImageSrc] = useState<string>('');
  
  useEffect(() => {
    /**
     * Carga la imagen del evento con sistema de fallback mejorado
     * Implementa logging completo para debug de carga de imágenes
     */
    const loadEventImage = async () => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const logPrefix = `[${timestamp}] 🎭 EventVisualSystem.loadEventImage`;
      
      console.log(`${logPrefix}: Loading image for event card ${eventCard.id}`);
      
      try {
        // Primero intentar imagen de evento específica
        const eventImagePath = await assetManager.getEventImagePath(eventCard.id);
        console.log(`${logPrefix}: Event image path resolved: ${eventImagePath}`);
        
        // Validar que la imagen realmente existe
        const testImg = new Image();
        
        await new Promise((resolve, reject) => {
          testImg.onload = () => {
            console.log(`${logPrefix}: ✅ Event image successfully loaded from: ${eventImagePath}`);
            setCardImageSrc(eventImagePath);
            resolve(testImg);
          };
          
          testImg.onerror = () => {
            console.warn(`${logPrefix}: ⚠️ Event image failed to load: ${eventImagePath}`);
            reject(new Error(`Failed to load event image: ${eventImagePath}`));
          };
          
          testImg.src = eventImagePath;
        });
        
      } catch (eventError) {
        console.warn(`${logPrefix}: Event image failed, trying card deck image`, eventError);
        
        // Fallback 1: Intentar imagen de carta del deck
        try {
          const deckImagePath = `/images/decks/default/${eventCard.imageFile}`;
          console.log(`${logPrefix}: Trying deck image: ${deckImagePath}`);
          
          const testDeckImg = new Image();
          
          await new Promise((resolve, reject) => {
            testDeckImg.onload = () => {
              console.log(`${logPrefix}: ✅ Deck image successfully loaded from: ${deckImagePath}`);
              setCardImageSrc(deckImagePath);
              resolve(testDeckImg);
            };
            
            testDeckImg.onerror = () => {
              console.warn(`${logPrefix}: ⚠️ Deck image failed to load: ${deckImagePath}`);
              reject(new Error(`Failed to load deck image: ${deckImagePath}`));
            };
            
            testDeckImg.src = deckImagePath;
          });
          
        } catch (deckError) {
          console.warn(`${logPrefix}: Deck image failed, trying AssetManager card path`, deckError);
          
          // Fallback 2: AssetManager con fallbacks propios
          try {
            const cardImagePath = await assetManager.getCardImagePath(eventCard.id);
            console.log(`${logPrefix}: ✅ AssetManager provided card image: ${cardImagePath}`);
            setCardImageSrc(cardImagePath);
          } catch (assetError) {
            console.error(`${logPrefix}: ❌ All image loading methods failed for ${eventCard.id}`);
            console.error(`${logPrefix}: Event error:`, eventError);
            console.error(`${logPrefix}: Deck error:`, deckError);
            console.error(`${logPrefix}: Asset error:`, assetError);
            
            // Último recurso: imagen vacía (se mostrará fallback visual)
            setCardImageSrc('');
          }
        }
      }
    };
    
    loadEventImage();
  }, [eventCard.id, eventCard.imageFile]);
  
  return (
  <div style={{
    background: 'rgba(30, 41, 59, 0.7)', // 70% opacity standard
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: `1px solid rgba(217, 119, 6, 0.3)`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
    position: 'relative',
    width: '1000px',
    height: '300px',
    margin: '0 auto',
    padding: '20px 32px',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  }}>
    {/* Efectos glassmorphism */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      pointerEvents: 'none'
    }} />
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '2px',
      background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
      pointerEvents: 'none'
    }} />
    
    {/* Imagen de la carta del evento */}
    <div style={{
      width: '160px',
      height: '224px',
      borderRadius: '8px',
      border: `2px solid ${colors.gold}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {cardImageSrc ? (
        <img 
          src={cardImageSrc}
          alt={`Event ${eventCard.id}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            position: 'relative',
            zIndex: 2
          }}
          onLoad={() => {
            console.log(`🎨 Event image successfully loaded and displayed: ${cardImageSrc}`);
          }}
          onError={(_e) => {
            console.warn(`❌ Event image failed to load: ${cardImageSrc}`);
            setCardImageSrc(''); // Clear the src to show fallback
          }}
        />
      ) : (
        /* Fallback cuando no hay imagen disponible */
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #1e293b, #374151)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}>
          <EventCardDisplay eventCard={eventCard} size="small" />
        </div>
      )}
    </div>
    
    {/* Contenido del evento */}
    <div style={{ flex: 1 }}>
      <EventDetails event={event} />
      <OKButton onClose={onClose} />
    </div>
  </div>
  );
};

const ImagePresentation: React.FC<{
  eventCard: Card;
  event: DynamicEvent;
  onClose: () => void;
}> = ({ eventCard, event, onClose }) => (
  <div style={{
    background: 'rgba(30, 41, 59, 0.7)', // 70% opacity standard
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: `1px solid rgba(217, 119, 6, 0.3)`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
    position: 'relative',
    width: '1000px',
    height: '300px',
    margin: '0 auto',
    overflow: 'hidden',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center'
  }}>
    {/* Imagen del evento - lado izquierdo */}
    <div style={{
      width: '200px',
      height: '260px',
      borderRadius: '8px',
      border: `2px solid ${colors.gold}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      flexShrink: 0,
      position: 'relative',
      background: 'linear-gradient(135deg, #581c87 0%, #1f2937 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <img 
        src={`/images/decks/default/${eventCard.imageFile}`}
        alt={`Event ${eventCard.id}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        onError={(e) => {
          console.warn(`❌ Event image failed to load: /images/decks/default/${eventCard.imageFile}`);
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* Placeholder cuando no carga la imagen */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎭</div>
        <div style={{
          ...textStyles.bodySmall,
          color: colors.mutedAlpha
        }}>Imagen: {eventCard.imageFile}</div>
      </div>
    </div>
    
    {/* Contenido del evento - lado derecho */}
    <div style={{ flex: 1, padding: '0 24px' }}>
      <EventDetails event={event} />
      <OKButton onClose={onClose} />
    </div>
  </div>
);

const GifPresentation: React.FC<{
  eventCard: Card;
  event: DynamicEvent;
  onClose: () => void;
}> = ({ eventCard, event, onClose }) => {
  const [animating, setAnimating] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.85)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      border: `1px solid rgba(217, 119, 6, 0.3)`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
      position: 'relative',
      width: '1000px',
      height: '300px',
      margin: '0 auto',
      overflow: 'hidden',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* GIF del evento - lado izquierdo */}
      <div style={{
        width: '200px',
        height: '260px',
        borderRadius: '8px',
        border: `2px solid ${colors.gold}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: animating ? 1 : 0.8,
        transition: 'opacity 0.5s ease',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <img 
          src={`/images/decks/default/${eventCard.imageFile.replace('.png', '.gif')}`}
          alt={`Event GIF ${eventCard.id}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          onError={(e) => {
            console.warn(`❌ Event GIF failed to load, trying static image: /images/decks/default/${eventCard.imageFile}`);
            (e.target as HTMLImageElement).src = `/images/decks/default/${eventCard.imageFile}`;
            (e.target as HTMLImageElement).onerror = () => {
              console.warn(`❌ Event static fallback failed`);
              (e.target as HTMLImageElement).style.display = 'none';
            };
          }}
        />
        {/* Placeholder cuando no carga el GIF */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '8px',
            transform: animating ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.5s ease'
          }}>⚡</div>
          <div style={{
            ...textStyles.bodySmall,
            color: colors.mutedAlpha
          }}>GIF: {eventCard.imageFile.replace('.png', '.gif')}</div>
        </div>
      </div>
      
      {/* Contenido del evento - lado derecho */}
      <div style={{ flex: 1, padding: '0 24px' }}>
        <EventDetails event={event} />
        <OKButton onClose={onClose} />
      </div>
    </div>
  );
};

const VideoPresentation: React.FC<{
  eventCard: Card;
  event: DynamicEvent;
  onClose: () => void;
}> = ({ eventCard, event, onClose }) => {
  const [pulse, setPulse] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.85)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      border: `1px solid rgba(217, 119, 6, 0.3)`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
      position: 'relative',
      width: '1000px',
      height: '300px',
      margin: '0 auto',
      overflow: 'hidden',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* Video del evento - lado izquierdo */}
      <div style={{
        width: '280px',
        height: '260px',
        borderRadius: '8px',
        backgroundImage: `url(/images/scenarios/default/events/${eventCard.imageFile.replace('.png', '.mp4')}), url(/images/scenarios/default/events/missing-event.svg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: `2px solid ${colors.gold}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #dc2626 0%, #000000 50%, #7c3aed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Placeholder y controles de video */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '12px',
            opacity: pulse ? 1 : 0.6,
            transition: 'opacity 1s ease'
          }}>🎬</div>
          <div style={{
            ...textStyles.bodySmall,
            color: colors.mutedAlpha
          }}>Video: {eventCard.imageFile.replace('.png', '.mp4')}</div>
        </div>
        
        {/* Controles de video simulados */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '12px',
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: colors.gold,
            borderRadius: '50%'
          }}></div>
          <div style={{
            width: '80px',
            height: '3px',
            backgroundColor: '#4b5563',
            borderRadius: '2px',
            position: 'relative'
          }}>
            <div style={{
              width: '20px',
              height: '3px',
              backgroundColor: colors.gold,
              borderRadius: '2px'
            }}></div>
          </div>
          <span style={{
            fontSize: '10px',
            color: colors.muted
          }}>0:15</span>
        </div>
      </div>
      
      {/* Contenido del evento - lado derecho */}
      <div style={{ flex: 1, padding: '0 24px' }}>
        <EventDetails event={event} />
        <OKButton onClose={onClose} />
      </div>
    </div>
  );
};

// Componentes auxiliares
const EventCardDisplay: React.FC<{
  eventCard: Card;
  size?: 'normal' | 'small';
}> = ({ eventCard, size = 'normal' }) => {
  const isSmall = size === 'small';
  const cardWidth = isSmall ? 64 : 128;
  const cardHeight = isSmall ? 80 : 176;
  const fontSize = isSmall ? '12px' : '20px';
  const symbolSize = isSmall ? '18px' : '48px';

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'Spades': return '♠';
      case 'Hearts': return '♥';
      case 'Diamonds': return '♦';
      case 'Clubs': return '♣';
      default: return '';
    }
  };

  const getSuitColor = (suit: string) => {
    return ['Hearts', 'Diamonds'].includes(suit) ? '#dc2626' : '#1f2937';
  };

  return (
    <div style={{
      width: `${cardWidth}px`,
      height: `${cardHeight}px`,
      borderRadius: '8px',
      border: `2px solid ${colors.gold}`,
      backgroundColor: '#ffffff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '4px',
        left: '4px',
        right: '4px',
        bottom: '4px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          fontSize,
          fontWeight: 'bold',
          color: getSuitColor(eventCard.suit),
          fontFamily: 'serif'
        }}>
          {eventCard.rank}{getSuitSymbol(eventCard.suit)}
        </div>
        {!isSmall && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: symbolSize,
              color: getSuitColor(eventCard.suit)
            }}>
              {getSuitSymbol(eventCard.suit)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EventDetails: React.FC<{ event: DynamicEvent }> = ({ event }) => (
  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
    <h3 style={{
      ...textStyles.subsectionTitle,
      marginBottom: '16px'
    }}>{event.event}</h3>
    <p style={{
      ...textStyles.body,
      fontStyle: 'italic',
      lineHeight: 1.6,
      marginBottom: '20px'
    }}>"{event.flavor}"</p>
    {event.effects && event.effects.length > 0 && (
      <div style={{
        ...panelStyles.secondary,
        marginTop: '16px',
        padding: '16px'
      }}>
        <div style={{
          ...textStyles.label,
          color: colors.gold,
          marginBottom: '8px'
        }}>EFECTOS:</div>
        {event.effects.map((effect, index) => (
          <div key={index} style={{
            ...textStyles.bodySmall,
            marginBottom: '4px'
          }}>
            {getEffectDescription(effect)}
          </div>
        ))}
      </div>
    )}
  </div>
);

const OKButton: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    marginTop: '24px'
  }}>
    <button
      style={createStoneButtonStyle({ width: '200px' })}
      onMouseEnter={(e) => handleStoneButtonHover(e, true)}
      onMouseLeave={(e) => handleStoneButtonHover(e, false)}
      onClick={onClose}
    >
      Continuar
    </button>
  </div>
);

// Efectos de pantalla ahora manejados por PixiScreenEffects

// Helper para describir efectos
function getEffectDescription(effect: any): string {
  switch (effect.type) {
    case 'DEAL_DAMAGE':
      const target = effect.target === 'PLAYER' ? 'ti' : 'el Eco';
      const stat = effect.targetStat === 'PV' ? 'Salud' : 'Cordura';
      return `${target} ${effect.target === 'PLAYER' ? 'pierdes' : 'pierde'} ${effect.value} ${stat}`;
    case 'HEAL_STAT':
      const healStat = effect.targetStat === 'PV' ? 'Salud' : 'Cordura';
      return `Recuperas ${effect.value} ${healStat}`;
    case 'DRAW_CARDS':
      return `Robas ${effect.value} carta${effect.value > 1 ? 's' : ''}`;
    case 'DISCARD_CARDS':
      return `Pierdes ${effect.value} carta${effect.value > 1 ? 's' : ''}`;
    case 'DAMAGE_NODE':
      return `Un nodo recibe ${effect.value} de daño`;
    case 'REPAIR_NODE':
      return `Un nodo se repara ${effect.value} punto${effect.value > 1 ? 's' : ''}`;
    case 'APPLY_STATUS':
      if (effect.status === 'EXPOSED') return 'El Eco queda expuesto';
      return `Se aplica estado: ${effect.status}`;
    default:
      return 'Efecto desconocido';
  }
}

export default EventVisualSystem;
