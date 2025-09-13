/**
 * Modal de Narrativa
 * 
 * Componente React que muestra elementos narrativos entre capítulos,
 * incluyendo texto, imágenes, GIFs y videos con controles de reproducción.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { assetManager } from '../engine/AssetManager';
import type { NarrativeElement, ChapterNarrativeConfig } from '../engine/ChapterNarrativeSystem';
import { GameLayer, useLayer } from '../engine/LayerManager';
import { colors, textStyles, fonts } from '../utils/styles';
import { StyledButton } from './StyledButton';

interface NarrativeModalProps {
  element: NarrativeElement;
  config: ChapterNarrativeConfig;
  onComplete: () => void;
  onSkip?: () => void;
}

export const NarrativeModal: React.FC<NarrativeModalProps> = ({
  element,
  config,
  onComplete,
  onSkip
}) => {
  const narrativeModalLayer = useLayer(GameLayer.NARRATIVE_MODAL, true); // Auto-traer al frente
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [, setIsPlaying] = useState(false); // Solo usamos el setter
  const [segmentIndex, setSegmentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number>(0);

  // Segment text by paragraphs for pagination (no scrollbars)
  const contentSegments = useMemo(() => {
    if (!element?.content) return [] as string[];
    const raw = element.content.replace(/\r\n/g, '\n');
    // Split by double newlines or single newlines, then trim
    const parts = raw.split(/\n\s*\n|\n{1,}/g).map(p => p.trim()).filter(Boolean);
    return parts.length ? parts : [raw.trim()];
  }, [element]);

  useEffect(() => {
    // Reset text pagination when element changes
    setSegmentIndex(0);

    // Auto-advance setup si está habilitado
    if (element.autoAdvance && element.duration) {
      timeoutRef.current = setTimeout(() => {
        handleComplete();
      }, element.duration);
    }

    // Cleanup al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [element, element.autoAdvance, element.duration]);

  useEffect(() => {
    // Control de video simplificado: solo escuchar 'ended'
    if (element.mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;

      const handleEnded = () => {
        setIsPlaying(false);
        if (element.autoAdvance) {
          handleComplete();
        }
      };

      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    } else {
      // Para otros tipos de media, marcar como cargado inmediatamente
      setMediaLoaded(true);
    }
  }, [element, videoRef.current]);

  const handleComplete = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onComplete();
  };

  const handleNextSegment = () => {
    if (segmentIndex < contentSegments.length - 1) {
      setSegmentIndex(i => i + 1);
      return;
    }
    handleComplete();
  };

  const handleSkip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onSkip?.() || handleComplete();
  };

  // No custom controls; video auto-plays and loops muted

  const getMediaSrc = (): string => {
    if (!element.mediaPath) return '';
    
    const asset = assetManager.getImageAsset(element.mediaPath);
    return asset || element.mediaPath;
  };


  const getActLabel = (): string => {
    switch (element.act) {
      case 'beginning': return 'Acto I';
      case 'middle': return 'Acto II';
      case 'end': return 'Acto III';
      default: return '';
    }
  };

  const renderMedia = () => {
    const mediaSrc = getMediaSrc();

    switch (element.mediaType) {
      case 'video':
        return (
          <div className="narrative-video-container">
            <video
              ref={videoRef}
              src={mediaSrc}
              className="narrative-video"
              controls={false}
              loop
              muted
              playsInline
              autoPlay
              preload="auto"
              onLoadStart={() => setMediaLoaded(false)}
              onLoadedData={() => {
                setMediaLoaded(true);
                try {
                  videoRef.current?.play();
                  setIsPlaying(true);
                } catch {}
              }}
            />
          </div>
        );

      case 'gif':
        return (
          <div className="narrative-gif-container">
            <img
              src={mediaSrc}
              alt={element.title}
              className="narrative-gif"
              onLoad={() => setMediaLoaded(true)}
            />
          </div>
        );

      case 'image':
        return (
          <div className="narrative-image-container">
            <img
              src={mediaSrc}
              alt={element.title}
              className="narrative-image"
              onLoad={() => setMediaLoaded(true)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="narrative-modal-overlay" style={{ zIndex: narrativeModalLayer.zIndex }}>
      <div className="narrative-modal">
        <div className="narrative-header">
          <div className="narrative-chapter-info">
            <div className="narrative-chapter-title" style={{ ...textStyles.smallTitle, color: colors.gold }}>{config.title}</div>
            <div className="narrative-act-label" style={{ ...textStyles.label, color: colors.muted }}>{getActLabel()}</div>
          </div>
          
          {element.skipable && (
            <StyledButton 
              onClick={handleSkip} 
              size="sm" 
              variant="secondary"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              ⏭️ Saltar
            </StyledButton>
          )}
        </div>

        <div className="narrative-content">
          {/* Left: media */}
          <div className="narrative-left">
            <h2 className="narrative-title" style={{ ...textStyles.sectionTitle, fontSize: '28px', textAlign: 'left', margin: '0 0 16px 0' }}>{element.title}</h2>
            {element.mediaType !== 'text_only' && element.mediaPath && (
              <div className="narrative-media">
                {!mediaLoaded && (
                  <div className="narrative-loading">
                    <div className="narrative-spinner"></div>
                    Cargando contenido...
                  </div>
                )}
                {renderMedia()}
              </div>
            )}
          </div>

          {/* Right: text with pagination */}
          <div className="narrative-right">
            <div className="narrative-text">
              {contentSegments.slice(0, segmentIndex + 1).map((paragraph, index) => (
                <p key={index} className="narrative-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Inline controls for text pagination */}
            <div className="narrative-text-controls">
              {segmentIndex > 0 && (
                <StyledButton 
                  onClick={() => setSegmentIndex(i => Math.max(0, i - 1))}
                  size="sm" 
                  variant="secondary"
                  style={{ width: 'auto', padding: '8px 12px', marginRight: '8px' }}
                >
                  ◀ Regresar
                </StyledButton>
              )}
              <StyledButton 
                onClick={handleNextSegment}
                size="sm"
                variant="primary"
                disabled={!mediaLoaded && element.mediaType !== 'text_only'}
                style={{ width: 'auto', padding: '8px 12px' }}
              >
                {segmentIndex < contentSegments.length - 1 ? 'Siguiente ▶' : (element.act === 'end' ? 'Continuar Aventura' : 'Continuar')}
              </StyledButton>
            </div>
          </div>
        </div>

        <div className="narrative-footer">
          {element.duration && !element.autoAdvance && (
            <div className="narrative-duration-hint">
              Duración recomendada: {Math.ceil(element.duration / 1000)}s
            </div>
          )}
          
          <div style={{ height: '1px' }} />
        </div>
      </div>

      <style>{`
        .narrative-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden; /* no scrollbars en overlay */
          /* z-index manejado por LayerManager via style inline */
          animation: fadeIn 0.5s ease-out;
        }

        .narrative-modal {
          background: rgba(30, 41, 59, 0.7); /* 70% opacity standard */
          backdropFilter: blur(12px);
          border: 1px solid rgba(217, 119, 6, 0.3);
          borderRadius: 12px;
          boxShadow: 0 8px 32px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1);
          max-width: 90vw;
          max-height: 90vh;
          width: 980px;
          overflow: hidden; /* No scrollbars */
          animation: slideIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .narrative-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(217, 119, 6, 0.3);
          background: linear-gradient(90deg, rgba(217, 119, 6, 0.2), transparent);
        }

        .narrative-chapter-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .narrative-chapter-title {
          color: #4a9eff;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .narrative-act-label {
          color: #8bb5ff;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .narrative-skip-button {
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.4);
          color: #ff6b6b;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .narrative-skip-button:hover {
          background: rgba(255, 107, 107, 0.3);
          transform: translateY(-1px);
        }

        .narrative-content {
          padding: 24px;
          display: grid;
          grid-template-columns: 52% 48%;
          gap: 20px;
          align-items: start;
        }

        .narrative-left { min-height: 340px; }
        .narrative-right { display: flex; flex-direction: column; gap: 12px; }

        .narrative-title {
          color: #e1e9ff;
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0 0 20px 0;
          text-align: center;
          background: linear-gradient(135deg, #e1e9ff, #4a9eff);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: ${fonts.title};
        }

        .narrative-media {
          margin: 20px 0;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.3);
          position: relative;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .narrative-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #8bb5ff;
          font-size: 1rem;
        }

        .narrative-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(139, 181, 255, 0.2);
          border-top: 3px solid #8bb5ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .narrative-video-container, .narrative-gif-container, .narrative-image-container {
          width: 100%;
          position: relative;
        }

        .narrative-video, .narrative-gif, .narrative-image {
          width: 100%;
          max-height: 360px;
          object-fit: contain;
          border-radius: 8px;
        }

        .narrative-video-controls {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.7);
          padding: 8px 12px;
          border-radius: 8px;
          backdrop-filter: blur(4px);
        }

        .narrative-play-button {
          background: rgba(74, 158, 255, 0.2);
          border: 1px solid rgba(74, 158, 255, 0.4);
          color: #4a9eff;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .narrative-play-button:hover {
          background: rgba(74, 158, 255, 0.3);
          transform: scale(1.05);
        }

        .narrative-time-info {
          color: #e1e9ff;
          font-size: 0.9rem;
        }

        .narrative-text {
          color: #c1c9d9;
          font-size: 1.05rem;
          line-height: 1.7;
          max-height: 360px; /* Limit height to avoid scrollbars */
          overflow: hidden;
          padding-right: 4px;
          font-family: ${fonts.body};
        }

        .narrative-paragraph {
          margin: 0 0 16px 0;
          text-align: justify;
        }

        .narrative-paragraph:last-child {
          margin-bottom: 0;
        }

        .narrative-footer {
          padding: 20px 24px;
          border-top: 1px solid rgba(217, 119, 6, 0.3);
          background: linear-gradient(90deg, transparent, rgba(217, 119, 6, 0.1));
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .narrative-text-controls { display: flex; justify-content: flex-end; margin-top: 8px; }

        .narrative-next-button {
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.28));
          border: 1px solid rgba(255,255,255,0.06);
          color: #e1e9ff;
          font-family: 'Roboto Condensed', sans-serif;
          font-weight: 700;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          letter-spacing: 1.2px;
          transition: all 0.2s ease;
        }

        .narrative-next-button:hover:not(:disabled) {
          transform: translateY(-2px);
          color: ${colors.gold};
          border-color: rgba(180,140,80,0.18);
        }

        .narrative-next-button:disabled { opacity: 0.5; cursor: not-allowed; }

        .narrative-duration-hint {
          color: #8bb5ff;
          font-size: 0.9rem;
          opacity: 0.7;
        }

        .narrative-continue-button {
          background: linear-gradient(135deg, #4a9eff, #2d87ff);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(74, 158, 255, 0.3);
        }

        .narrative-continue-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(74, 158, 255, 0.4);
        }

        .narrative-continue-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .narrative-modal {
            width: 95vw;
            margin: 20px;
          }

          .narrative-title {
            font-size: 1.5rem;
          }

          .narrative-text {
            font-size: 1rem;
          }

          .narrative-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .narrative-footer {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .narrative-continue-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
