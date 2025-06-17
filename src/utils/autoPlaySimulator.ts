import { GameState, GridNode, NodeState } from '../types';

export interface AutoPlayStep {
  fromNodeId: string;
  toNodeId: string;
  success: boolean;
}

export class AutoPlaySimulator {
  private queue: string[] = [];
  private isRunning = false;
  private abortController: AbortController | null = null;

  constructor(
    private setState: React.Dispatch<React.SetStateAction<GameState>>,
    private setTimeSeries: React.Dispatch<React.SetStateAction<Array<{ step: number; counts: Record<NodeState, number> }>>>,
    private onComplete: () => void
  ) {}

  private getOrthogonalNeighbors(nodeId: string, gridSize: { rows: number; cols: number }): string[] {
    const [, rowStr, colStr] = nodeId.match(/r(\d+)c(\d+)/) || [];
    if (!rowStr || !colStr) return [];
    
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);
    const neighbors: string[] = [];

    // Up
    if (row > 0) neighbors.push(`r${row - 1}c${col}`);
    // Down
    if (row < gridSize.rows - 1) neighbors.push(`r${row + 1}c${col}`);
    // Left
    if (col > 0) neighbors.push(`r${row}c${col - 1}`);
    // Right
    if (col < gridSize.cols - 1) neighbors.push(`r${row}c${col + 1}`);

