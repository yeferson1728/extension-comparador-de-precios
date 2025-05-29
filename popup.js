document.addEventListener("DOMContentLoaded", async () => {
  const priceContainer = document.getElementById("price-container");
  const currentPrice = document.getElementById("current-price");
  const productTitle = document.getElementById("product-title");
  const productImage = document.getElementById("product-image");
  const priceComparison = document.getElementById("price-comparison");
  const refreshButton = document.getElementById("refresh-button");
  const loader = document.getElementById("loader");

  async function comparePrices(productName) {
    loader.style.display = "block";

    try {
      const res = await fetch("http://localhost:3000/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: productName,
          store: "amazon", // puedes cambiar por "amazon", "mercadolibre", etc.
        }),
      });

      const data = await res.json();
      const results = data.results || [];

      priceComparison.innerHTML = `
        <table class="comparison-table">
          <tr>
            <th>Tienda</th>
            <th>Producto</th>
            <th>Precio</th>
            <th>Ir</th>
          </tr>
          ${results
            .map(
              (r) => `
            <tr>
              <td>${r.store}</td>
              <td>${r.title || "N/A"}</td>
              <td>${r.price || "No disponible"}</td>
              <td><a href="${r.url}" target="_blank">Ver</a></td>
            </tr>
          `
            )
            .join("")}
        </table>
      `;
    } catch (err) {
      console.error("Error al obtener precios del backend:", err);
      priceComparison.innerHTML = "<p>Error al obtener precios</p>";
    } finally {
      loader.style.display = "none";
    }
  }

  function loadProductInfo(callback) {
    chrome.storage.local.get(["currentProduct"], (data) => {
      const productInfo = data.currentProduct;
      if (productInfo) {
        currentPrice.textContent = productInfo.price
          ? `${productInfo.currency} ${productInfo.price}`
          : "Precio no disponible";
        productTitle.textContent = productInfo.title;
        if (productInfo.image) productImage.src = productInfo.image;
        priceContainer.classList.toggle("no-price", !productInfo.price);
        if (callback) callback(productInfo);
      } else {
        currentPrice.textContent = "Precio no disponible";
        priceContainer.classList.add("no-price");
        priceComparison.innerHTML = "";
      }
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.productInfo) {
          updatePopupUI(msg.productInfo);
          fetchStoresForCountry(msg.productInfo.countryCode);
        }
      });

      function fetchStoresForCountry(code) {
        fetch(chrome.runtime.getURL("data/stores.js"))
          .then((res) => res.json())
          .then((data) => {
            const stores = data[code] || [];
            displayStoreSuggestions(stores);
          });
      }
    });
  }

  refreshButton.addEventListener("click", () => {
    loader.style.display = "block";

    chrome.runtime.sendMessage({ action: "requestProductInfo" }, (response) => {
      loader.style.display = "none";

      if (response && response.productInfo) {
        loadProductInfo((productInfo) => {
          comparePrices(productInfo.title);
        });
      } else {
        priceComparison.innerHTML =
          "<p>No se pudo obtener información del producto.</p>";
      }
    });
  });

  loadProductInfo((productInfo) => {
    if (productInfo && productInfo.title) {
      comparePrices(productInfo.title);
    }
  });
});
