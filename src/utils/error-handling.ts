/**
 * エラーハンドリングユーティリティ
 * アプリケーション全体で一貫したエラー処理を提供
 */
import { showErrorDialog } from './dialog-utils';

/**
 * エラーレベルの定義
 */
export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

/**
 * エラーハンドリングのオプション
 */
export interface ErrorOptions {
  level?: ErrorLevel;
  showToUser?: boolean;
  context?: Record<string, any>;
}

/**
 * 統一されたエラーハンドリング
 * @param error エラーオブジェクト
 * @param message エラーメッセージ
 * @param options エラーハンドリングオプション
 */
export function handleError(error: unknown, message: string, options: ErrorOptions = {}): void {
  const {
    level = 'error',
    showToUser = true,
    context = {},
  } = options;
  
  // エラーメッセージを構築
  const errorMessage = error instanceof Error ? error.message : String(error);
  const fullMessage = `${message}: ${errorMessage}`;
  
  // コンソールにログ出力
  const logPrefix = `[CosenseAIBooster] [${level.toUpperCase()}]`;
  switch (level) {
    case 'info':
      console.info(logPrefix, fullMessage, context);
      break;
    case 'warning':
      console.warn(logPrefix, fullMessage, context);
      break;
    case 'error':
    case 'critical':
      console.error(logPrefix, fullMessage, context);
      break;
  }
  
  // ユーザーに表示する場合
  if (showToUser) {
    showErrorDialog(fullMessage);
  }
  
  // 重大なエラーの場合は追加のアクション
  if (level === 'critical') {
    // テレメトリや追加のエラー報告を行うなど
    // 将来的には、エラーの自動報告や回復メカニズムをここに追加できる
  }
}

/**
 * エラーのロガーインターフェース
 */
export interface ErrorLogger {
  info(message: string, context?: Record<string, any>): void;
  warning(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error | unknown, context?: Record<string, any>): void;
  critical(message: string, error?: Error | unknown, context?: Record<string, any>): void;
}

/**
 * モジュール別のエラーロガーを作成
 * @param moduleName モジュール名
 * @returns ErrorLoggerインスタンス
 */
export function createErrorLogger(moduleName: string): ErrorLogger {
  return {
    info(message: string, context = {}): void {
      console.info(`[CosenseAIBooster] [${moduleName}] [INFO]`, message, context);
    },
    
    warning(message: string, context = {}): void {
      console.warn(`[CosenseAIBooster] [${moduleName}] [WARNING]`, message, context);
    },
    
    error(message: string, error?: Error | unknown, context = {}): void {
      const errorMessage = error instanceof Error ? error.message : String(error || '');
      const fullMessage = error ? `${message}: ${errorMessage}` : message;
      console.error(`[CosenseAIBooster] [${moduleName}] [ERROR]`, fullMessage, context);
      
      // ユーザー向けエラーダイアログを表示
      showErrorDialog(`${moduleName}: ${fullMessage}`);
    },
    
    critical(message: string, error?: Error | unknown, context = {}): void {
      const errorMessage = error instanceof Error ? error.message : String(error || '');
      const fullMessage = error ? `${message}: ${errorMessage}` : message;
      console.error(`[CosenseAIBooster] [${moduleName}] [CRITICAL]`, fullMessage, context);
      
      // ユーザー向けエラーダイアログを表示
      showErrorDialog(`重大なエラーが発生しました - ${moduleName}: ${fullMessage}`);
      
      // 追加のクリティカルエラー処理
      // TODO: エラー報告システムに送信するなどの実装
    },
  };
}