    return neighbors;
  }

  private countNodeStates(nodes: Record<string, GridNode>): Record<NodeState, number> {
    const counts: Record<NodeState, number> = {
      Susceptible: 0,
      VaccinatedSafe: 0,
      VaccinatedFailed: 0,
      Infected: 0,
      Immune: 0,
      InfectionAttemptFailed: 0,
    };
    
    Object.values(nodes).forEach(node => {
      counts[node.state]++;
    });
    
    return counts;
  }

  private async processInfectedNode(currentNodeId: string, gameState: GameState): Promise<void> {
    if (!this.isRunning) return;

    const neighbors = this.getOrthogonalNeighbors(currentNodeId, gameState.gridSize);
    const susceptibleNeighbors = neighbors.filter(
      neighborId => gameState.nodes[neighborId]?.state === "Susceptible"
    );

    console.log(`Processing infected node ${currentNodeId}, found ${susceptibleNeighbors.length} susceptible neighbors`);

    for (const neighborId of susceptibleNeighbors) {
      if (!this.isRunning) return;

      // Wait 1 second before processing each neighbor
      await this.delay(1000);
      
      if (!this.isRunning) return;

      // 50/50 random outcome
      const success = Math.random() < 0.5;
      
      console.log(`Attempting infection from ${currentNodeId} to ${neighborId}: ${success ? 'SUCCESS' : 'FAILED'}`);

      // Update state based on model type and outcome
      this.setState(prevState => {
        const updatedNodes = { ...prevState.nodes };
        const targetNode = updatedNodes[neighborId];
        let stateChanged = false;
        
        if (prevState.modelType === "SIR") {
          if (success) {
            targetNode.state = "Infected";
            this.queue.push(neighborId);
            stateChanged = true;
          } else {
            // Failed infection in SIR → Immune (Recovered/Removed)
            targetNode.state = "Immune";
            stateChanged = true;
          }
        } else { // SI model
          if (success) {
            targetNode.state = "Infected";
            this.queue.push(neighborId);
            stateChanged = true;
          }
          // Failed infection in SI → leave as Susceptible (no state change)
          // stateChanged remains false
        }

        const newHistoryEntry = {
          from: currentNodeId,
          to: neighborId,
          success,
          timestamp: Date.now()
        };

        const newState = {
          ...prevState,
          nodes: updatedNodes,
          history: [...prevState.history, newHistoryEntry]
        };

        // Only update time series if state actually changed
        if (stateChanged) {
          const currentCounts = this.countNodeStates(updatedNodes);
          this.setTimeSeries(prev => [...prev, { 
            step: prev.length, 
            counts: currentCounts 
          }]);
          console.log(`State changed for ${neighborId}, time series updated to step ${prev => prev.length}`);
        } else {
          console.log(`No state change for ${neighborId}, time series not updated`);
        }

        return newState;
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.abortController) {
        this.abortController = new AbortController();
      }

      const timeoutId = setTimeout(resolve, ms);
      
      this.abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Aborted'));
      });
    });
  }

  private findInfectedNodes(gameState: GameState): string[] {
    return Object.values(gameState.nodes)
      .filter(node => node.state === "Infected")
      .map(node => node.id);
  }

  private seedRandomInfection(gameState: GameState): string | null {
    const susceptibleNodes = Object.values(gameState.nodes)
      .filter(node => node.state === "Susceptible");
    
    if (susceptibleNodes.length === 0) return null;
    
    const randomNode = susceptibleNodes[Math.floor(Math.random() * susceptibleNodes.length)];
    
    this.setState(prevState => {
      const updatedNodes = { ...prevState.nodes };
      updatedNodes[randomNode.id].state = "Infected";
      
      const newHistoryEntry = {
        from: null, // Seeded infection
        to: randomNode.id,
        success: true,
        timestamp: Date.now()
      };

      const newState = {
        ...prevState,
        nodes: updatedNodes,
        history: [...prevState.history, newHistoryEntry]
      };

      // Update time series for seeded infection
      const currentCounts = this.countNodeStates(updatedNodes);
      this.setTimeSeries(prev => [...prev, { 
        step: prev.length, 
        counts: currentCounts 
      }]);

      return newState;
    });

    return randomNode.id;
  }

  private hasInfectableSusceptibleNeighbors(gameState: GameState): boolean {
    const infectedNodes = this.findInfectedNodes(gameState);
    
    for (const infectedNodeId of infectedNodes) {
      const neighbors = this.getOrthogonalNeighbors(infectedNodeId, gameState.gridSize);
      const susceptibleNeighbors = neighbors.filter(
        neighborId => gameState.nodes[neighborId]?.state === "Susceptible"
      );
      
      if (susceptibleNeighbors.length > 0) {
        return true;
      }
    }
    
    return false;
  }

  async start(gameState: GameState): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.abortController = new AbortController();
    
    console.log('Starting auto-play simulation');

    // Find existing infected nodes or seed one
    let infectedNodes = this.findInfectedNodes(gameState);
    
    if (infectedNodes.length === 0) {
      console.log('No infected nodes found, seeding random infection');
      const seededNode = this.seedRandomInfection(gameState);
      if (seededNode) {
        infectedNodes = [seededNode];
        // Wait a moment for state to update
        await this.delay(500);
      } else {
        console.log('No susceptible nodes available for seeding');
        this.stop();
        return;
      }
    }

    // Initialize queue with infected nodes
    this.queue = [...infectedNodes];
    console.log(`Initialized queue with ${this.queue.length} infected nodes`);

    try {
      // Process queue until empty or no more infections possible
      while (this.queue.length > 0 && this.isRunning) {
        const currentNodeId = this.queue.shift()!;
        console.log(`Processing queue item: ${currentNodeId}, remaining queue: ${this.queue.length}`);
        
        // Get current game state for processing
        await new Promise<void>((resolve) => {
          this.setState(currentState => {
            // Check if there are still susceptible neighbors that can be infected
            if (!this.hasInfectableSusceptibleNeighbors(currentState)) {
              console.log('No more susceptible neighbors available for infection, stopping auto-play');
              this.queue = []; // Clear queue to stop processing
              resolve();
              return currentState;
            }
            
            this.processInfectedNode(currentNodeId, currentState).then(resolve);
            return currentState;
          });
        });
      }
      
      if (this.isRunning) {
        console.log('Auto-play simulation completed');
        this.onComplete();
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Aborted') {
        console.log('Auto-play simulation aborted');
      } else {
        console.error('Auto-play simulation error:', error);
      }
    } finally {
      this.stop();
    }
  }

  stop(): void {
    console.log('Stopping auto-play simulation');
    this.isRunning = false;
    this.queue = [];
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}