(() => {
  // Create and add floating button
  function createFloatingButton() {
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
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      font-size: 24px;
    `;
    
    document.body.appendChild(floatingButton);

    floatingButton.addEventListener('click', () => {
      // Simular clic en el icono de la extensión
      chrome.runtime.sendMessage({ action: "openPopup" });
      
      // También enviar la información del producto
      getProductInfo().then(productInfo => {
        chrome.runtime.sendMessage({ 
          action: "updateProduct",
          productInfo: productInfo 
        });
      });
    });
  }

  // Ensure button is created after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
  } else {
    createFloatingButton();
  }

  async function getExchangeRate(fromCurrency = 'USD') {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      return data.rates;
    } catch (error) {
      console.error('Error getting exchange rates:', error);
      return null;
    }
  }

  async function getProductInfo() {
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
      info.currency = document.querySelector(".a-price-symbol")?.innerText?.trim() || 'USD';

    } else if (info.siteName.includes("ebay")) {
      info.price = document.querySelector(
        "#prcIsum, .x-bin-price__content, .x-price-primary, .vi-price, .display-price"
      )?.textContent || document.querySelector(
        "[itemprop='price']"
      )?.getAttribute('content');
      
      info.title = document.querySelector(
        "h1.x-item-title__mainTitle, .it-ttl, #itemTitle"
      );
      
      info.image = document.querySelector(
        "#icImg, #mainImgHldr img, .vi-image-gallery__image img, .img_image"
      ) || document.querySelector(
        "img.img[src*='i.ebayimg'], .vi_pic_1_thumb"
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
    }

    const rawPrice = info.price ? info.price.innerText.replace(/[^0-9.,]/g, "").trim() : "No disponible";
    
    if (rawPrice !== "No disponible") {
      const numericPrice = parseFloat(rawPrice.replace(/,/g, ''));
      const rates = await getExchangeRate(info.currency);
      
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

      if (rates && rates[targetCurrency]) {
        const convertedPrice = (numericPrice * rates[targetCurrency]).toFixed(2);
        info.price = convertedPrice;
        info.currency = targetCurrency;
      } else {
        info.price = numericPrice;
      }
    }

    return {
      price: info.price,
      currency: info.currency,
      title: info.title ? info.title.innerText.trim() : "Sin título",
      image: info.image ? info.image.src : null,
      url: info.url,
      siteName: info.siteName,
      timestamp: new Date().toISOString()
    };
  }

  chrome.runtime.sendMessage({ productInfo: getProductInfo() });

  const observer = new MutationObserver(() => {
    chrome.runtime.sendMessage({ productInfo: getProductInfo() });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
