// 設定同期のユーティリティ関数（一元化されたバージョン）
import { browser } from 'wxt/browser';
import { Prompt } from '../hooks/useStorage';

// フロントエンド設定の型定義
export interface FrontendSettings {
  prompts: Prompt[];
  insertPosition: 'below' | 'bottom';
  speechLang: string;
  apiProvider: 'openai' | 'openrouter';
  openaiModel: string;
  openrouterModel: string;
}

/**
 * 設定変更をCosenseの開いているタブに直接通知する
 * これはバックグラウンドのストレージ変更イベントを待たずに直接送信するための実装
 */
export async function syncSettingsToOpenTabs(settings: FrontendSettings): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log('[CosenseAIBooster settings] 設定変更を直接通知します', {
      promptCount: settings.prompts?.length,
    });

    // 開いているCosenseタブを検索
    const tabs = await browser.tabs.query({
      url: ['*://scrapbox.io/*', '*://cosen.se/*'],
    });
    
    if (tabs.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster settings] 通知対象のCosenseタブが見つかりませんでした');
      return;
    }
    
    // eslint-disable-next-line no-console
    console.log(`[CosenseAIBooster settings] ${tabs.length}個のCosenseタブに設定更新を通知します`);
    
    // 各タブに通知
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            frontendSettings: settings,
          });
          // eslint-disable-next-line no-console
          console.log(`[CosenseAIBooster settings] タブID ${tab.id} に通知しました`);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[CosenseAIBooster settings] タブID ${tab.id} への通知に失敗:`, err);
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[CosenseAIBooster settings] 設定通知中にエラーが発生しました:', err);
  }
}

/**
 * 設定変更をポップアップから通知する（エイリアス）
 * 
 * @param settings 更新された設定
 */
export async function notifySettingsChange(settings: FrontendSettings): Promise<void> {
  return syncSettingsToOpenTabs(settings);
}
