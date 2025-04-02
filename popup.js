document.addEventListener("DOMContentLoaded", async () => {
  const priceContainer = document.getElementById("price-container");
  const currentPrice = document.getElementById("current-price");
  const productTitle = document.getElementById("product-title");
  const productImage = document.getElementById("product-image");
  const priceComparison = document.getElementById("price-comparison");
  const refreshButton = document.getElementById("refresh-button");

  function updateProductInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: getProductInfo,
        },
        (result) => {
          if (result && result[0] && result[0].result) {
            const productInfo = result[0].result;
            
            // Actualizar información del producto
            currentPrice.textContent = `$${productInfo.price}`;
            productTitle.textContent = productInfo.title;
            if (productInfo.image) {
              productImage.src = productInfo.image;
            }
            
            priceContainer.classList.remove("no-price");
            
            // Guardar información en el historial
            saveProductInfo(productInfo);
            
            // Actualizar tabla de comparación
            updatePriceComparison(productInfo);
          } else {
            currentPrice.textContent = "Precio no disponible";
            priceContainer.classList.add("no-price");
          }
        }
      );
    });
  }

  function saveProductInfo(productInfo) {
    chrome.storage.local.get(["productHistory"], (data) => {
      let history = data.productHistory || [];
      history.push({
        ...productInfo,
        date: new Date().toISOString()
      });

      if (history.length > 10) history.shift();
      chrome.storage.local.set({ productHistory: history });
    });
  }

  function updatePriceComparison(currentProduct) {
    chrome.storage.local.get(["productHistory"], (data) => {
      const history = data.productHistory || [];
      const stores = ['Amazon', 'eBay', 'MercadoLibre'];
      
      let pricesByStore = stores.map(store => {
        const storeProducts = history.filter(p => p.siteName.includes(store.toLowerCase()));
        const latestPrice = storeProducts.length > 0 ? 
          storeProducts[storeProducts.length - 1].price : '--';
        return `<tr>
          <td>${store}</td>
          <td>$${latestPrice}</td>
        </tr>`;
      });

      priceComparison.innerHTML = pricesByStore.join('');
    });
  }

  function showHistory() {
    chrome.storage.local.get(["productHistory"], (data) => {
      const history = data.productHistory || [];
      if (history.length === 0) {
        alert("No hay historial disponible.");
        return;
      }

      const historyText = history.map(p => 
        `${new Date(p.date).toLocaleDateString()}\n` +
        `${p.title}\n` +
        `Precio: $${p.price}\n` +
        `Tienda: ${p.siteName}\n` +
        "-------------------"
      ).join("\n");

      alert("Historial de Productos:\n" + historyText);
    });
  }

  // Función que extrae la información del producto de la página
  function getProductInfo() {
    const info = {
      price: null,
      title: null,
      image: null,
      siteName: window.location.hostname
    };

    if (info.siteName.includes("amazon")) {
      info.price = document.querySelector("#priceblock_ourprice, #priceblock_dealprice, .a-price-whole, .a-price span");
      info.title = document.querySelector("#productTitle");
      info.image = document.querySelector("#landingImage");
    } else if (info.siteName.includes("ebay")) {
      info.price = document.querySelector(".x-price-primary span, .notranslate");
      info.title = document.querySelector(".x-item-title");
      info.image = document.querySelector(".img img");
    } else if (info.siteName.includes("mercadolibre")) {
      info.price = document.querySelector(".ui-pdp-price__second-line span, .price-tag-fraction");
      info.title = document.querySelector(".ui-pdp-title");
      info.image = document.querySelector(".ui-pdp-gallery__figure img");
    }

    return {
      price: info.price ? info.price.innerText.replace(/[^0-9.,]/g, "").trim() : "No disponible",
      title: info.title ? info.title.innerText.trim() : "Sin título",
      image: info.image ? info.image.src : null,
      siteName: info.siteName
    };
  }

  updateProductInfo();
  refreshButton.addEventListener("click", updateProductInfo);
  priceContainer.addEventListener("dblclick", showHistory);
});
