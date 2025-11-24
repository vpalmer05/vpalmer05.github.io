// PATH
const listingsUrl = 'listings.json';
const imagesUrl = 'listingimages.json';

// FAVORITES HELPERS
const FAVORITES_KEY = 'vvFavorites';

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(favs) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

// GRAB CONTAINER
const container = document.getElementById('listingContainer');

// FETCH DATASET
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

    // Current favorites (as strings)
    const favorites = getFavorites().map(String);

    // CLEAR CONTAINER
    container.innerHTML = "";

    // CARDS
    listingsWithImages.forEach(home => {
      const idStr = String(home.id);
      const isFav = favorites.includes(idStr);

      const card = document.createElement('article');
      card.className = 'listing-card';
      card.dataset.id = idStr;

      card.innerHTML = `
        <button class="favorite-heart${isFav ? ' active' : ''}" aria-label="Add to favorites">
          ${isFav ? '♥' : '♡'}
        </button>
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

    // FAVORITE HEART CLICK HANDLER
    container.addEventListener('click', e => {
      if (e.target.classList.contains('favorite-heart')) {
        const heart = e.target;
        const card = heart.closest('.listing-card');
        const idStr = card.dataset.id;

        let favorites = getFavorites().map(String);

        // Toggle UI
        const nowActive = heart.classList.toggle('active');
        heart.textContent = nowActive ? '♥' : '♡';

        // Update localStorage
        if (nowActive) {
          if (!favorites.includes(idStr)) {
            favorites.push(idStr);
          }
        } else {
          favorites = favorites.filter(id => id !== idStr);
        }

        saveFavorites(favorites);
      }
    });

    // DEMO: make the first listing card open housedemo.html when clicked
    const demoCard = container.querySelector('.listing-card');
    if (demoCard) {
      demoCard.classList.add('demo-detail-card');
      demoCard.addEventListener('click', (e) => {
        // Ignore clicks on the favorite heart so it still works
        if (e.target.closest('.favorite-heart')) return;
        window.location.href = 'housedemo.html';
      });
    }
  })
  .catch(err => {
    console.error("Error loading listings:", err);
    if (container) {
      container.innerHTML = `
        <p style="color: red; padding: 1rem;">
          Failed to load listings. Please try again later.
        </p>`;
    }
  });
