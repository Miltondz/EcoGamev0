// src/components/Board.tsx
// Simplified board component for fixed 1280x720 layout
// Main game area - mostly visual/atmospheric

import React, { useRef, useEffect } from 'react';
import { uiPositionManager } from '../engine/UIPositionManager';

interface BoardProps {
    onNodeClick: (nodeId: string) => void;
    isRepairMode: boolean;
}

export const Board: React.FC<BoardProps> = (_props: BoardProps) => {
    const playAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (playAreaRef.current) {
            const rect = playAreaRef.current.getBoundingClientRect();
            uiPositionManager.register('playArea', { 
                x: rect.left, 
                y: rect.top, 
                width: rect.width, 
                height: rect.height 
            });
        }
    }, []);

    return (
        <div 
            ref={playAreaRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'radial-gradient(circle at center, rgba(217, 119, 6, 0.1) 0%, rgba(0, 0, 0, 0.3) 70%)',
                borderRadius: '8px'
            }}
        >
            {/* Central atmospheric display */}
            <div style={{
                textAlign: 'center',
                color: 'rgba(217, 119, 6, 0.4)',
                fontSize: '48px',
                fontWeight: 'bold',
                textShadow: '0 0 20px rgba(217, 119, 6, 0.2)',
                userSelect: 'none',
                pointerEvents: 'none'
            }}>
                ECO-SURVIVOR
            </div>
            
            {/* Subtle grid pattern overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `
                    linear-gradient(rgba(217, 119, 6, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(217, 119, 6, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                borderRadius: '8px',
                pointerEvents: 'none'
            }} />
        </div>
    );
};
