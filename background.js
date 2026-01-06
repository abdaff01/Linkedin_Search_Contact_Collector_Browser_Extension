// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Contact Extractor installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  return true;
});