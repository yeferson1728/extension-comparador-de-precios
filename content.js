(() => {
  function createFloatingButton() {
    if (document.getElementById("price-compare-button")) return;

    const floatingButton = document.createElement("div");
    floatingButton.id = "price-compare-button";
    floatingButton.innerHTML = "💰";
    floatingButton.style.cssText = `
      position: fixed;
      top: 80px;
      right: 30px;
      background-color: #bf3bc3;
      color: white;
      padding: 15px;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      font-size: 24px;
      transition: transform 0.2s, background-color 0.3s;
    `;

    floatingButton.addEventListener("mouseover", () => {
      floatingButton.style.transform = "scale(1.1)";
    });

    floatingButton.addEventListener("mouseout", () => {
      floatingButton.style.transform = "scale(1)";
    });

    floatingButton.addEventListener("click", async () => {
      floatingButton.style.backgroundColor = "#a02e9e";
      setTimeout(() => {
        floatingButton.style.backgroundColor = "#bf3bc3";
      }, 300);

      try {
        const productInfo = await getProductInfo();
        if (productInfo) {
          chrome.runtime.sendMessage({ action: "updateProduct", productInfo });
          chrome.runtime.sendMessage({ action: "openPopup" });
        }
      } catch (e) {
        console.error("Error al obtener info del producto:", e);
      }
    });

    document.body.appendChild(floatingButton);
  }

  async function getExchangeRate(fromCurrency = "USD") {
    try {
      const res = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      if (!res.ok) throw new Error("No se pudo obtener tasa de cambio");
      const data = await res.json();
      return data.rates;
    } catch (e) {
      console.error("Error tasa de cambio:", e);
      return null;
    }
  }

  async function getProductInfo() {
    const info = {
      title: null,
      price: null,
      image: null,
      url: window.location.href,
      siteName: window.location.hostname,
      currency: "USD",
    };

    const site = info.siteName;

    if (site.includes("amazon")) {
      info.price = document.querySelector(
        "#priceblock_ourprice, #priceblock_dealprice, .a-price span"
      );
      info.title = document.querySelector("#productTitle");
      info.image = document.querySelector(
        "#landingImage, #imgTagWrapperId img"
      );
    } else if (site.includes("ebay")) {
      info.price = document.querySelector(
        "#prcIsum, .x-price-primary, .display-price"
      );
      info.title = document.querySelector(
        "h1.x-item-title__mainTitle, #itemTitle"
      );
      info.image = document.querySelector("#icImg");
    } else if (site.includes("mercadolibre")) {
      info.price = document.querySelector(
        ".price-tag-fraction, .andes-money-amount__fraction"
      );
      info.title = document.querySelector(".ui-pdp-title");
      info.image = document.querySelector(".ui-pdp-gallery__figure img");

      info.currency = "COP";
    }

    const rawPrice =
      info.price?.textContent?.replace(/[^\d.,]/g, "").trim() || "0";
    let numericPrice = parseFloat(rawPrice.replace(",", ""));

    if (!isNaN(numericPrice)) {
      const rates = await getExchangeRate(info.currency);
      if (rates) {
        const locale = navigator.language.split("-")[1] || "CO";
        const preferred = { CO: "COP", US: "USD", MX: "MXN" }[locale] || "USD";
        if (rates[preferred]) {
          numericPrice = (numericPrice * rates[preferred]).toFixed(2);
          info.currency = preferred;
        }
      }
    }

    return {
      title: info.title?.textContent?.trim() || "Sin título",
      price: numericPrice || "No disponible",
      image: info.image?.src || "",
      url: info.url,
      siteName: info.siteName,
      currency: info.currency,
      timestamp: new Date().toISOString(),
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createFloatingButton);
  } else {
    createFloatingButton();
  }

  // Reintenta si el botón es eliminado
  const ensureButton = new MutationObserver(() => {
    if (!document.getElementById("price-compare-button")) {
      createFloatingButton();
    }
  });
  ensureButton.observe(document.body, { childList: true, subtree: true });
})();

async function getProductInfo() {
  const title = document.querySelector("h1")?.innerText || document.title;
  const price =
    document.querySelector('[itemprop="price"]')?.content ||
    document.querySelector(".price")?.innerText ||
    null;
  const image = document.querySelector("img")?.src || null;

  return {
    title: title.trim(),
    price: price ? price.trim().replace(/[^\d.,]/g, "") : null,
    currency: "$",
    image,
    timestamp: Date.now(),
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extractProductInfo") {
    getProductInfo().then((info) => {
      chrome.storage.local.set({ currentProduct: info }, () => {
        sendResponse({ success: true, productInfo: info });
      });
    });
    return true;
  }
});
