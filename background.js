// Store prices in memory
let priceHistory = [];

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const button = document.getElementById('price-compare-button');
      if (button) button.click();
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    chrome.action.openPopup();
  }
  
  if (message.action === "updateProduct" && message.productInfo) {
    chrome.storage.local.set({ currentProduct: message.productInfo });
  }    
});
