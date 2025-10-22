import { collection, addDoc, doc, getDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
document.addEventListener('DOMContentLoaded', () => {
  const isOwner = localStorage.getItem("isOwner") === "true";
  const onHomePage = window.location.pathname === '/' || window.location.pathname === '/home';

  // If on home page and logged in as owner, inject delete button in the footer
  if (isOwner && onHomePage) {
    const footer = document.querySelector('.footer-legal') || document.querySelector('#privacy-footer');
    if (footer) {
      const deleteBtn = document.createElement('button');
      deleteBtn.id = 'deleteAccountBtn';
      deleteBtn.textContent = 'Delete Account';
      deleteBtn.className = 'danger-btn';

      footer.appendChild(deleteBtn);

      deleteBtn.addEventListener('click', async () => {
        const confirmed = confirm("⚠️ Are you sure you want to permanently delete your account and wishlist? This cannot be undone.");
        if (!confirmed) return;

        try {
          const code = localStorage.getItem("ownerCode");
          if (!code) {
            alert("No active account found.");
            return;
          }

          const pin = prompt("Enter your 6-digit PIN to confirm deletion:");
          if (!pin || !/^[0-9]{6}$/.test(pin)) {
            alert("Invalid PIN.");
            return;
          }

          const ref = doc(window.db, "wishlists", code);
          const snap = await getDoc(ref);

          if (!snap.exists()) {
            alert("Account not found.");
            return;
          }

          const data = snap.data();
          if (data.pin !== pin) {
            alert("Incorrect PIN.");
            return;
          }

          await deleteDoc(ref);
          localStorage.removeItem("isOwner");
          localStorage.removeItem("ownerCode");
          localStorage.removeItem("ownerEmail");
          sessionStorage.removeItem("currentOwner");

          alert("✅ Your account and wishlist have been permanently deleted.");
          window.location.href = "/home";
        } catch (e) {
          console.error(e);
          alert("❌ Failed to delete account. Please try again.");
        }
      });
    }
  }
});

// 🚀 Caching layer to avoid repeating expensive link processing
const __urlFixCache = new Map();

function cachedProcess(href) {
  if (!__urlFixCache.has(href)) {
    __urlFixCache.set(
      href,
      processAmazonLink(href).catch(err => {
        __urlFixCache.delete(href); // don't cache failures
        throw err;
      })
    );
  }
  return __urlFixCache.get(href);
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeDecorations();
});

// import … (keep your import line as-is)

const db = window.db || null;
let listsRef = null;
if (db) {
  listsRef = collection(db, "wishlists");
}

// ===============================
// 🎨 ROBUST THEME DECORATION HANDLER (final)
// ===============================

function ensureDecorationsContainer() {
  let el = document.getElementById('theme-decorations');
  if (!el) {
    el = document.createElement('div');
    el.id = 'theme-decorations';
    // put it as the first child of <body>
    if (document.body.firstChild) {
      document.body.insertBefore(el, document.body.firstChild);
    } else {
      document.body.appendChild(el);
    }
  }
  return el;
}

function getActiveTheme() {
  // If nothing chosen yet, don’t force a theme
  const saved = localStorage.getItem('activeTheme') || '';
  return saved;
}


function applyBodyThemeClass(theme) {
  // remove any previous theme-* class, then add the current one
  document.body.className = document.body.className
    .split(/\s+/)
    .filter(c => !/^theme-/.test(c))
    .join(' ')
    .trim();
  if (theme) document.body.classList.add(theme);
}

