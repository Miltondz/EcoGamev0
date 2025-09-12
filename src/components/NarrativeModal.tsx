/**
 * Modal de Narrativa
 * 
 * Componente React que muestra elementos narrativos entre capítulos,
 * incluyendo texto, imágenes, GIFs y videos con controles de reproducción.
 */

import React, { useState, useEffect, useRef } from 'react';
import { assetManager } from '../engine/AssetManager';
import type { NarrativeElement, ChapterNarrativeConfig } from '../engine/ChapterNarrativeSystem';

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
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, _setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number>(0);

  useEffect(() => {
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
  }, [element.autoAdvance, element.duration]);

  useEffect(() => {
    // Control de video
    if (element.mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        if (element.autoAdvance) {
          handleComplete();
        }
      };

      const handleLoadedData = () => {
        setMediaLoaded(true);
        if (element.autoAdvance) {
          video.play();
          setIsPlaying(true);
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('loadeddata', handleLoadedData);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('loadeddata', handleLoadedData);
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

  const handleSkip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onSkip?.() || handleComplete();
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const getMediaSrc = (): string => {
    if (!element.mediaPath) return '';
    
    const asset = assetManager.getImageAsset(element.mediaPath);
    return asset || element.mediaPath;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              preload="auto"
              onLoadStart={() => setMediaLoaded(false)}
            />
            
            {mediaLoaded && showControls && (
              <div className="narrative-video-controls">
                <button
                  className="narrative-play-button"
                  onClick={toggleVideo}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                
                {videoRef.current && (
                  <div className="narrative-time-info">
                    {formatTime(currentTime)} / {formatTime(videoRef.current.duration || 0)}
                  </div>
                )}
              </div>
            )}
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
    <div className="narrative-modal-overlay">
      <div className="narrative-modal">
        <div className="narrative-header">
          <div className="narrative-chapter-info">
            <div className="narrative-chapter-title">{config.title}</div>
            <div className="narrative-act-label">{getActLabel()}</div>
          </div>
          
          {element.skipable && (
            <button
              className="narrative-skip-button"
              onClick={handleSkip}
              title="Saltar narrativa"
            >
              ⏭️ Saltar
            </button>
          )}
        </div>

        <div className="narrative-content">
          <h2 className="narrative-title">{element.title}</h2>
          
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

          <div className="narrative-text">
            {element.content.split('\n').map((paragraph, index) => (
              <p key={index} className="narrative-paragraph">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>

        <div className="narrative-footer">
          {element.duration && !element.autoAdvance && (
            <div className="narrative-duration-hint">
              Duración recomendada: {Math.ceil(element.duration / 1000)}s
            </div>
          )}
          
          <button
            className="narrative-continue-button"
            onClick={handleComplete}
            disabled={!mediaLoaded && element.mediaType !== 'text_only'}
          >
            {element.act === 'end' ? 'Continuar Aventura' : 'Continuar'}
          </button>
        </div>
      </div>

      <style>{`
        .narrative-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(20, 0, 40, 0.95));
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
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
          width: 800px;
          overflow-y: auto;
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
        }

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
          max-height: 400px;
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
          font-size: 1.1rem;
          line-height: 1.7;
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
