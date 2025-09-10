// src/components/GameLog.tsx

import React, { useState, useEffect, useRef } from 'react';
import { gameLogSystem } from '../engine/GameLogSystem';
import type { LogMessage, MessageSource, MessageType } from '../engine/GameLogSystem';
import { FaCrosshairs, FaShieldAlt, FaSearch, FaWrench, FaEye, FaPlus, FaMinus, FaHeartbeat, FaBolt, FaExclamationTriangle, FaInfoCircle, FaSkullCrossbones } from 'react-icons/fa';

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
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleNewMessages = (newMessages: LogMessage[]) => {
            setMessages(newMessages);
        };
        const unsubscribe = gameLogSystem.subscribe(handleNewMessages);
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="embedded-gamelog" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#fecaca', fontSize: '9px', fontWeight: 700 }}>REGISTRO</span>
                <button onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '9px', color: '#fecaca', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    {collapsed ? '▼' : '▲'}
                </button>
            </div>
            {!collapsed && (
            <div
                ref={logContainerRef}
                className="bg-black/90 backdrop-blur-sm overflow-y-auto rounded-lg shadow border"
                style={{ 
                    padding: '6px',
                    fontFamily: "'Courier New', Courier, monospace",
                    height: '140px',
                    borderColor: 'rgba(220, 38, 38, 0.3)',
                    fontSize: '8px',
                    lineHeight: 1.2
                }}
            >
                {messages.length === 0 ? (
                    <div className="text-amber-400/60 text-center py-6">
                        <FaInfoCircle className="mx-auto mb-2 text-lg" />
                        <div>Sin actividad registrada</div>
                    </div>
                ) : (
                    messages.map(msg => {
                        const Icon = iconMap[msg.type] || FaInfoCircle;
                        const color = sourceColorMap[msg.source] || 'text-white';
                        return (
                            <div key={msg.id} className={`flex items-start mb-1 ${color}`}>
                                <Icon className="mr-1 flex-shrink-0 mt-0.5" size={8} />
                                <span className="leading-tight text-xs">{msg.message}</span>
                            </div>
                        );
                    })
                )}
            </div>
            )}
        </div>
    );
};