function injectDecorations(theme) {
  const container = ensureDecorationsContainer();
  // ✅ Always clear previous decorations
  container.innerHTML = '';

  if (theme === 'theme-christmas') {
    const url = 'assets/xmas-snow.svg?v=9';
    fetch(url)
      .then(r => r.text())
      .then(svg => {
        container.innerHTML = `<div class="christmas-decor">${svg}</div>`;
      })
      .catch(() => { container.innerHTML = ''; });
    return;
  }

  if (theme === 'theme-pastel') {
    container.innerHTML = `
      <div class="pastel-decor">
        <div class="pastel-line pastel-line-top"></div>
        <div class="pastel-line pastel-line-bottom"></div>
        <div class="pastel-dot pastel-dot-a"></div>
        <div class="pastel-dot pastel-dot-b"></div>
      </div>`;
    return;
  }

  if (theme === 'theme-bubblegum') {
    container.innerHTML = `
      <div class="bubblegum-decor"></div>
    `;
    return;
  }

  if (theme === 'theme-elegant') {
    container.innerHTML = `
      <div class="elegant-decor"></div>
    `;
    return;
  }
  if (theme === 'theme-babyshower') {
   container.innerHTML = `
      <div class="babyshower-decor"></div>
    `;
    return;
  }

  // ✅ Default: no decorations
}
function showToast(message) {
  // Reuse any existing toast (either #toast or .toast)
  let toast = document.querySelector('#toast, .toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  } else {
    // Ensure proper id/class so CSS theme rules apply
    toast.id = 'toast';
    toast.classList.add('toast');
  }

  toast.textContent = message;

  // Retrigger CSS animation each time
  toast.style.animation = 'none';
  void toast.offsetWidth; // force reflow
  toast.style.animation = null;
}


function initThemeDecorations() {
  const theme = getActiveTheme();
  applyBodyThemeClass(theme);
  injectDecorations(theme);
}

// 1) Run after DOM is fully parsed (prevents race with #theme-decorations)
document.addEventListener('DOMContentLoaded', initThemeDecorations);

// 2) Safety: run again on window load (some pages hydrate late)
window.addEventListener('load', () => {
  initThemeDecorations();
});

// 3) If your theme selector changes localStorage or swaps body classes, re-apply
//    (adjust selector if your theme dropdown has a different id)
const themeSelect = document.getElementById('themeSelect');
if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    const v = e.target.value;                    // "default" | "pastel" | ...
    const stored = v === 'default' ? '' : `theme-${v}`;
    localStorage.setItem('activeTheme', stored);
    initThemeDecorations();
  });
}

// 4) If theme is changed from another tab/window (localStorage event)
window.addEventListener('storage', (e) => {
  if (e.key === 'activeTheme') initThemeDecorations();
});
// Clipboard helper with fallback for older/locked-down contexts
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}


let wishlistItems = [];

// Elements
const nameInput = document.getElementById("itemName");
const urlInput = document.getElementById("itemURL");
const addBtn = document.getElementById("addItemBtn");
const listContainer = document.getElementById("wishlistContainer");
const emptyMsg = document.getElementById("emptyMessage");
const shareBtn = document.getElementById("shareList");
const shareMsg = document.getElementById("shareMessage");

// Ownership control
let isOwner = localStorage.getItem("isOwner") === "true";
const params = new URLSearchParams(window.location.search);
const code = params.get("code")?.toLowerCase() || "";
const storedOwnerCode = localStorage.getItem("ownerCode");

// 🧭 Temporary ownership logic: only enable owner mode on their own list
if (localStorage.getItem("isOwner") === "true") {
  if (storedOwnerCode && storedOwnerCode === code) {
    isOwner = true;
  } else {
    isOwner = false;
  }
}

// 🚪 Show logout button if owner mode active
function showLogoutButton() {
  if (!isOwner) return;
  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Logout";
  logoutBtn.className = "logout-btn";
  logoutBtn.style.margin = "20px auto";
  logoutBtn.style.display = "block";
  logoutBtn.style.background = "#495057";
  logoutBtn.style.color = "#fff";
  logoutBtn.style.border = "none";
  logoutBtn.style.padding = "10px 20px";
  logoutBtn.style.borderRadius = "6px";
  logoutBtn.style.cursor = "pointer";

  logoutBtn.addEventListener("click", () => {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.removeItem("isOwner");
      localStorage.removeItem("ownerCode");
      localStorage.removeItem("ownerEmail");
      sessionStorage.removeItem("currentOwner");
      window.location.href = "/home";
    }
  });

  document.body.appendChild(logoutBtn);
}

/* ======================================================
   📦 Fetch product info from Amazon URL (Advanced Amazon Image Support)
========================================================= */
async function fetchAmazonInfo(url) {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    const parser = new DOMParser();
    const docHtml = parser.parseFromString(data.contents, "text/html");

    // --- Product Title ---
    const title = docHtml.querySelector("#productTitle")?.textContent?.trim() || "Unnamed Product";

    // --- Try all known image selectors ---
    const imgEl = docHtml.querySelector("#imgTagWrapperId img, #landingImage, img[data-old-hires]");
    let image = imgEl ? (imgEl.src || imgEl.getAttribute("data-old-hires") || "") : "";

    // --- Fallback: search page HTML for JSON image URLs ---
    if (!image) {
      const htmlText = data.contents;
      const match = htmlText.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%-]+\.jpg/);
      if (match && match[0]) {
        image = match[0];
      }
    }

    return { title, image };
  } catch (e) {
    console.warn("Amazon fetch failed:", e);
    return { title: "Unnamed Product", image: "" };
  }
}

