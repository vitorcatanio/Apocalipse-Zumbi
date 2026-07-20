export type ScreenType = 'HOME' | 'SURVIVOR_SETUP' | 'MISSION_SCREEN' | 'FINAL_REVEAL';

export type CharacterClassId = 'TECNOLOGICO' | 'CIENTISTA' | 'ESTRATEGISTA' | 'GUERREIRO' | 'LIDER' | 'SOLITARIO';

export interface CharacterClass {
  id: CharacterClassId;
  name: string;
  icon: string;
  description: string;
  revealWord: string;
}

export type MissionItemId = 'LIVRO' | 'TELEVISAO' | 'QUADRO' | 'CHAVE';

export interface MissionItem {
  id: MissionItemId;
  name: string;
  icon: string;
  emoji: string;
  riddle: string;
  correctAnswer: string;
  x: number; // grid position or map coordinates
  y: number;
}

export interface SurvivorProfile {
  name: string;
  characterClassId: CharacterClassId | null;
}
