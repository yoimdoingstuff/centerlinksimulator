export type Difficulty = 'EASY' | 'NORMAL' | 'REALISTIC';

export type CallStatus =
  | 'IDLE'
  | 'DIALING'
  | 'ROBOCALLER_IVR'
  | 'HOLD_QUEUE'
  | 'AGENT_TALKING'
  | 'AGENT_NEVER_ANSWERS_TRAP'
  | 'LINE_DROPPED'
  | 'CALL_ENDED'
  | 'VICTORY';

export type VolumeZone = 'TOO_QUIET' | 'CASUAL' | 'ASSERTIVE' | 'SCREAMING';

export interface Mission {
  id: string;
  title: string;
  crn: string;
  description: string;
  keyPhrases: string[];
  penaltyNotice: string;
  agency: string;
  targetDepartment: string;
  menuGuide: string;
  expectedMenuId: string;
}

export interface DialogueMessage {
  id: string;
  sender: 'USER' | 'ROBOCALLER' | 'AGENT' | 'SYSTEM';
  text: string;
  timestamp: number;
  volumeDb?: number;
}

export interface CallStats {
  totalSeconds: number;
  holdSeconds: number;
  loopsSurvived: number;
  peakDb: number;
  initialQueuePos: number;
  currentQueuePos: number;
  reverseJumps: number;
  tamperCount: number;
}

export interface IVRMenuOption {
  key: string;
  label: string;
  voicePhrase: string;
  action: 'SUBMENU' | 'HOLD_QUEUE' | 'REPEAT' | 'HANGUP' | 'LOOP';
  targetMenu?: string;
}

export interface IVRMenu {
  id: string;
  spokenPrompt: string;
  options: IVRMenuOption[];
}
