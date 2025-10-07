// Simple wishlist storage using localStorage
const wishlistItems = JSON.parse(localStorage.getItem("wishlist")) || [];
const wishlistContainer = document.getElementById("wishlistItems");

function renderWishlist() {
  wishlistContainer.innerHTML = "";
  wishlistItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.note || ""}</p>
      <button onclick="removeItem(${index})">Remove</button>
    `;
    wishlistContainer.appendChild(div);
  });
  localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
}

function removeItem(index) {
  wishlistItems.splice(index, 1);
  renderWishlist();
}

document.getElementById("addItem").addEventListener("click", () => {
  const url = document.getElementById("productUrl").value.trim();
  const note = document.getElementById("note").value.trim();
  if (!url || !url.includes("amazon.")) {
    alert("Please enter a valid Amazon link");
    return;
  }

  const title = url.split("/")[3] || "Amazon Product";
  wishlistItems.push({ url, title, note });
  renderWishlist();

  document.getElementById("productUrl").value = "";
  document.getElementById("note").value = "";
});

document.getElementById("shareList").addEventListener("click", () => {
  const shareData = encodeURIComponent(JSON.stringify(wishlistItems));
  const shareUrl = `${window.location.origin}${window.location.pathname}?list=${shareData}`;
  navigator.clipboard.writeText(shareUrl);
  document.getElementById("shareMessage").textContent = "Link copied! Share it with your friends 🎁";
});

// Load wishlist if shared
const params = new URLSearchParams(window.location.search);
if (params.has("list")) {
  const listData = JSON.parse(decodeURIComponent(params.get("list")));
  localStorage.setItem("wishlist", JSON.stringify(listData));
  location.href = window.location.origin + window.location.pathname;
}

renderWishlist();