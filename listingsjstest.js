// Path to JSON
const dataUrl = 'listings.json';  // Adjust this path if needed

// Grab container
const container = document.getElementById('listingContainer');

// Populate
fetch(dataUrl)
  .then(response => response.json())
  .then(data => {
    data.forEach(home => {
      const card = document.createElement('article');
      card.className = 'listing-card';

      card.innerHTML = `
        <img src="${home.image}" alt="House" class="listing-image" />
        <div class="listing-details">
          <p class="listing-price">${home.price}</p>
          <p class="listing-info">${home.bedrooms} bed | ${home.bathrooms} bath | ${home.sqft.toLocaleString()} sqft</p>
          <p class="listing-address">${home.address}</p>
        </div>
      `;

      container.appendChild(card);
    });
  })
  //Error Message
  .catch(err => {
    container.innerHTML = "<p>Failed to load listings. Please try again later.</p>";
    console.error("Error loading listings:", err);
  });