export enum GameState {
  START,
  LOADING,
  PLAYING,
  COMBAT,
  GAME_OVER,
}

export interface PlayerStats {
  health: number;
  inventory: string[];
}

export interface Enemy {
  name: string;
  health: number;
  description: string;
}

export interface StorySegment {
  id: number;
  text: string;
  type: 'story' | 'combat' | 'event';
  eventType?: 'item' | 'environment';
}

export interface GeminiStoryResponse {
  story: string;
  imagePrompt: string;
  healthChange: number;
  inventoryChange: string;
  isGameOver: boolean;
  enemy?: Enemy;
  events?: CombatEvent[];
}

export interface CombatEvent {
  type: 'item' | 'environment';
  description: string;
  effect: string; // e.g., "+sharpening stone", "-10 player health", "-10 enemy health"
}

export interface GeminiCombatResponse {
  playerActionDescription: string;
  enemyActionDescription: string;
  playerHealthChange: number;
  enemyHealthChange: number;
  isCombatOver: boolean;
  combatConclusion: string;
  events?: CombatEvent[];
  isEnemyCriticalHit?: boolean;
}