export type TabId = 'prompts' | 'general' | 'api';

export interface TabProps {
  id: TabId;
  label: string;
}

export type PromptEditingType = {
  id: string;
  name: string;
  systemPrompt: string;
  formatPrompt?: string; // 出力フォーマットを規定するプロンプト
  model: string;
  provider?: 'openai' | 'openrouter';
  insertPosition?: 'below' | 'bottom';
} | null;
