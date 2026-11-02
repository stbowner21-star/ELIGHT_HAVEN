import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAK9hJNIjwdJSFbQJg_1KF2HlEe8W8raVI",
  authDomain: "elighthaven-d87fc.firebaseapp.com",
  databaseURL: "https://elighthaven-d87fc-default-rtdb.firebaseio.com",
  projectId: "elighthaven-d87fc",
  storageBucket: "elighthaven-d87fc.firebasestorage.app",
  messagingSenderId: "31138545395",
  appId: "1:31138545395:web:43b9011f9cda5a21d54186",
  measurementId: "G-6SKQ2T54DM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let products = [];
let cart = [];
let activeCategory = 'All';
let searchQuery = '';
let selectedSize = 'L';

// LIVE CHAT LOGIC FOR USER
let chatSessionId = localStorage.getItem('chatSessionId');
if (!chatSessionId) {
    chatSessionId = 'user_' + Date.now();
    localStorage.setItem('chatSessionId', chatSessionId);
}

window.toggleChatWindow = function() {
    const win = document.getElementById('chatWindow');
    win.classList.toggle('hidden');
    if (!win.classList.contains('hidden')) {
        listenForUserMessages();
    }
};

function listenForUserMessages() {
    const messagesRef = ref(db, `chats/${chatSessionId}`);
    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        if (data) {
            Object.values(data).forEach(msg => {
                const isUser = msg.sender === 'user';
                const div = document.createElement('div');
                div.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
                div.innerHTML = `
                    <div class="max-w-[80%] px-3 py-2 rounded-xl text-xs ${isUser ? 'bg-amber-500 text-black font-semibold' : 'bg-brand-card border border-brand-border text-white'}">
                        ${msg.text}
                    </div>
                `;
                container.appendChild(div);
            });
            container.scrollTop = container.scrollHeight;
        }
    });
}

window.handleSendUserMessage = function(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (text) {
        push(ref(db, `chats/${chatSessionId}`), {
            sender: 'user',
            text: text,
            timestamp: Date.now()
        });
        input.value = '';
    }
};

// ফায়ারবেস থেকে রিয়েল-টাইমে প্রোডাক্ট ফেচ করার আপডেট করা লজিক
const productsRef = ref(db, 'products');
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } else {
        products = [];
    }
    renderProducts();
});

