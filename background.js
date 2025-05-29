import stores from "./data/stores.js";

let userCountry = null;

// Detectar país con IP Geolocation (usando fetch a un servicio público)
async function detectUserCountry() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("Failed to detect country");
    const data = await res.json();
    userCountry = data.country_code || "CO";
  } catch {
    userCountry = "CO"; // fallback
  }
}

// Ejecutar la detección al iniciar el background
detectUserCountry();

// Escuchar mensajes de content.js o popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getUserCountry") {
    sendResponse({ country: userCountry });
  } else if (request.action === "getStores") {
    const country = request.country || userCountry || "CO";
    const storesForCountry = stores[country] || stores["CO"] || [];
    sendResponse({ stores: storesForCountry });
  }
  return true; // indica que responderás async si es necesario
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "requestProductInfo") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "extractProductInfo" },
        (response) => {
          sendResponse(response);
        }
      );
    });
    return true;
  }
});
