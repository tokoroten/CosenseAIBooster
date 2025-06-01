/**
 * Popup script for Cosense AI Booster
 */

document.addEventListener('DOMContentLoaded', () => {
  // 設定ボタンにイベントリスナーを追加
  const openOptionsButton = document.getElementById('open-options');
  if (openOptionsButton) {
    openOptionsButton.addEventListener('click', openOptions);
  }

  // 現在のタブがCosenseページかどうかをチェック
  checkCurrentTab();
});

/**
 * 設定ページを開く
 */
function openOptions(): void {
  chrome.runtime.openOptionsPage();
}

/**
 * 現在のタブがCosenseページかどうかをチェック
 */
function checkCurrentTab(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const statusMessage = document.getElementById('status-message');
    
    if (statusMessage) {
      if (currentTab.url && currentTab.url.includes('scrapbox.io')) {
        statusMessage.textContent = 'Cosenseページで動作中';
        statusMessage.style.color = '#4CAF50';
      } else {
        statusMessage.textContent = 'Cosenseページでのみ機能します';
        statusMessage.style.color = '#F44336';
      }
    }
  });
}
