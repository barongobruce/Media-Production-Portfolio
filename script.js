"use strict";

/* Config */
const DATA_FILE = "gallery.json"; // keep in project root

/* DOM refs */
const galleryContainer = document.getElementById("gallery-container");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category-filter");
const clearBtn = document.getElementById("clear-filters");

let photos = []; // loaded data
const STORAGE_KEY = "bv_gallery_likes"; // localStorage key

// helper: load likes object from localStorage
function loadLikes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { counts: {}, liked: {} };
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse likes from localStorage", e);
    return { counts: {}, liked: {} };
  }
}
function saveLikes(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* Fetch photos and init */
async function loadGallery() {
  try {
    const res = await fetch(DATA_FILE);
    if (!res.ok) throw new Error(`Failed to fetch ${DATA_FILE}: ${res.status}`);
    const data = await res.json();
    photos = Array.isArray(data) ? data : data.photos || [];
    renderCategoryOptions();
    displayPhotos(photos);
  } catch (err) {
    console.error(err);
    galleryContainer.innerHTML = `<p class="error">Gallery could not be loaded.</p>`;
  }
}

/* Render category select */
function renderCategoryOptions() {
  const cats = Array.from(new Set(photos.map(p => p.category))).sort();
  // keep "All" as first option
  categorySelect.innerHTML = `<option value="All">All Categories</option>` +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

/* Display photos array */
function displayPhotos(list) {
  galleryContainer.innerHTML = "";
  const likesState = loadLikes();

  if (!Array.isArray(list) || list.length === 0) {
    galleryContainer.innerHTML = `<p style="text-align:center">No photos found.</p>`;
    return;
  }

  list.forEach(photo => {
    const id = photo.id;
    const likeCount = likesState.counts[id] || 0;
    const isLiked = !!likesState.liked[id];

    const card = document.createElement("div");
    card.className = "gallery-item";
    card.innerHTML = `
      <div class="thumb-wrap" data-id="${id}">
        <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.caption)}" loading="lazy" />
      </div>
      <div class="meta">
        <p class="caption">${escapeHtml(photo.caption)}</p>
        <div class="meta-row">
          <span class="category">${escapeHtml(photo.category)}</span>
          <button class="like-btn" data-id="${id}" aria-pressed="${isLiked}">
            <span class="heart">${isLiked ? "♥" : "♡"}</span>
            <span class="likes-count">${likeCount}</span>
          </button>
        </div>
      </div>
    `;

    // click on image opens it in new tab
    const thumb = card.querySelector(".thumb-wrap");
    thumb.addEventListener("click", () => {
      window.open(photo.src, "_blank");
    });

    // like button handler
    const likeBtn = card.querySelector(".like-btn");
    likeBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // don't open image
      toggleLike(id, likeBtn);
    });

    galleryContainer.appendChild(card);
  });
}

/* Toggle like/unlike */
function toggleLike(id, buttonEl) {
  const state = loadLikes();
  const counts = state.counts || {};
  const liked = state.liked || {};

  const curCount = counts[id] || 0;
  const isNowLiked = !liked[id];

  counts[id] = isNowLiked ? curCount + 1 : Math.max(0, curCount - 1);
  liked[id] = isNowLiked;

  state.counts = counts;
  state.liked = liked;
  saveLikes(state);

  // update UI
  const heart = buttonEl.querySelector(".heart");
  const countSpan = buttonEl.querySelector(".likes-count");
  heart.textContent = isNowLiked ? "♥" : "♡";
  buttonEl.setAttribute("aria-pressed", isNowLiked ? "true" : "false");
  countSpan.textContent = counts[id];
}

/* Filter logic */
function applyFilters() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const cat = categorySelect.value || "All";

  const filtered = photos.filter(p => {
    const matchesSearch = q === "" ||
      (p.caption && p.caption.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q));
    const matchesCat = cat === "All" || p.category === cat;
    return matchesSearch && matchesCat;
  });

  displayPhotos(filtered);
}

/* Escape helper (small) */
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

/* Event listeners (distinct types) */
searchInput.addEventListener("input", () => applyFilters()); // 1) input
categorySelect.addEventListener("change", () => applyFilters()); // 2) change
clearBtn.addEventListener("click", () => { // 3) click
  searchInput.value = "";
  categorySelect.value = "All";
  applyFilters();
});

document.addEventListener("DOMContentLoaded", loadGallery); // DOMContentLoaded (load/init)

