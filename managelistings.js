// ===== Paths for the main listings (same as listings.js) =====
const listingsUrl = 'listings.json';
const imagesUrl = 'listingimages.json';

// DOM elements
const container = document.getElementById('listingContainer');
const pendingContainer = document.getElementById('pendingContainer');

// ===== DEMO PENDING DATA (hard-coded for presentation) =====
const demoPending = [
  {
    id: 1,
    address: "742 Evergreen Terrace, Springfield, OH",
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2100,
    price: 375000,
    firstName: "Taylor",
    lastName: "Morgan",
    email: "taylor.morgan@example.com",
    phone: "(330) 555-0192",
    realtor: "Alex Carter"
  },
  {
    id: 2,
    address: "19 Lakeview Ct, Kent, OH",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1850,
    price: 329000,
    firstName: "Jordan",
    lastName: "Lee",
    email: "jlee@example.com",
    phone: "(330) 555-7712",
    realtor: "Maria Gomez"
  }
];

// ---- Render Pending Approvals ----
function renderPendingApprovals() {
  if (!pendingContainer) return;

  pendingContainer.innerHTML = "";

  if (!demoPending.length) {
    pendingContainer.innerHTML = `
      <p class="pending-empty">No pending submissions right now.</p>
    `;
    return;
  }

  demoPending.forEach(item => {
    const card = document.createElement("article");
    card.className = "listing-card pending-card";
    card.dataset.id = String(item.id);

    const priceText = item.price
      ? `$${Number(item.price).toLocaleString()}`
      : "Price TBD";

    const infoParts = [];
    if (item.bedrooms != null) infoParts.push(`${item.bedrooms} bed`);
    if (item.bathrooms != null) infoParts.push(`${item.bathrooms} bath`);
    if (item.sqft != null) infoParts.push(`${Number(item.sqft).toLocaleString()} sqft`);
    const infoText = infoParts.length ? infoParts.join(" | ") : "Details pending";

    const sellerName =
      [item.firstName, item.lastName].filter(Boolean).join(" ") || "Unknown seller";

    card.innerHTML = `
      <div class="listing-content">
        <p class="pending-badge">Client Submission</p>
        <div class="listing-details">
          <p class="listing-price">${priceText}</p>
          <p class="listing-info">${infoText}</p>
          <p class="listing-address">${item.address || "No address provided"}</p>
          <p class="pending-meta">
            Seller: ${sellerName}
            ${item.email ? ` • ${item.email}` : ""}
            ${item.phone ? ` • ${item.phone}` : ""}
            ${item.realtor ? ` • Realtor: ${item.realtor}` : ""}
          </p>
        </div>
      </div>

      <div class="manage-actions">
        <div class="manage-buttons">
          <button class="btn-manage btn-approve">Approve</button>
          <button class="btn-manage btn-deny">Deny</button>
        </div>
      </div>
    `;

    pendingContainer.appendChild(card);
  });
}

// Approve / Deny buttons (demo-only)
if (pendingContainer) {
  pendingContainer.addEventListener("click", (e) => {
    if (!e.target.matches(".btn-approve, .btn-deny")) return;

    const card = e.target.closest(".listing-card");
    if (!card) return;

    const id = Number(card.dataset.id);
    const idx = demoPending.findIndex(x => x.id === id);
    if (idx !== -1) {
      demoPending.splice(idx, 1);
    }

    renderPendingApprovals();
  });
}

// Initial load for pending
renderPendingApprovals();

// ===== MAIN MANAGE LISTINGS (JSON-driven, remove-only) =====
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

    // Helper: incomplete = missing price OR address OR image
    function isIncompleteListing(home) {
      const priceMissing =
        home.price == null ||
        home.price === "null" ||
        home.price === "";
      const addressMissing =
        !home.address ||
        home.address === "null" ||
        home.address === "";
      const imageMissing = !home.hasImage;

      return priceMissing || addressMissing || imageMissing;
    }

    // Order: complete first, incomplete (incl. no-image) last
    const orderedListings = [
      ...listingsWithImages.filter(home => !isIncompleteListing(home)),
      ...listingsWithImages.filter(home => isIncompleteListing(home))
    ];

    if (!container) return;

    // CLEAR CONTAINER
    container.innerHTML = "";

    // CREATE CARDS (remove-only)
    orderedListings.forEach(home => {
      const idStr = String(home.id);

      const card = document.createElement('article');
      card.className = 'listing-card';
      card.dataset.id = idStr;

      // store numeric price for filters
      let priceNum = NaN;
      if (typeof home.price === 'number') {
        priceNum = home.price;
      } else if (typeof home.price === 'string') {
        const digits = home.price.replace(/[^\d]/g, '');
        if (digits) priceNum = Number(digits);
      }
      card.dataset.price = Number.isNaN(priceNum) ? '' : String(priceNum);

      card.innerHTML = `
        <img src="${home.image}" alt="House" class="listing-image" />
        <div class="listing-content">
          <div class="listing-details">
            <p class="listing-price">${home.price ?? "Price TBD"}</p>
            <p class="listing-info">
              ${home.bedrooms ?? "?"} bed | 
              ${home.bathrooms ?? "?"} bath | 
              ${home.sqft ? home.sqft.toLocaleString() : "?"} sqft
            </p>
            <p class="listing-address">${home.address ?? "Address coming soon"}</p>
          </div>
        </div>
        <div class="manage-actions">
          <div class="manage-buttons">
            <button class="btn-manage btn-remove">Remove</button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // REMOVE existing listing cards
    container.addEventListener('click', e => {
      if (e.target.classList.contains('btn-remove')) {
        const card = e.target.closest('.listing-card');
        if (card) card.remove();
      }
    });

    // ====== FILTERS (search + price) ======
    const filterButton = document.getElementById('applyManageFilters');
    const resetButton = document.getElementById('resetManageFilters');
    const searchInput = document.getElementById('searchManage');
    const priceFilter = document.getElementById('priceManageFilter');

    function applyManageFilters() {
      const search = (searchInput?.value || '').toLowerCase().trim();
      const maxPrice = priceFilter?.value ? Number(priceFilter.value) : Infinity;

      const cards = container.querySelectorAll('.listing-card');
      cards.forEach(card => {
        const address = (card.querySelector('.listing-address')?.textContent || '').toLowerCase();
        const cardPrice = card.dataset.price ? Number(card.dataset.price) : 0;

        let match = true;

        if (search && !address.includes(search)) {
          match = false;
        }

        if (match && maxPrice !== Infinity && cardPrice && cardPrice > maxPrice) {
          match = false;
        }

        card.style.display = match ? '' : 'none';
      });
    }

    if (filterButton) {
      filterButton.addEventListener('click', applyManageFilters);
    }
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (priceFilter) priceFilter.value = '';
        applyManageFilters();
      });
    }

    // DEMO: make the first manage listing card open housedemo.html when clicked
    const demoManageCard = container.querySelector('.listing-card');
    if (demoManageCard) {
      demoManageCard.classList.add('demo-detail-card');
      demoManageCard.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        window.location.href = 'housedemo.html';
      });
    }
  })
  .catch(err => {
    console.error("Error loading manage listings:", err);
    if (container) {
      container.innerHTML = `
        <p style="color: red; padding: 1rem;">
          Failed to load listings. Please try again later.
        </p>`;
    }
  });
