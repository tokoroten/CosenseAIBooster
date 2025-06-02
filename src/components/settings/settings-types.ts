export type TabId = 'prompts' | 'general' | 'api';

export interface TabProps {
  id: TabId;
  label: string;
}

export type PromptEditingType = {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  provider?: 'openai' | 'openrouter';
  insertPosition?: 'below' | 'bottom';
} | null;
