// Paths to JSON files
const listingsUrl = 'listings.json';
const imagesUrl = 'listingimages.json';

// Grab container
const container = document.getElementById('listingContainer');

// Fetch both datasets
Promise.all([fetch(listingsUrl), fetch(imagesUrl)])
  .then(async ([listingsRes, imagesRes]) => {
    if (!listingsRes.ok || !imagesRes.ok) {
      throw new Error("Failed to load JSON data");
    }
    const listings = await listingsRes.json();
    const images = await imagesRes.json();

    // Merge listings with their images
const listingsWithImages = listings.map(listing => {
  const match = images.find(img => img.id === listing.id);
  return { ...listing, image: match ? match.url : "images/placeholder.jpg" };
});

    // Clear container
    container.innerHTML = "";

    // Render each listing
    listingsWithImages.forEach(home => {
      const card = document.createElement('article');
      card.className = 'listing-card';

      card.innerHTML = `
        <img src="${home.image}" alt="House" class="listing-image" />
        <div class="listing-details">
          <p class="listing-price">${home.price}</p>
          <p class="listing-info">
            ${home.bedrooms ?? "?"} bed | ${home.bathrooms ?? "?"} bath | ${home.sqft ? home.sqft.toLocaleString() : "?"} sqft
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
