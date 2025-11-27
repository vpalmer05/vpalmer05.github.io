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
        image: match ? match.url : "images/placeholder.jpg",
        hasImage: Boolean(match) // <— real image vs placeholder
      };
    });

    // Helper: mark incomplete listings (missing price OR address OR image)
    function isIncompleteListing(home) {
      const priceMissing =
        home.price == null ||
        home.price === "null" ||
        home.price === "";
      const addressMissing =
        !home.address ||
        home.address === "null" ||
        home.address === "";
      const imageMissing = !home.hasImage; // <— no matching image id

      return priceMissing || addressMissing || imageMissing;
    }

    // Order: complete first, incomplete last
    const orderedListings = [
      ...listingsWithImages.filter(home => !isIncompleteListing(home)),
      ...listingsWithImages.filter(home => isIncompleteListing(home))
    ];

    // Current favorites (as strings)
    const favorites = getFavorites().map(String);

    // CLEAR CONTAINER
    container.innerHTML = "";

    // CARDS
    orderedListings.forEach(home => {
      const idStr = String(home.id);
      const isFav = favorites.includes(idStr);

      const card = document.createElement('article');
      card.className = 'listing-card';
      card.dataset.id = idStr;

      // store data for filters
      const bedroomsNum = home.bedrooms != null ? Number(home.bedrooms) : NaN;
      let priceNum = NaN;
      if (typeof home.price === 'number') {
        priceNum = home.price;
      } else if (typeof home.price === 'string') {
        const digits = home.price.replace(/[^\d]/g, '');
        if (digits) priceNum = Number(digits);
      }
      card.dataset.bedrooms = Number.isNaN(bedroomsNum) ? '' : String(bedroomsNum);
      card.dataset.price = Number.isNaN(priceNum) ? '' : String(priceNum);

      card.innerHTML = `
        <button class="favorite-heart${isFav ? ' active' : ''}" aria-label="Add to favorites">
          ${isFav ? '♥' : '♡'}
        </button>
        <img src="${home.image}" alt="House" class="listing-image" />
        <div class="listing-content">
          <div class="listing-details">
            <p class="listing-price">${home.price ?? "Price TBD"}</p>
            <p class="listing-info">
              ${home.bedrooms ?? "?"} bed | ${home.bathrooms ?? "?"} bath | 
              ${home.sqft ? home.sqft.toLocaleString() : "?"} sqft
            </p>
            <p class="listing-address">${home.address ?? "Address coming soon"}</p>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // FAVORITE HEART CLICK HANDLER (event delegation)
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

    // ====== FILTERS ======
    const searchInput = document.getElementById('searchInput');
    const bedFilter = document.getElementById('bedFilter');
    const priceFilter = document.getElementById('priceFilter');
    const resetBtn = document.getElementById('resetFilters');

    function applyFilters() {
      const searchVal = (searchInput?.value || '').trim().toLowerCase();
      const minBeds = bedFilter?.value ? Number(bedFilter.value) : 0;
      const maxPrice = priceFilter?.value ? Number(priceFilter.value) : Infinity;

      const cards = container.querySelectorAll('.listing-card');
      cards.forEach(card => {
        const addressText = (card.querySelector('.listing-address')?.textContent || '').toLowerCase();
        const cardBeds = card.dataset.bedrooms ? Number(card.dataset.bedrooms) : 0;
        const cardPrice = card.dataset.price ? Number(card.dataset.price) : 0;

        let match = true;

        // Search by address/city text
        if (searchVal && !addressText.includes(searchVal)) {
          match = false;
        }

        // Bedrooms (treat 0/unknown as passing)
        if (match && minBeds && cardBeds && cardBeds < minBeds) {
          match = false;
        }

        // Price (treat 0/unknown as passing)
        if (match && maxPrice !== Infinity && cardPrice && cardPrice > maxPrice) {
          match = false;
        }

        card.style.display = match ? '' : 'none';
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
    if (bedFilter) {
      bedFilter.addEventListener('change', applyFilters);
    }
    if (priceFilter) {
      priceFilter.addEventListener('change', applyFilters);
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (bedFilter) bedFilter.value = '';
        if (priceFilter) priceFilter.value = '';
        applyFilters();
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

