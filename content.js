(() => {
  // Create and add floating button
  function createFloatingButton() {
    // Remove any existing button first
    const existingButton = document.getElementById('price-compare-button');
    if (existingButton) {
      existingButton.remove();
    }

    const floatingButton = document.createElement('div');
    floatingButton.id = 'price-compare-button';
    floatingButton.innerHTML = '💰';
    floatingButton.style.cssText = `
      position: fixed;
      top: 80px;
      right: 30px;
      background-color: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      font-size: 24px;
      transition: transform 0.2s;
    `;
    
    document.body.appendChild(floatingButton);

    floatingButton.addEventListener('mouseover', () => {
      floatingButton.style.transform = 'scale(1.1)';
    });

    floatingButton.addEventListener('mouseout', () => {
      floatingButton.style.transform = 'scale(1)';
    });

    floatingButton.addEventListener('click', async () => {
      floatingButton.style.backgroundColor = '#45a049';
      setTimeout(() => {
        floatingButton.style.backgroundColor = '#4CAF50';
      }, 200);

      try {
        const productInfo = await getProductInfo();
        if (productInfo) {
          chrome.runtime.sendMessage({ 
            action: "updateProduct",
            productInfo: productInfo 
          });
          chrome.runtime.sendMessage({ action: "openPopup" });
        }
      } catch (error) {
        console.error('Error handling button click:', error);
      }
    });
}

// Ensure the button is created when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFloatingButton);
} else {
  createFloatingButton();
}

  async function getExchangeRate(fromCurrency = 'USD') {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      const data = await response.json();
      return data.rates;
    } catch (error) {
      console.error('Error getting exchange rates:', error);
      return null;
    }
  }

  async function getProductInfo() {
    try {
      let info = {
        price: null,
        title: null,
        image: null,
        url: window.location.href,
        siteName: window.location.hostname,
        currency: 'USD'
      };

      if (info.siteName.includes("amazon")) {
        info.price = document.querySelector(
          "#priceblock_ourprice, #priceblock_dealprice, .a-price-whole, .a-price span, #price_inside_buybox"
        );
        info.title = document.querySelector("#productTitle, #title");
        info.image = document.querySelector(
          "#landingImage, #imgBlkFront, #main-image, .a-dynamic-image, #imgTagWrapperId img"
        );
        info.currency = document.querySelector(".a-price-symbol")?.textContent?.trim() || 'USD';

      } else if (info.siteName.includes("ebay")) {
        info.price = document.querySelector(
          "#prcIsum, .x-bin-price__content, .x-price-primary, .vi-price, .display-price"
        );
        info.title = document.querySelector(
          "h1.x-item-title__mainTitle, .it-ttl, #itemTitle"
        );
        info.image = document.querySelector(
          "#icImg, #mainImgHldr img, .vi-image-gallery__image img, .img_image"
        );
        const currencyElement = document.querySelector(
          "[itemprop='priceCurrency'], .notranslate, .vi-price"
        );
        info.currency = currencyElement?.getAttribute('content') || 
                       currencyElement?.getAttribute('currency') || 
                       (currencyElement?.textContent?.match(/[A-Z]{3}/) || [])[0] || 
                       'USD';

      } else if (info.siteName.includes("mercadolibre")) {
        info.price = document.querySelector(
          ".ui-pdp-price__second-line span, .andes-money-amount__fraction, .price-tag-fraction"
        );
        info.title = document.querySelector(".ui-pdp-title");
        info.image = document.querySelector(
          ".ui-pdp-gallery__figure img, .ui-pdp-image img, .slick-slide.selected img"
        );
        info.currency = 'COP';

      } else if (info.siteName.includes("exito")) {
        info.price = document.querySelector(
          ".exito-vtex-components-4-x-currencyContainer, .exito-vtex-components-4-x-sellingPrice, .product-price"
        );
        info.title = document.querySelector(
          ".vtex-store-components-3-x-productBrand, .product-name"
        );
        info.image = document.querySelector(
          ".vtex-store-components-3-x-productImageTag, .product-image"
        );
        info.currency = 'COP';

      } else if (info.siteName.includes("falabella")) {
        info.price = document.querySelector(
          ".price-main, .price-best, .fb-price__best"
        );
        info.title = document.querySelector(
          ".product-name, .fb-product__title"
        );
        info.image = document.querySelector(
          ".primary-image, .fb-product__image img"
        );
        info.currency = 'COP';

      } else if (info.siteName.includes("alkosto")) {
        info.price = document.querySelector(
          ".price, .product-price, .alkosto-price"
        );
        info.title = document.querySelector(
          ".product-name, .name"
        );
        info.image = document.querySelector(
          ".product-image img, .main-image"
        );
        info.currency = 'COP';

      } else if (info.siteName.includes("claro")) {
        info.price = document.querySelector(
          ".price-value, .product-price, .precio-final"
        );
        info.title = document.querySelector(
          ".product-name, .nombre-producto, h1.title"
        );
        info.image = document.querySelector(
          ".product-image-photo, .imagen-producto img"
        );
        info.currency = 'COP';

      } else if (info.siteName.includes("movistar")) {
        info.price = document.querySelector(
          ".price-final, .precio-producto, .product-price"
        );
        info.title = document.querySelector(
          ".product-title, .nombre-equipo, h1.title"
        );
        info.image = document.querySelector(
          ".product-image img, .imagen-equipo"
        );
        info.currency = 'COP';

      } else if (info.siteName.includes("tigo")) {
        info.price = document.querySelector(
          ".price, .valor-precio, .precio-final"
        );
        info.title = document.querySelector(
          ".product-name, .nombre-producto"
        );
        info.image = document.querySelector(
          ".product-image-container img, .imagen-producto"
        );
        info.currency = 'COP';

      } else if (info.siteName.includes("wom")) {
        info.price = document.querySelector(
          ".price-box, .product-price, .precio-final"
        );
        info.title = document.querySelector(
          ".product-name, .nombre-equipo"
        );
        info.image = document.querySelector(
          ".product-image-photo, .imagen-equipo"
        );
        info.currency = 'COP';
      }

      const rawPrice = info.price?.textContent?.replace(/[^0-9.,]/g, "").trim() || "No disponible";
      let numericPrice = null;
      
      if (rawPrice !== "No disponible") {
        try {
          numericPrice = parseFloat(rawPrice.replace(/,/g, ''));
          if (isNaN(numericPrice)) throw new Error('Invalid price format');
          
          const rates = await getExchangeRate(info.currency);
          if (rates) {
            const userCountry = navigator.language.split('-')[1] || 'CO';
            const targetCurrency = {
              'CO': 'COP',
              'MX': 'MXN',
              'AR': 'ARS',
              'US': 'USD',
              'CL': 'CLP',
              'PE': 'PEN',
              'BR': 'BRL'
            }[userCountry] || 'COP';

            if (rates[targetCurrency]) {
              numericPrice = (numericPrice * rates[targetCurrency]).toFixed(2);
              info.currency = targetCurrency;
            }
          }
        } catch (error) {
          console.error('Error processing price:', error);
          numericPrice = null;
        }
      }

      return {
        price: numericPrice ?? rawPrice,
        currency: info.currency,
        title: info.title?.textContent?.trim() || "Sin título",
        image: info.image?.src || null,
        url: info.url,
        siteName: info.siteName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getProductInfo:', error);
      return null;
    }
  }

  // Initialize observer and send initial data
  (async () => {
    try {
      const initialInfo = await getProductInfo();
      if (initialInfo) {
        chrome.runtime.sendMessage({ productInfo: initialInfo });
      }
    } catch (error) {
      console.error('Error sending initial product info:', error);
    }
  })();

  const observer = new MutationObserver(async () => {
    try {
      const updatedInfo = await getProductInfo();
      if (updatedInfo) {
        chrome.runtime.sendMessage({ productInfo: updatedInfo });
      }
    } catch (error) {
      console.error('Error in observer callback:', error);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
})();