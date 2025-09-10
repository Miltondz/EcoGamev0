// src/components/GameLog.tsx

import React, { useState, useEffect, useRef } from 'react';
import { gameLogSystem } from '../engine/GameLogSystem';
import type { LogMessage, MessageSource, MessageType } from '../engine/GameLogSystem';
import { FaCrosshairs, FaShieldAlt, FaSearch, FaWrench, FaEye, FaPlus, FaMinus, FaHeartbeat, FaBolt, FaExclamationTriangle, FaInfoCircle, FaSkullCrossbones, FaChevronUp, FaChevronDown, FaGripVertical } from 'react-icons/fa';

const iconMap: Record<MessageType, React.ComponentType<any>> = {
    attack: FaCrosshairs,
    defend: FaShieldAlt,
    search: FaSearch,
    research: FaWrench,
    focus: FaEye,
    draw: FaPlus,
    discard: FaMinus,
    damage: FaHeartbeat,
    heal: FaHeartbeat,
    special: FaBolt,
    node_damage: FaExclamationTriangle,
    node_repair: FaWrench,
    hallucination: FaSkullCrossbones,
    info: FaInfoCircle,
};

const sourceColorMap: Record<MessageSource, string> = {
    player: 'text-cyan-300',
    eco: 'text-red-400',
    system: 'text-gray-400',
    event: 'text-yellow-400',
};

export const GameLog: React.FC = () => {
    const [messages, setMessages] = useState<LogMessage[]>(gameLogSystem.allMessages);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 370, y: window.innerHeight - 380 }); // Esquina inferior derecha
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const logContainerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleNewMessages = (newMessages: LogMessage[]) => {
            setMessages(newMessages);
        };
        const unsubscribe = gameLogSystem.subscribe(handleNewMessages);
        return unsubscribe;
    }, []);
    
    useEffect(() => {
        const handleResize = () => {
            // Mantener posición relativa en esquina inferior derecha
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 370),
                y: window.innerHeight - 380 // Mantener en esquina inferior
            }));
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    
    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 350, e.clientX - dragStart.x)),
                y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragStart.y))
            });
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div
            className="fixed z-40 select-none"
            style={{
                left: position.x,
                top: position.y,
                width: '350px'
            }}
        >
            {/* Header with drag handle and collapse button */}
            <div
                ref={headerRef}
                className="bg-gradient-to-r from-amber-900/90 to-amber-800/90 px-4 py-2 rounded-t-lg border border-amber-600/50 border-b-0 cursor-move flex items-center justify-between"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center space-x-2">
                    <FaGripVertical className="text-amber-300" />
                    <span className="text-amber-100 font-bold text-sm">REGISTRO DE COMBATE</span>
                </div>
                <button
                    className="text-amber-300 hover:text-amber-100 transition-colors"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <FaChevronUp /> : <FaChevronDown />}
                </button>
            </div>
            
            {/* Log content */}
            {!isCollapsed && (
                <div
                    ref={logContainerRef}
                    className="bg-black/90 backdrop-blur-sm p-4 overflow-y-auto text-sm rounded-b-lg shadow-lg border border-amber-600/50 border-t-0"
                    style={{ 
                        fontFamily: "'Courier New', Courier, monospace",
                        height: '300px'
                    }}
                >
                    {messages.length === 0 ? (
                        <div className="text-amber-400/60 text-center py-8">
                            <FaInfoCircle className="mx-auto mb-2 text-2xl" />
                            <div>Sin actividad registrada</div>
                        </div>
                    ) : (
                        messages.map(msg => {
                            const Icon = iconMap[msg.type] || FaInfoCircle;
                            const color = sourceColorMap[msg.source] || 'text-white';
                            return (
                                <div key={msg.id} className={`flex items-start mb-2 ${color} hover:bg-amber-900/20 px-2 py-1 rounded transition-colors`}>
                                    <Icon className="mr-3 flex-shrink-0 mt-0.5" size={12} />
                                    <span className="leading-relaxed">{msg.message}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};