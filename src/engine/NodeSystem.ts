// src/engine/NodeSystem.ts
import { gameLogSystem } from './GameLogSystem';
import { scenarioLoader } from './ScenarioLoader';
import type { Reward, Node } from './types';

class NodeSystem {
    private nodes: Node[] = [];

    constructor() {
        // Defer loading until scenario is loaded
    }

    initialize() {
        this.loadNodes();
    }

    private loadNodes() {
        this.nodes = scenarioLoader.nodes.map(nodeConfig => ({
            id: nodeConfig.id,
            name: nodeConfig.name,
            status: 'stable',
            damage: 0,
            maxDamage: nodeConfig.maxDamage,
            isCollapsed: false,
            reward: {
                type: nodeConfig.reward.type as Reward['type'],
                value: nodeConfig.reward.amount,
            },
        }));
    }

    getNode(id: string): Node | undefined {
        return this.nodes.find(node => node.id === id);
    }

    updateNodeStatus(id: string, status: Node['status']) {
        const node = this.getNode(id);
        if (node) {
            node.status = status;
            if (status === 'corrupted') {
                node.isCollapsed = true;
            }
            gameLogSystem.addMessage(`Node ${node.name} status updated to ${status}`);
        }
    }
    
    dealDamage(id: string, amount: number) {
        const node = this.getNode(id);
        if (node) {
            node.damage = Math.min(node.maxDamage, node.damage + amount);
            if (node.damage >= node.maxDamage) {
                this.updateNodeStatus(id, 'corrupted');
            } else if (node.damage > 0) {
                this.updateNodeStatus(id, 'unstable');
            } else {
                this.updateNodeStatus(id, 'stable');
            }
        }
    }

    repairNode(id: string, repairAmount: number) {
        const node = this.getNode(id);
        if (node && node.damage > 0) {
            node.damage = Math.max(0, node.damage - repairAmount);
            if (node.damage === 0) {
                this.updateNodeStatus(id, 'stable');
            } else {
                this.updateNodeStatus(id, 'unstable');
            }
        }
    }

    getActiveRewards(): Reward[] {
        return this.nodes
            .filter(node => node.status !== 'corrupted')
            .map(node => node.reward);
    }

    get allNodes(): Node[] {
        return this.nodes;
    }
}

export const nodeSystem = new NodeSystem();
