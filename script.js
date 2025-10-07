import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const db = window.db;
const listsRef = collection(db, "wishlists");

let wishlistItems = [];

const nameInput = document.getElementById("itemName");
const urlInput = document.getElementById("itemURL");
const addBtn = document.getElementById("addItemBtn");
const listContainer = document.getElementById("wishlistContainer");
const emptyMsg = document.getElementById("emptyMessage");
const shareBtn = document.getElementById("shareList");
const shareMsg = document.getElementById("shareMessage");

async function fetchAmazonInfo(url) {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, "text/html");

    const title = doc.querySelector("#productTitle")?.textContent?.trim() || "Unnamed Product";
    const image = doc.querySelector("#imgTagWrapperId img")?.src || "";

    return { title, image };
  } catch (e) {
    return { title: "Unnamed Product", image: "" };
  }
}

if (addBtn) {
  addBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert("Please enter a valid Amazon URL.");
      return;
    }

    const { title, image } = await fetchAmazonInfo(url);

    wishlistItems.push({ name: title, url, image });
    renderWishlist();

    nameInput.value = "";
    urlInput.value = "";
  });
}

function renderWishlist(sharedView = false) {
  if (!listContainer) return;

  listContainer.innerHTML = "";

  if (wishlistItems.length === 0) {
    emptyMsg.style.display = "block";
  } else {
    emptyMsg.style.display = "none";
  }

  wishlistItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "wishlist-item";

    const infoDiv = document.createElement("div");
    infoDiv.className = "item-info";

    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name;
      img.className = "product-image";
      infoDiv.appendChild(img);
    }

    const linkText = document.createElement("span");
    linkText.textContent = item.name;
    infoDiv.appendChild(linkText);

    li.appendChild(infoDiv);

    if (sharedView) {
      const buyBtn = document.createElement("a");
      buyBtn.textContent = "Buy Now";
      buyBtn.href = item.url;
      buyBtn.target = "_blank";
      buyBtn.className = "buy-now-btn";
      li.appendChild(buyBtn);
    } else {
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.className = "remove-btn";
      removeBtn.onclick = () => {
        li.classList.add("removing");
        setTimeout(() => {
          wishlistItems.splice(index, 1);
          renderWishlist();
        }, 150);
      };
      li.appendChild(removeBtn);
    }

    listContainer.appendChild(li);
  });
}

if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    try {
      const docRef = await addDoc(listsRef, {
        wishlist: wishlistItems,
        created: new Date().toISOString(),
      });

      const shareUrl = `${window.location.origin}${window.location.pathname}?id=${docRef.id}`;
      navigator.clipboard.writeText(shareUrl);

      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = "Wishlist saved! Link copied 🎁";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

    } catch (e) {
      alert("Error saving wishlist. Please try again.");
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const code = params.get("code");
  const pin = params.get("pin");

  if (id) {
    document.querySelector(".input-container").style.display = "none";
    if (shareBtn) shareBtn.style.display = "none";

    try {
      const docRef = doc(window.db, "wishlists", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        wishlistItems = docSnap.data().wishlist;
        renderWishlist(true);
      }
    } catch (e) {}
  } else if (code) {
    try {
      const docRef = doc(window.db, "wishlists", code);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        wishlistItems = data.wishlist || [];

        const isOwner = pin && data.pin === pin;

        if (!isOwner) {
          document.querySelector(".input-container").style.display = "none";
          if (shareBtn) shareBtn.style.display = "none";
          renderWishlist(true);
        } else {
          renderWishlist(false);
        }
      }
    } catch (e) {}
  } else {
    renderWishlist();
  }
});

export async function codeExists(db, code) {
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
  const snap = await getDoc(doc(db, "wishlists", code));
  return snap.exists();
}

export async function createCodeDoc(db, code, pin) {
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
  await setDoc(doc(db, "wishlists", code), {
    pin,
    wishlist: [],
    created: new Date().toISOString()
  });
}

export function redirectToList(code, pin = "") {
  const qs = pin ? `?code=${encodeURIComponent(code)}&pin=${encodeURIComponent(pin)}`
                 : `?code=${encodeURIComponent(code)}`;
  window.location.href = `index.html${qs}`;
}