// ==============================
// 🛒 Clean + attach affiliate tag (normalize to /dp/ASIN)
// ==============================
async function processAmazonLink(inputUrl) {
  const affiliateTag = "giftwishlis01-20";

  // ✅ EARLY REJECTION FOR MISSION/PROMO LINKS
  try {
    const uMission = new URL(inputUrl);
    const path = uMission.pathname.toLowerCase();
    const looksLikeMission = path.includes("/hz/") && path.includes("mission");
    if (looksLikeMission) {
      throw new Error("This is a special link, Please enter a standard Amazon link.");
    }
  } catch {
    // If URL is invalid or fails parsing
    throw new Error("This is a special link, Please enter a standard Amazon link.");
  }

  // ✅ FAST-PATH ASIN DETECTION
  try {
    const u0 = new URL(inputUrl);
    if (u0.hostname.includes("amazon.")) {
      const m0 = u0.pathname.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i);
      if (m0) {
        const origin0 = `${u0.protocol}//${u0.host}`;
        const clean0 = new URL(`/dp/${m0[1]}`, origin0);
        clean0.search = "";
        clean0.hash = "";
        clean0.searchParams.set("tag", affiliateTag);
        return clean0.toString();
      }
    }
  } catch {
    // ignore and fall back
  }

  // ⬇️ the rest of your existing logic with fetch...
  let finalURL = inputUrl;
  let resolvedHtml = "";
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(inputUrl)}`);
    const data = await res.json();
    resolvedHtml = data?.contents || "";
    if (resolvedHtml) {
      const doc = new DOMParser().parseFromString(resolvedHtml, "text/html");
      const c = doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
      if (c) finalURL = c;
    }
  } catch {
    // ignore; fallback to input URL
  }

  try {
    const u = new URL(finalURL);
    if (!u.hostname.includes("amazon.")) throw new Error();

    let asin = getAsin(u);
    if (!asin) {
      const iu = new URL(inputUrl);
      asin = getAsin(iu) || null;
      if (!asin && resolvedHtml) {
        const m =
          resolvedHtml.match(/\/dp\/([A-Z0-9]{10})/i) ||
          resolvedHtml.match(/"asin"\s*:\s*"([A-Z0-9]{10})"/i) ||
          resolvedHtml.match(/data-asin="([A-Z0-9]{10})"/i);
        if (m) asin = m[1];
      }
    }

    if (!asin) {
      const path = new URL(finalURL).pathname.toLowerCase();
      const looksLikeMission = path.includes("/hz/") && path.includes("mission");
      if (looksLikeMission && !asin) {
        throw new Error("This is a special link, Please enter a standard Amazon link.");
      }

      const u2 = new URL(finalURL);
      if (!u2.hostname.includes("amazon.")) throw new Error("This is a special link, Please enter a standard Amazon link..");
      u2.hash = "";
      u2.search = "";
      u2.searchParams.set("tag", affiliateTag);
      return u2.toString();
    }

    const origin = `${u.protocol}//${u.host}`;
    const clean = new URL(`/dp/${asin}`, origin);
    clean.searchParams.set("tag", affiliateTag);
    return clean.toString();
  } catch {
    throw new Error("This is a special link. Please enter a standard Amazon link.");
  }
}

window.processAmazonLink = processAmazonLink;

// ==============================
// 🔒 Last-mile tag enforcement on click
// (catches any Amazon link just before navigation)
// ==============================
(function attachAffiliateClickInterceptor() {
  const affiliateTag = "giftwishlis01-20";

document.addEventListener("click", async (ev) => {
  const a = ev.target.closest && ev.target.closest('a[href*="amazon."], a[href*="amzn.to"]');
  if (!a) return;
// ✅ Prevent already-invalid links from firing processAmazonLink again
if (a.hasAttribute("data-invalid")) {
  ev.preventDefault();
  return;
}

  ev.preventDefault();
  try {
    const fixed = await cachedProcess(a.href);
    window.open(fixed, "_blank");
 } catch (e) {
  // Block mission/promo links (no ASIN) and show message
//showToast(e?.message || "This is a special link. Please share the standard Amazon product link.");
return; // do not navigate
}

}, true);

})();

