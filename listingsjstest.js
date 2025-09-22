// Path to JSON (make sure listings.json is in the same folder as listing.html)
const dataUrl = 'listings.json';

// Grab container
const container = document.getElementById('listingContainer');

// Fetch and populate listings
fetch(dataUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("Loaded listings:", data); // Debugging

    // Clear out any placeholder card in HTML
    container.innerHTML = "";

    // Create a card for each listing
    data.forEach(home => {
      const card = document.createElement('article');
      card.className = 'listing-card';

      card.innerHTML = `
        <img src="${home.image}" alt="House" class="listing-image" />
        <div class="listing-details">
          <p class="listing-price">${home.price}</p>
          <p class="listing-info">
            ${home.bedrooms} bed | ${home.bathrooms} bath | ${home.sqft.toLocaleString()} sqft
          </p>
          <p class="listing-address">${home.address}</p>
        </div>
      `;

      container.appendChild(card);
    });
  })
  .catch(err => {
    console.error("Error loading listings:", err);
    container.innerHTML = "<p>⚠️ Failed to load listings. Please try again later.</p>";
  });
