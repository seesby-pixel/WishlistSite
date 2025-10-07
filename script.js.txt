const addBtn = document.getElementById('add-product');
const productInput = document.getElementById('product-url');
const productList = document.getElementById('product-list');

addBtn.addEventListener('click', () => {
  const url = productInput.value.trim();
  if (!url) return;

  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = url;
  a.target = "_blank";
  a.textContent = url;
  li.appendChild(a);

  productList.appendChild(li);
  productInput.value = "";

  // Placeholder for shareable link
  document.getElementById('wishlist-url').textContent = "https://wishlistsite.com/your-wishlist-id";
});