/* ======================================================
   ➕ Add new item (owner only) — with affiliate tag
========================================================= */
if (addBtn) {

  addBtn.addEventListener("click", async () => {
    let url = urlInput.value.trim();

    try {
      // 🧼 1. Clean the link and add affiliate tag
      url = await processAmazonLink(url);
    } catch (e) {
      console.warn("Amazon link error:", e.message);
      urlInput.value = "";
      return;
    }

    // 🛍 2. Fetch product title & image as usual
    const { title, image } = await fetchAmazonInfo(url);

    // 📝 3. Save the cleaned, affiliate-tagged URL
    wishlistItems.push({ name: title, url, image, purchased: false });
    await renderWishlist();

    // ✅ AUTO-SAVE WISHLIST TO FIRESTORE
if (listsRef) {
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
  const code = localStorage.getItem("ownerCode") || crypto.randomUUID(); // generate code if not already saved
  localStorage.setItem("ownerCode", code);
  const docRef = doc(listsRef, code);
  await setDoc(docRef, {
    wishlist: wishlistItems,
    updated: new Date().toISOString(),
  });
}


    // 🧽 4. Clear inputs
    nameInput.value = "";
    urlInput.value = "";
  });
}

/* ======================================================
   🖼️ Render wishlist (different for owner vs guest)
========================================================= */
async function renderWishlist(sharedView = false) {

  if (!listContainer) return;
  listContainer.innerHTML = "";

  if (wishlistItems.length === 0) {
    emptyMsg.style.display = "block";
  } else {
    emptyMsg.style.display = "none";
  }

  for (const [index, item] of wishlistItems.entries()) {
  const li = document.createElement("li");
  li.className = "wishlist-item";

  // Purchasers see purchased state, owner does not
  if (item.purchased && !isOwner) {
    li.classList.add("purchased");
  }

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

  // Buttons based on role
  if (sharedView && !isOwner) {
    const buyBtn = document.createElement("a");
    buyBtn.textContent = "Buy Now";

    try {
      buyBtn.href = await processAmazonLink(item.url);
    } catch {
      buyBtn.href = item.url;
    }

      buyBtn.target = "_blank";
      buyBtn.className = "buy-now-btn";
      li.appendChild(buyBtn);

      const purchasedBtn = document.createElement("button");
      purchasedBtn.textContent = item.purchased ? "Purchased!" : "I've Purchased";
      purchasedBtn.className = "purchased-btn";
      purchasedBtn.disabled = item.purchased;

      purchasedBtn.addEventListener("click", () => {
        item.purchased = true;
        renderWishlist(sharedView);
      });

      li.appendChild(purchasedBtn);
    } else if (isOwner) {
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
  }

  if (isOwner) {
    showLogoutButton();
  }
// Ensure all visible Amazon links are tagged
enforceAffiliateOnRenderedLinks();
}
function enforceAffiliateOnRenderedLinks() {
  const affiliateTag = "giftwishlis01-20";
  document.querySelectorAll('a[href*="amazon."], a[href*="amzn.to"]').forEach(a => {
    const href = a.getAttribute("href");
    if (!href) return;

    cachedProcess(href).then(clean => {
      a.setAttribute("href", clean);
      a.removeAttribute("data-invalid"); // cleaned successfully
      a.removeEventListener("click", a._invalidHandler || (()=>{}));
      a._invalidHandler = null;
    }).catch((e) => {
      // Mark invalid mission/landing links (no ASIN)
      a.setAttribute("href", "#");
      a.setAttribute("data-invalid", "1");
      const handler = (ev) => {
        ev.preventDefault();
       // showToast(e?.message || "This is a special link. Please share the standard Amazon product link.");
      };
      a.removeEventListener("click", a._invalidHandler || (()=>{}));
      a.addEventListener("click", handler);
      a._invalidHandler = handler;
    });
  });
}


if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    try {
      // 🧭 Always prioritize the code from the current URL
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("code");

      const codeToShare = codeFromUrl || localStorage.getItem("ownerCode");

      if (!codeToShare) {
        showToast("No wishlist to share yet.");
        return;
      }

      const u = new URL("/list", window.location.href);
      u.search = "";
      u.searchParams.set("code", codeToShare);
      const shareUrl = u.toString();

      const copied = await copyToClipboard(shareUrl);
      showToast(copied ? "Link copied!" : "Could not copy link");
    } catch (e) {
      console.error(e);
    }
  });
}


