document.addEventListener("DOMContentLoaded", () => {
  const galleryContainer = document.getElementById("gallery-container");

  fetch("gallery.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      data.forEach((item) => {
        const div = document.createElement("div");
        div.className = "gallery-item";
        div.innerHTML = `
          <img src="${item.src}" alt="${item.caption}">
          <p>${item.caption}</p>
        `;
        galleryContainer.appendChild(div);
      });
    })
    .catch((error) => {
      console.error("Failed to load gallery:", error);
      galleryContainer.innerHTML = "<p>Gallery could not be loaded.</p>";
    });
});

