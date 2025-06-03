/**
 * アプリケーション全体のテーマ定義
 */
export const theme = {
  colors: {
    primary: '#2196f3',
    secondary: '#4CAF50',
    error: '#d32f2f',
    background: 'white',
    text: '#333',
    lightText: '#555',
    border: '#ddd',
    lightBorder: '#eee',
  },
  spacing: {
    xs: '0.5em',
    sm: '1em',
    md: '1.5em',
    lg: '2em',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
  },
  shadows: {
    sm: '0 2px 5px rgba(0,0,0,0.1)',
    md: '0 4px 15px rgba(0,0,0,0.3)',
  },
  typography: {
    fontSizes: {
      sm: '13px',
      md: '16px',
      lg: '1.2em',
      xl: '2em',
    },
    fontWeight: {
      normal: 'normal',
      bold: 'bold',
    },
  },
  components: {
    dialog: {
      padding: '1.5em',
      zIndex: '9999',
      maxWidth: '500px',
    },
    button: {
      primary: {
        padding: '10px 20px',
        minWidth: '140px',
        color: 'white',
        background: '#2196f3',
        border: 'none',
      },
      secondary: {
        padding: '10px 20px',
        minWidth: '100px',
        color: '#333',
        background: '#f5f5f5',
        border: '1px solid #ddd',
      },
    },
  },
};

/**
 * テーマからCSSスタイルを生成するヘルパー関数群
 */
export const styles = {
  /**
   * ダイアログ用のスタイルを生成
   */
  dialog: () => ({
    padding: theme.components.dialog.padding,
    zIndex: theme.components.dialog.zIndex,
    borderRadius: theme.borderRadius.md,
    maxWidth: theme.components.dialog.maxWidth,
    boxShadow: theme.shadows.md,
    border: 'none',
  }),

  /**
   * 主要ボタン用のスタイルを生成
   */
  primaryButton: () => ({
    padding: theme.components.button.primary.padding,
    borderRadius: theme.borderRadius.sm,
    background: theme.colors.primary,
    color: theme.components.button.primary.color,
    border: theme.components.button.primary.border,
    cursor: 'pointer',
    minWidth: theme.components.button.primary.minWidth,
    fontWeight: theme.typography.fontWeight.bold,
    boxShadow: theme.shadows.sm,
  }),

  /**
   * 二次ボタン用のスタイルを生成
   */
  secondaryButton: () => ({
    padding: theme.components.button.secondary.padding,
    borderRadius: theme.borderRadius.sm,
    background: theme.components.button.secondary.background,
    color: theme.components.button.secondary.color,
    border: theme.components.button.secondary.border,
    cursor: 'pointer',
    minWidth: theme.components.button.secondary.minWidth,
  }),

  /**
   * エラーテキスト用のスタイルを生成
   */
  errorText: () => ({
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.bold,
  }),
};

// 型定義のエクスポート
export type Theme = typeof theme;
