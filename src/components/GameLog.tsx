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
        <div
            ref={logContainerRef}
            className="absolute top-1/2 left-4 transform -translate-y-1/2 w-96 h-1/2 bg-black bg-opacity-70 p-4 overflow-y-auto text-sm rounded-lg shadow-lg border border-gray-700"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
            {messages.map(msg => {
                const Icon = iconMap[msg.type] || FaInfoCircle;
                const color = sourceColorMap[msg.source] || 'text-white';
                return (
                    <div key={msg.id} className={`flex items-center mb-2 ${color}`}>
                        <Icon className="mr-3 flex-shrink-0" />
                        <span>{msg.message}</span>
                    </div>
                );
            })}
        </div>
    );
};