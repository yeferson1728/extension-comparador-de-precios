// Store prices in memory
let priceHistory = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    chrome.action.openPopup();
  }
  
  if (message.action === "updateProduct" && message.productInfo) {
    // Actualizar la información del producto
    chrome.storage.local.set({ currentProduct: message.productInfo });
  }
});
