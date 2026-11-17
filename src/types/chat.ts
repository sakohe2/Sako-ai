export type Language = string;

export type AssistantMode = 'general' | 'html' | 'games' | 'learning';

export type ModelPresetId =
  | 'flash-lite'
  | 'hydrogen-fast'
  | 'hydrogen-balanced'
  | 'hydrogen-deep'
  | 'hydrogen-xhigh';

export type AppView = 'chat' | 'studio' | 'about';

export type LiveVoiceName = 'Zephyr' | 'Puck' | 'Kore' | 'Fenrir' | 'Charon';

export type LiveSessionMode = 'instant' | 'thinking' | 'coach';

export type PersonaTone = 'normal' | 'angry';

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 without data-url prefix
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: number;
  attachments?: Attachment[];
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  mode: AssistantMode;
  persona?: PersonaTone;
  updatedAt: number;
  messages: ChatMessage[];
}
