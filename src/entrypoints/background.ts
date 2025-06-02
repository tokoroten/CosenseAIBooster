// Background script entrypoint 
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';

// Store setup
import '../store';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      console.log('Extension installed');
    }
  });
});
