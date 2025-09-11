// src/components/GameLog.tsx

import React, { useState, useEffect, useRef } from 'react';
import { gameLogSystem } from '../engine/GameLogSystem';
import type { LogMessage, MessageSource, MessageType } from '../engine/GameLogSystem';
import { FaCrosshairs, FaShieldAlt, FaSearch, FaWrench, FaEye, FaPlus, FaMinus, FaHeartbeat, FaBolt, FaExclamationTriangle, FaInfoCircle, FaSkullCrossbones } from 'react-icons/fa';
import { textStyles, colors, panelStyles } from '../utils/styles';

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
                <span style={{ ...textStyles.label, fontSize: '9px', color: '#fecaca' }}>REGISTRO</span>
                <button onClick={() => setCollapsed(!collapsed)} style={{ 
                    ...textStyles.bodySmall, 
                    fontSize: '9px', 
                    color: '#fecaca', 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '2px'
                }}>
                    {collapsed ? '▼' : '▲'}
                </button>
            </div>
            {!collapsed && (
            <div
                ref={logContainerRef}
                className="bg-black/90 backdrop-blur-sm overflow-y-auto rounded-lg shadow border"
                style={{ 
                    ...panelStyles.secondary,
                    padding: '6px',
                    fontFamily: textStyles.bodySmall.fontFamily,
                    height: '140px',
                    borderColor: 'rgba(220, 38, 38, 0.3)',
                    fontSize: '8px',
                    lineHeight: 1.2
                }}
            >
                {messages.length === 0 ? (
                    <div style={{ ...textStyles.bodySmall, color: colors.mutedAlpha, textAlign: 'center', padding: '12px 0' }}>
                        <FaInfoCircle style={{ margin: '0 auto 4px auto', fontSize: '12px' }} />
                        <div>Sin actividad registrada</div>
                    </div>
                ) : (
                    messages.map(msg => {
                        const Icon = iconMap[msg.type] || FaInfoCircle;
                        const color = sourceColorMap[msg.source] || 'text-white';
                        return (
                            <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }} className={color}>
                                <Icon style={{ marginRight: '4px', flexShrink: 0, marginTop: '1px', fontSize: '8px' }} />
                                <span style={{ ...textStyles.bodySmall, fontSize: '8px', lineHeight: 1.2 }}>{msg.message}</span>
                            </div>
                        );
                    })
                )}
            </div>
            )}
        </div>
    );
};
