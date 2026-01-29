// script.js - Neon Shop cart logic with color variants

// === Product data (edit here to change products / add colors) ===
const products = [
  { 
    id: 1, 
    name: "Small Clamshell", 
    price: 0.20,
    hasColor: true,
    colors: ["Ruby Red", "Burnt Titanium", "Matte Black"]
  },
  { 
    id: 2, 
    name: "Logo Clamshell", 
    price: 0.50,
    hasColor: true,
    colors: ["Ruby Red", "Burnt Titanium", "Matte Black"]
  },
  { 
    id: 3, 
    name: "Logo Poker Chip", 
    price: 0.25,
    hasColor: true,
    colors: ["Ruby Red", "Burnt Titanium", "Matte Black", "Silver Silk"]
  },
  { 
    id: 4, 
    name: "SoloPod Gen2 Modular Solo Cup Grow System. 1 Cup Per Unit", 
    price: 25.00,
    // no color option
  },
  { 
    id: 5, 
    name: "Small BeanKan", 
    price: 25.00
    // no color option
  },
  { 
    id: 6, 
    name: "Large BeanKan", 
    price: 40.00,
    // no color option
  },
  { 
    id: 7, 
    name: "Small Tent Spreader Kit 16mm", 
    price: 30.00
   // no color option
  },
  { 
    id: 8, 
    name: "Large Tent Spreader Kit 16mm", 
    price: 60.00
   // no color option
  },
  { 
    id: 9, 
    name: "CannaKaser Black Robusto 20mmx120mm", 
    price: 30.00
   // no color option
  }
];

// Cart stored in localStorage
let cart = JSON.parse(localStorage.getItem('neonCart')) || {};

// ==================== Shared functions ====================

function saveCart() {
  localStorage.setItem('neonCart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  
  let total = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  countEl.textContent = total;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    background: #ff004d; color: white; padding: 12px 24px; border-radius: 8px;
    box-shadow: 0 0 15px #ff004d80; z-index: 1000; font-weight: bold;
    font-family: system-ui, sans-serif;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// ==================== Product page logic ====================

function renderProducts() {
  const container = document.getElementById('product-grid');
  if (!container) return;

  container.innerHTML = products.map(p => {
    let colorHtml = '';
    if (p.hasColor && p.colors?.length > 0) {
      colorHtml = `
        <select id="color-${p.id}" 
                style="margin: 1rem 0;">
          <option value="">Select color...</option>
          ${p.colors.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      `;
    }

    return `
      <div class="card">
        <h3>${p.name}</h3>
        <div class="price">$${p.price.toFixed(2)}</div>
        ${colorHtml}
        <input type="number" id="qty-${p.id}" min="1" value="1">
        <button class="btn" onclick="addToCart(${p.id})">Add to Cart</button>
      </div>
    `;
  }).join('');
}

function addToCart(id) {
  const qtyEl = document.getElementById(`qty-${id}`);
  const qty = parseInt(qtyEl?.value) || 1;

  const prod = products.find(p => p.id === id);
  if (!prod) return;

  let color = null;
  const colorEl = document.getElementById(`color-${id}`);
  if (prod.hasColor && colorEl) {
    color = colorEl.value.trim();
    if (!color) {
      showToast("Please select a color first!");
      return;
    }
  }

  // Use composite key for variants (id + color)
  const key = color ? `${id}_${color.replace(/\s+/g, '_')}` : id;

  if (cart[key]) {
    cart[key].qty += qty;
  } else {
    cart[key] = {
      name: prod.name,
      price: prod.price,
      qty,
      color: color || null,
      baseId: id
    };
  }

  saveCart();
  showToast(`Added ${qty} × ${prod.name}${color ? ` (${color})` : ''}`);

  // Reset inputs
  if (qtyEl) qtyEl.value = 1;
  if (colorEl) colorEl.value = "";
}

// ==================== Cart page logic ====================

function renderCart() {
  const tbody = document.getElementById('cart-body');
  const totalEl = document.getElementById('cart-total');
  const emptyMsg = document.getElementById('cart-empty-msg');
  const sendBtn = document.getElementById('send-order-btn');

  if (!tbody) return;

  tbody.innerHTML = '';
  let total = 0;

  if (Object.keys(cart).length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:4rem 0;">Your cart is empty...</td></tr>`;
    totalEl.textContent = '$0.00';
    emptyMsg.style.display = 'block';
    sendBtn.href = '#';
    sendBtn.style.opacity = '0.5';
    sendBtn.style.pointerEvents = 'none';
    return;
  }

  emptyMsg.style.display = 'none';
  sendBtn.style.opacity = '1';
  sendBtn.style.pointerEvents = 'auto';

  for (const [key, item] of Object.entries(cart)) {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const displayName = item.color 
      ? `${item.name} <span style="color:#aaa;">(${item.color})</span>` 
      : item.name;

    tbody.innerHTML += `
      <tr>
        <td>${displayName}</td>
        <td>$${item.price.toFixed(2)}</td>
        <td>
          <input type="number" min="1" value="${item.qty}" 
                 style="width:80px;text-align:center;"
                 onchange="updateQty('${key}', this.value)">
        </td>
        <td>$${itemTotal.toFixed(2)}</td>
        <td>
          <button class="btn" style="border-color:#ff4444;color:#ff4444;font-size:0.9rem;"
                  onclick="removeItem('${key}')">Remove</button>
        </td>
      </tr>
    `;
  }

  totalEl.textContent = `$${total.toFixed(2)}`;

  // Update email button content
  updateMailto();
}

function updateQty(key, newQty) {
  newQty = parseInt(newQty);
  if (newQty >= 1) {
    cart[key].qty = newQty;
  } else {
    delete cart[key];
  }
  saveCart();
  renderCart();
}

function removeItem(key) {
  delete cart[key];
  saveCart();
  renderCart();
  showToast("Item removed");
}

function updateMailto() {
  const btn = document.getElementById('send-order-btn');
  if (!btn) return;

  if (Object.keys(cart).length === 0) {
    btn.href = '#';
    return;
  }

  let body = "New Neon Shop Order\n\n";
  body += `Date: ${new Date().toLocaleString()}\n\n`;
  body += "Items:\n";

  let total = 0;
  for (const item of Object.values(cart)) {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    const colorLine = item.color ? ` (${item.color})` : '';
    body += `• ${item.qty} × ${item.name}${colorLine} @ $${item.price.toFixed(2)} = $${itemTotal.toFixed(2)}\n`;
  }

  body += `\nTOTAL: $${total.toFixed(2)}\n\n`;
  body += "Shipping address:\n[Please write your full address here]\n\n";
  body += "Payment method:\n[Please specify]\n\n";
  body += "Notes: _______________________________";

  const encoded = encodeURIComponent(body);
  btn.href = `mailto:your.email@gmail.com?subject=New%20Neon%20Shop%20Order&body=${encoded}`;
}

// ==================== Init ====================

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();

  if (document.getElementById('product-grid')) {
    renderProducts();
  }

  if (document.getElementById('cart-body')) {
    renderCart();
  }
});