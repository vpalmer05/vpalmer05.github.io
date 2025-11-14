const listingsUrl = 'listings.json';
const imagesUrl = 'listingimages.json';
const FAVORITES_KEY = 'vvFavorites';

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch (e) {
    return [];
  }
}

const container = document.getElementById('favoritesContainer');
const favoriteIds = getFavorites().map(String);

if (favoriteIds.length === 0) {
  container.innerHTML = `
    <p style="padding: 1rem; color: #111;">
      You haven't favorited any homes yet. Go to the Listings page and tap the ♥ icon.
    </p>
  `;
} else {
  Promise.all([fetch(listingsUrl), fetch(imagesUrl)])
    .then(async ([listingsRes, imagesRes]) => {
      if (!listingsRes.ok || !imagesRes.ok) {
        throw new Error("Failed to load JSON data");
      }

      const listings = await listingsRes.json();
      const images = await imagesRes.json();

      const listingsWithImages = listings.map(listing => {
        const match = images.find(img => img.id === listing.id);
        return {
          ...listing,
          image: match ? match.url : "images/placeholder.jpg"
        };
      });

      const favListings = listingsWithImages.filter(home =>
        favoriteIds.includes(String(home.id))
      );

      if (favListings.length === 0) {
        container.innerHTML = `
          <p style="padding: 1rem; color: #111;">
            No matching favorite homes found. Try re-favoriting from the Listings page.
          </p>
        `;
        return;
      }

      container.innerHTML = "";

      favListings.forEach(home => {
        const card = document.createElement('article');
        card.className = 'listing-card';

        card.innerHTML = `
          <img src="${home.image}" alt="House" class="listing-image" />
          <div class="listing-content">
            <div class="listing-details">
              <p class="listing-price">${home.price}</p>
              <p class="listing-info">
                ${home.bedrooms ?? "?"} bed | ${home.bathrooms ?? "?"} bath | 
                ${home.sqft ? home.sqft.toLocaleString() : "?"} sqft
              </p>
              <p class="listing-address">${home.address}</p>
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Error loading favorites:", err);
      container.innerHTML = `
        <p style="color: red; padding: 1rem;">
          Failed to load favorites. Please try again later.
        </p>
      `;
    });
}
