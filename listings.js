// PATH
const listingsUrl = 'listings.json';
const imagesUrl = 'listingimages.json';

// GRAB CONTAINER
const container = document.getElementById('listingContainer');

// FETCH DATASET
Promise.all([fetch(listingsUrl), fetch(imagesUrl)])
  .then(async ([listingsRes, imagesRes]) => {

    // CHECK
    if (!listingsRes.ok || !imagesRes.ok) {
      throw new Error("Failed to load JSON data");
    }

    // PARSE JSON
    const listings = await listingsRes.json();
    const images = await imagesRes.json();

    // MERGE
    const listingsWithImages = listings.map(listing => {
      const match = images.find(img => img.id === listing.id);
      return {
        ...listing,
        image: match ? match.url : "images/placeholder.jpg"
      };
    });

    // CLEAR CONTAINER
    container.innerHTML = "";

    // CARDS
    listingsWithImages.forEach(home => {
      const card = document.createElement('article');
      card.className = 'listing-card';

      card.innerHTML = `
        <button class="favorite-heart" aria-label="Add to favorites">♡</button>
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

    // FAVORITE HEART
    container.addEventListener('click', e => {
      if (e.target.classList.contains('favorite-heart')) {
        e.target.classList.toggle('active');
        e.target.textContent = e.target.classList.contains('active') ? '♥' : '♡';
      }
    });
  })
  .catch(err => {
    console.error("Error loading listings:", err);
    container.innerHTML = `
      <p style="color: red; padding: 1rem;">
        Failed to load listings. Please try again later.
      </p>`;
  });