window.renderProducts = function() {
    const grid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    grid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCat = activeCategory === 'All' || p.category === activeCategory;
        const matchesSearch = p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = "glass-card rounded-3xl overflow-hidden group hover:border-amber-500/45 transition-all flex flex-col justify-between";
        card.innerHTML = `
            <div class="relative overflow-hidden aspect-[4/5] bg-brand-surface cursor-pointer" onclick="openQuickView('${p.id}')">
                <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-3 left-3 bg-black/70 px-3 py-1 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-widest">${p.category}</div>
            </div>
            <div class="p-5 flex flex-col flex-grow justify-between space-y-4">
                <div>
                    <h3 onclick="openQuickView('${p.id}')" class="font-display font-bold text-base text-white group-hover:text-amber-400 cursor-pointer line-clamp-1">${p.title}</h3>
                    <p class="text-xs text-gray-400 mt-1 line-clamp-2">${p.description || ''}</p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-brand-border">
                    <div>
                        <span class="text-[10px] text-gray-500 uppercase block">Price</span>
                        <span class="font-display font-extrabold text-lg text-white">৳ ${p.price}</span>
                    </div>
                    <button onclick="openQuickView('${p.id}')" class="px-4 py-2.5 bg-brand-surface border border-brand-border hover:bg-amber-500 hover:text-black text-xs font-bold uppercase rounded-xl transition-all">
                        Select Size & Add <i class="fa-solid fa-plus ml-1"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
};

window.filterCategory = function(cat) {
    activeCategory = cat;
    document.querySelectorAll('.cat-pill').forEach(btn => {
        if (btn.getAttribute('data-cat') === cat) {
            btn.className = "cat-pill active px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all bg-amber-500 text-black shadow-lg shadow-amber-500/20";
        } else {
            btn.className = "cat-pill px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all bg-brand-surface border border-brand-border text-gray-300 hover:text-white hover:border-amber-500/40";
        }
    });
    renderProducts();
};

window.handleSearch = function() {
    searchQuery = document.getElementById('searchInput').value;
    renderProducts();
};

window.openQuickView = function(id) {
    const p = products.find(item => item.id === id);
    if (!p) return;
    selectedSize = 'L';
    
    document.getElementById('qvImage').src = p.image;
    document.getElementById('qvCategory').innerText = p.category;
    document.getElementById('qvTitle').innerText = p.title;
    document.getElementById('qvPrice').innerText = `৳ ${p.price}`;
    document.getElementById('qvDesc').innerText = p.description || '';

    highlightSizeButton(selectedSize);

    const btn = document.getElementById('qvAddToCartBtn');
    btn.onclick = () => {
        addToCartWithConfig(p, selectedSize);
        closeQuickView();
    };
    document.getElementById('quickViewModal').classList.remove('opacity-0', 'pointer-events-none');
};

window.selectSize = function(size) {
    selectedSize = size;
    highlightSizeButton(size);
};

function highlightSizeButton(size) {
    document.querySelectorAll('.size-btn').forEach(btn => {
        if (btn.innerText === size) {
            btn.className = "size-btn px-4 py-2 rounded-xl bg-amber-500 text-black border border-amber-500 text-xs font-bold";
        } else {
            btn.className = "size-btn px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-xs font-bold text-white hover:border-amber-500";
        }
    });
}

window.closeQuickView = function() {
    document.getElementById('quickViewModal').classList.add('opacity-0', 'pointer-events-none');
};

window.addToCartWithConfig = function(product, size) {
    const cartItemId = `${product.id}-${size}`;
    const existingIndex = cart.findIndex(item => item.cartItemId === cartItemId);
    
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ ...product, cartItemId, size, qty: 1 });
    }
    updateCartUI();
    showToast(`Added "${product.title}" (${size}) to cart!`);
    toggleCart(true);
};

window.toggleCart = function(open) {
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartBackdrop');
    if (open) {
        drawer.classList.remove('translate-x-full');
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        drawer.classList.add('translate-x-full');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
    }
};

function updateCartUI() {
    const container = document.getElementById('cartItemsContainer');
    const badge = document.getElementById('cartCountBadge');
    const subtotalEl = document.getElementById('cartSubtotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    badge.innerText = cart.reduce((acc, i) => acc + i.qty, 0);

    if (cart.length === 0) {
        container.innerHTML = `<div class="text-center py-16 text-gray-500"><i class="fa-solid fa-basket-shopping text-4xl mb-3"></i><p class="text-sm font-semibold">Your bag is empty</p></div>`;
        subtotalEl.innerText = '৳ 0';
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;
    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.qty;
        const div = document.createElement('div');
        div.className = "p-3 bg-brand-surface border border-brand-border rounded-2xl flex gap-3 items-center";
        div.innerHTML = `
            <img src="${item.image}" class="w-16 h-16 object-cover rounded-xl bg-black">
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-white truncate">${item.title}</h4>
                <div class="text-[11px] text-amber-400 font-semibold mt-0.5">Size: <span class="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 font-bold">${item.size}</span></div>
                <div class="text-xs text-white font-bold mt-1">৳ ${item.price}</div>
                <div class="flex items-center gap-2 mt-2">
                    <button onclick="changeQty('${item.cartItemId}', -1)" class="w-6 h-6 rounded-md bg-black text-gray-300 flex items-center justify-center text-xs">-</button>
                    <span class="text-xs font-bold text-white w-4 text-center">${item.qty}</span>
                    <button onclick="changeQty('${item.cartItemId}', 1)" class="w-6 h-6 rounded-md bg-black text-gray-300 flex items-center justify-center text-xs">+</button>
                </div>
            </div>
            <button onclick="removeFromCart('${item.cartItemId}')" class="text-gray-500 hover:text-red-400 p-1"><i class="fa-solid fa-trash-can text-xs"></i></button>
        `;
        container.appendChild(div);
    });
    subtotalEl.innerText = `৳ ${subtotal}`;
}

window.changeQty = function(cartItemId, delta) {
    const index = cart.findIndex(i => i.cartItemId === cartItemId);
    if (index > -1) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) cart.splice(index, 1);
        updateCartUI();
    }
};

window.removeFromCart = function(cartItemId) {
    cart = cart.filter(i => i.cartItemId !== cartItemId);
    updateCartUI();
};

window.openCheckoutModal = function() {
    toggleCart(false);
    updateCheckoutTotal();
    document.getElementById('checkoutModal').classList.remove('opacity-0', 'pointer-events-none');
};

window.closeCheckoutModal = function() {
    document.getElementById('checkoutModal').classList.add('opacity-0', 'pointer-events-none');
};

window.updateCheckoutTotal = function() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const deliveryCharge = parseInt(document.getElementById('deliveryArea').value);
    document.getElementById('checkoutTotalDisplay').innerText = `৳ ${subtotal + deliveryCharge}`;
};

window.handlePlaceOrder = function(e) {
    e.preventDefault();
    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const address = document.getElementById('orderAddress').value;
    const deliveryAreaSelect = document.getElementById('deliveryArea');
    const deliveryAreaText = deliveryAreaSelect.options[deliveryAreaSelect.selectedIndex].text;
    const deliveryCharge = parseInt(deliveryAreaSelect.value);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    const orderData = {
        customerName: name,
        phone: phone,
        address: address,
        deliveryArea: deliveryAreaText,
        deliveryCharge: deliveryCharge,
        items: cart,
        totalAmount: subtotal + deliveryCharge,
        orderDate: new Date().toLocaleString()
    };

    push(ref(db, 'orders'), orderData)
        .then(() => {
            cart = [];
            updateCartUI();
            closeCheckoutModal();
            showToast("Order placed successfully!");
        })
        .catch((err) => alert("Order failed: " + err.message));
};

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => { toast.classList.add('translate-y-20', 'opacity-0'); }, 3000);
}
