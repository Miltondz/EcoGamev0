// src/components/EventVisualSystem.tsx

import React, { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import type { Card, DynamicEvent } from '../engine/types';
import { pixiScreenEffects } from '../engine/PixiScreenEffects';
import type { ScreenEffectType } from '../engine/PixiScreenEffects';

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
  const [currentEffect, setCurrentEffect] = useState<string>('none');

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
      
      // 3. Auto-cerrar según el tipo de presentación
      const autocloseDelay = getAutoCloseDelay(config.presentationType);
      timeline.call(() => {
        onClose();
        setShowContent(false);
        setCurrentEffect('none');
      }, [], autocloseDelay);
    }
  }, [isVisible, eventCard, event, config, onClose]);

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

  const getAutoCloseDelay = (type: string): number => {
    switch (type) {
      case 'card': return 4;
      case 'image': return 6;
      case 'gif': return 8;
      case 'video': return 10;
      default: return 4;
    }
  };

  if (!isVisible || !eventCard || !event || !config) return null;

  return (
    <>
      {/* Main Modal - Sin overlay CSS ya que PixiJS maneja los efectos */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm"
          onClick={onClose}
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
    return ['Hearts', 'Diamonds'].includes(suit) ? '#ef4444' : '#1f2937';
  };

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
}> = ({ eventCard, event, onClose }) => (
  <div className="event-modal relative max-w-xl mx-4 p-6 bg-gray-900 rounded-xl border-2 border-blue-500 shadow-2xl">
    <EventCardDisplay eventCard={eventCard} />
    <EventDetails event={event} />
    <CloseButton onClose={onClose} />
  </div>
);

const ImagePresentation: React.FC<{
  eventCard: Card;
  event: DynamicEvent;
  onClose: () => void;
}> = ({ eventCard, event, onClose }) => (
  <div className="event-modal relative max-w-4xl mx-4 bg-gray-900 rounded-xl border-2 border-purple-500 shadow-2xl overflow-hidden">
    <div className="relative">
      {/* Placeholder para imagen del evento */}
      <div className="w-full h-80 bg-gradient-to-br from-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <div className="text-2xl font-bold text-white">{event.event}</div>
          <div className="text-sm text-gray-400 mt-2">Imagen: {eventCard.id}.jpg</div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4">
        <EventCardDisplay eventCard={eventCard} size="small" />
      </div>
    </div>
    <div className="p-6">
      <EventDetails event={event} />
    </div>
    <CloseButton onClose={onClose} />
  </div>
);

const GifPresentation: React.FC<{
  eventCard: Card;
  event: DynamicEvent;
  onClose: () => void;
}> = ({ eventCard, event, onClose }) => (
  <div className="event-modal relative max-w-5xl mx-4 bg-gray-900 rounded-xl border-2 border-orange-500 shadow-2xl overflow-hidden">
    <div className="relative">
      {/* Placeholder para GIF del evento */}
      <div className="w-full h-96 bg-gradient-to-br from-orange-900 to-red-900 flex items-center justify-center animate-pulse">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">⚡</div>
          <div className="text-3xl font-bold text-white">{event.event}</div>
          <div className="text-sm text-gray-400 mt-2">GIF Animado: {eventCard.id}.gif</div>
        </div>
      </div>
      <div className="absolute top-4 left-4">
        <EventCardDisplay eventCard={eventCard} size="small" />
      </div>
    </div>
    <div className="p-6">
      <EventDetails event={event} />
    </div>
    <CloseButton onClose={onClose} />
  </div>
);

const VideoPresentation: React.FC<{
  eventCard: Card;
  event: DynamicEvent;
  onClose: () => void;
}> = ({ eventCard, event, onClose }) => (
  <div className="event-modal relative max-w-6xl mx-4 bg-black rounded-xl border-2 border-red-500 shadow-2xl overflow-hidden">
    <div className="relative">
      {/* Placeholder para Video del evento */}
      <div className="w-full h-[32rem] bg-gradient-to-br from-red-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-pulse">🎬</div>
          <div className="text-4xl font-bold text-white mb-2">{event.event}</div>
          <div className="text-lg text-gray-400 mb-4">Video Cinemático</div>
          <div className="text-sm text-gray-500">Video: {eventCard.id}.mp4</div>
        </div>
      </div>
      <div className="absolute top-6 left-6">
        <EventCardDisplay eventCard={eventCard} size="small" />
      </div>
      {/* Controles de video simulados */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 rounded-full px-6 py-2 flex items-center space-x-4">
        <div className="w-4 h-4 bg-white rounded-full"></div>
        <div className="w-32 h-1 bg-gray-600 rounded">
          <div className="w-8 h-1 bg-white rounded"></div>
        </div>
        <span className="text-white text-sm">0:15 / 2:30</span>
      </div>
    </div>
    <div className="p-6">
      <EventDetails event={event} />
    </div>
    <CloseButton onClose={onClose} />
  </div>
);

// Componentes auxiliares
const EventCardDisplay: React.FC<{
  eventCard: Card;
  size?: 'normal' | 'small';
}> = ({ eventCard, size = 'normal' }) => {
  const isSmall = size === 'small';
  const cardSize = isSmall ? 'w-16 h-20' : 'w-32 h-44';
  const textSize = isSmall ? 'text-xs' : 'text-xl';
  const symbolSize = isSmall ? 'text-lg' : 'text-4xl';

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
    return ['Hearts', 'Diamonds'].includes(suit) ? '#ef4444' : '#1f2937';
  };

  return (
    <div className={`${cardSize} rounded-lg border-2 border-blue-400 bg-white shadow-xl relative`}>
      <div className="absolute inset-1 flex flex-col">
        <div className={`${textSize} font-bold`} style={{ color: getSuitColor(eventCard.suit) }}>
          {eventCard.rank}{getSuitSymbol(eventCard.suit)}
        </div>
        {!isSmall && (
          <div className="flex-1 flex items-center justify-center">
            <div className={symbolSize} style={{ color: getSuitColor(eventCard.suit) }}>
              {getSuitSymbol(eventCard.suit)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EventDetails: React.FC<{ event: DynamicEvent }> = ({ event }) => (
  <div className="text-center space-y-4">
    <h3 className="text-2xl font-bold text-white">{event.event}</h3>
    <p className="text-lg text-gray-300 italic leading-relaxed">"{event.flavor}"</p>
    {event.effects && event.effects.length > 0 && (
      <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-sm font-semibold text-gray-400 mb-1">EFECTOS:</div>
        {event.effects.map((effect, index) => (
          <div key={index} className="text-sm text-gray-300">
            {getEffectDescription(effect)}
          </div>
        ))}
      </div>
    )}
  </div>
);

const CloseButton: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <button
    onClick={onClose}
    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
  >
    ×
  </button>
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
