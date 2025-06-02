// Background script entrypoint 
import { browser } from 'wxt/browser';

// Store setup
import './store';

browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('Extension installed');
  }
});