/* ======================================================
   🌐 Load list content on page load
========================================================= */
window.addEventListener("DOMContentLoaded", async () => {
  const id = params.get("id");
  const pin = params.get("pin");

  if (localStorage.getItem("isOwner") === "true" && storedOwnerCode === code) {
    isOwner = true;
  } else if (localStorage.getItem("isOwner") === "true" && storedOwnerCode !== code) {
    isOwner = false;
  }

  if (id || code) {
    if (id || !isOwner) {
      localStorage.setItem("isOwner", localStorage.getItem("isOwner") === "true" ? "true" : "false");
    }
  }

  if (id) {
    document.querySelector(".input-container")?.style?.setProperty("display","none");
    if (shareBtn) shareBtn.style.display = "none";

    try {
      const docRef = doc(window.db, "wishlists", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        wishlistItems = docSnap.data().wishlist || [];
        await renderWishlist(true);
      }
    } catch (e) {
      console.error(e);
    }
  } else if (code) {
    try {
      const docRef = doc(window.db, "wishlists", code);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        wishlistItems = docSnap.data().wishlist || [];
        await renderWishlist(storedOwnerCode !== code);
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    renderWishlist();
  }
});

/* ======================================================
   🧰 Firebase helpers
========================================================= */
export async function codeExists(db, code) {
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
  const snap = await getDoc(doc(db, "wishlists", code.toLowerCase()));
  return snap.exists();
}

export async function createCodeDoc(db, code, pin) {
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
  await setDoc(doc(db, "wishlists", code.toLowerCase()), {
    pin,
    wishlist: [],
    created: new Date().toISOString()
  });
}

export function redirectToList(code, pin = "") {
  const qs = pin ? `?code=${encodeURIComponent(code)}&pin=${encodeURIComponent(pin)}`
                 : `?code=${encodeURIComponent(code)}`;
  window.location.href = `/list${qs}`;
}

/* ======================================================
   👥 Friends Page Logic (with login required)
========================================================= */
if (window.location.pathname.endsWith('friends.html')) {
  const loginRow = document.getElementById('loginRow');
  const loginEmail = document.getElementById('loginEmail');
  const loginCode = document.getElementById('loginCode');
  const loginPin = document.getElementById('loginPin');
  const loginBtn = document.getElementById('loginBtn');
  const loginErr = document.getElementById('loginErr');

  const friendsSection = document.getElementById('friendsSection');
  const titleEl = document.getElementById('friendTitle');
  const codeEl = document.getElementById('friendCode');
  const pinEl = document.getElementById('friendPin');
  const addFriendBtn = document.getElementById('addFriendBtn');
  const friendsListEl = document.getElementById('friendsList');

  function showLoginError(m) {
    loginErr.textContent = m;
    loginErr.style.display = 'block';
  }
  function clearLoginError() {
    loginErr.textContent = '';
    loginErr.style.display = 'none';
  }

  function getSessionOwner() {
    try { return JSON.parse(sessionStorage.getItem('currentOwner') || 'null'); }
    catch { return null; }
  }
  function setSessionOwner(owner) {
    sessionStorage.setItem('currentOwner', JSON.stringify(owner));
  }
  function getUserEmail() {
    return getSessionOwner()?.email || null;
  }

  function showLogin() {
    loginRow.style.display = 'flex';
    friendsSection.style.display = 'none';
  }
  function showFriendsSection() {
    loginRow.style.display = 'none';
    friendsSection.style.display = 'block';
    loadFriends();
  }

  async function loginUser() {
    clearLoginError();
    const email = loginEmail.value.trim().toLowerCase();
    const code = loginCode.value.trim().toLowerCase();
    const pin = loginPin.value.trim();

    if (!email || !code || !pin) {
      showLoginError('Please fill in all fields.');
      return;
    }

    try {
      const docRef = doc(db, 'wishlists', code);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        showLoginError('Invalid code.');
        return;
      }
      const data = snap.data();
      // ✅ ADDED — fixed pin check
      if (data.accessPin !== pin) {
        showLoginError('Incorrect PIN.');
        return;
      }

      setSessionOwner({ email, code, pin });
      showFriendsSection();
    } catch (err) {
      showLoginError('Login failed. Please try again.');
      console.error(err);
    }
  }

  async function loadFriends() {
    const email = getUserEmail();
    if (!email) return;
    const friendsCol = collection(db, 'users', email, 'friends');
    const snap = await getDocs(friendsCol);
    renderFriends(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }

  async function addFriend() {
    const title = titleEl.value.trim();
    const code = codeEl.value.trim().toLowerCase();
    const pin = pinEl.value.trim();
    if (!code) { alert("Enter friend's code."); return; }
    if (!/^[0-9]{6}$/.test(pin)) { alert("PIN must be 6 digits."); return; }

    const email = getUserEmail();
    if (!email) return;

    // ✅ ADDED — check for duplicates
    const friendsCol = collection(db, 'users', email, 'friends');
    const existingSnap = await getDocs(friendsCol);
    const alreadyExists = existingSnap.docs.some(d => d.data().code === code);
    if (alreadyExists) {
      alert('This friend is already saved.');
      return;
    }

    await addDoc(friendsCol, { name: title || code, code, pin });

    titleEl.value = '';
    codeEl.value = '';
    pinEl.value = '';

    // ✅ ADDED — clear then reload to avoid double render
    friendsListEl.innerHTML = '';
    loadFriends();
  }

  async function removeFriend(id) {
    const email = getUserEmail();
    if (!email) return;
    await deleteDoc(doc(db, 'users', email, 'friends', id));
    loadFriends();
  }

  function renderFriends(friends) {
    friendsListEl.innerHTML = '';
    friends.forEach(f => {
      const li = document.createElement('li');
      li.className = 'wishlist-item';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'item-info';

      const img = document.createElement('img');
      img.className = 'product-image';
      img.alt = f.name || f.code;
      img.src = 'https://via.placeholder.com/80?text=★';
      infoDiv.appendChild(img);

      const label = document.createElement('span');
      label.textContent = f.name || f.code;
      infoDiv.appendChild(label);

      li.appendChild(infoDiv);

      const buttons = document.createElement('div');
      buttons.className = 'button-group';

      const openBtn = document.createElement('button');
      openBtn.textContent = 'View';
      openBtn.className = 'edit-btn';
      openBtn.onclick = () => {
        let url = `/list?code=${encodeURIComponent(f.code)}`;
        if (f.pin) url += `&pin=${encodeURIComponent(f.pin)}`;
        location.href = url;
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'remove-btn';
      deleteBtn.onclick = () => removeFriend(f.id);

      buttons.appendChild(openBtn);
      buttons.appendChild(deleteBtn);
      li.appendChild(buttons);

      friendsListEl.appendChild(li);
    });

    if (friends.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No friends saved yet.';
      friendsListEl.appendChild(p);
    }
  }

  // ✅ ADDED — guard listeners
  if (loginBtn && !loginBtn.dataset.bound) {
    loginBtn.addEventListener('click', loginUser);
    loginBtn.dataset.bound = '1';
  }

  if (addFriendBtn && !addFriendBtn.dataset.bound) {
    addFriendBtn.addEventListener('click', addFriend);
    addFriendBtn.dataset.bound = '1';
  }

  if (getUserEmail()) {
    showFriendsSection();
  } else {
    showLogin();
  }
}
// ==============================
// 🦘 Kangaroo Footer + Always show Privacy on root or home
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  const footer = document.createElement('footer');
  footer.className = 'affiliate-footer';

  footer.innerHTML = `
    <div class="footer-logo-container">
      <img src="assets/kangaroo.png" alt="Kangaroo Logo" class="footer-logo">
    </div>
    <div class="affiliate-bubble">
      This site uses affiliate links to help keep the wishlist magic alive & free ✨
    </div>
  `;

  document.body.appendChild(footer);

  // ✅ Detect both https://wisharu.com and /home.html
  const pathname = location.pathname;
  if (pathname === '/' || pathname === '/home' || /\/home(\.html)?($|\?)/.test(pathname)) {
    const privacyLink = document.createElement('div');
    privacyLink.className = 'footer-legal';
    privacyLink.innerHTML = `<a href="privacy.html">Privacy Policy</a>`;
    footer.after(privacyLink);
  }
});