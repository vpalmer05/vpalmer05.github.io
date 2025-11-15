// PATHS – same as listings.js
const listingsUrl = 'listings.json';
const imagesUrl = 'listingimages.json';

// GRAB CONTAINER (same pattern as listings.js)
const container = document.getElementById('listingContainer');

// FETCH DATASET
Promise.all([fetch(listingsUrl), fetch(imagesUrl)])
  .then(async ([listingsRes, imagesRes]) => {

    if (!listingsRes.ok || !imagesRes.ok) {
      throw new Error("Failed to load JSON data");
    }

    const listings = await listingsRes.json();
    const images = await imagesRes.json();

    // Attach image URLs to each listing (same idea as listings.js)
    const listingsWithImages = listings.map(listing => {
      const match = images.find(img => img.id === listing.id);
      return {
        ...listing,
        image: match ? match.url : "images/placeholder.jpg"
      };
    });

    // CLEAR CONTAINER
    container.innerHTML = "";

    // BUILD MANAGE CARDS
    listingsWithImages.forEach(home => {
      const idStr = String(home.id);

      const card = document.createElement('article');
      card.className = 'listing-card';
      card.dataset.id = idStr;
      card.dataset.status = 'active'; // default; can be wired to JSON later

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
        <div class="manage-actions">
          <span class="status-pill status-active">Active</span>
          <div class="manage-buttons">
            <button class="btn-manage btn-status">Mark as Sold</button>
            <button class="btn-manage btn-remove">Remove</button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // SET UP MANAGE BUTTON BEHAVIOR (event delegation)
    container.addEventListener('click', e => {
      const target = e.target;

      // Remove listing card
      if (target.classList.contains('btn-remove')) {
        const card = target.closest('.listing-card');
        if (card) card.remove();
      }

      // Toggle Active / Sold
      if (target.classList.contains('btn-status')) {
        const card = target.closest('.listing-card');
        if (!card) return;

        const pill = card.querySelector('.status-pill');
        const current = card.dataset.status;

        if (current === 'active') {
          card.dataset.status = 'sold';
          pill.textContent = 'Sold';
          pill.classList.remove('status-active');
          pill.classList.add('status-sold');
          target.textContent = 'Mark as Active';
        } else {
          card.dataset.status = 'active';
          pill.textContent = 'Active';
          pill.classList.remove('status-sold');
          pill.classList.add('status-active');
          target.textContent = 'Mark as Sold';
        }
      }
    });

    // FILTERS (same style as listings, but for status + address text)
    const filterButton = document.getElementById('applyManageFilters');
    const searchInput = document.getElementById('searchManage');
    const statusSelect = document.getElementById('statusFilter');

    if (filterButton && searchInput && statusSelect) {
      filterButton.addEventListener('click', () => {
        const search = searchInput.value.toLowerCase();
        const status = statusSelect.value;
        const cards = container.querySelectorAll('.listing-card');

        cards.forEach(card => {
          const address = card.querySelector('.listing-address')?.textContent.toLowerCase() || '';

          const textMatch = search === '' || address.includes(search);
          const statusMatch = status === 'all' || card.dataset.status === status;

          card.style.display = (textMatch && statusMatch) ? '' : 'none';
        });
      });
    }
  })
  .catch(err => {
    console.error("Error loading manage listings:", err);
    container.innerHTML = `
      <p style="color: red; padding: 1rem;">
        Failed to load listings. Please try again later.
      </p>`;
  });
