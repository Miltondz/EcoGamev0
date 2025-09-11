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
            {/* Área de juego central - limpia y funcional */}
        </div>
    );
};
