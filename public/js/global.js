/**
 * AURA Global Engine
 * Handles UI Component Injection (Navbar/Footer/Cart), Global Cart State, and LocalStorage Sync.
 */

const navbarHTML = `
    <nav class="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-stone-200/50 transition-all">
        <div class="max-w-[1400px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
            <a href="index.html" class="font-serif text-2xl tracking-wide text-stone-900">AURA.</a>
            <div class="hidden md:flex items-center gap-10">
                <a href="collection.html" class="font-sans text-sm text-stone-500 hover:text-stone-900 transition-colors">Collection</a>
            </div>
            <div class="flex items-center gap-4 sm:gap-6 text-stone-900">
                
                <!-- Global Search Form -->
                <form id="global-search-form" class="flex items-center">
                    <input type="text" id="global-search-input" placeholder="Search..." class="w-20 sm:w-28 md:w-40 bg-transparent border-b border-transparent focus:border-stone-300 py-1 px-2 text-sm font-sans text-stone-900 placeholder-stone-400 focus:outline-none transition-all duration-300 mr-1">
                    <button type="submit" id="global-search-btn" class="hover:opacity-70 transition-opacity p-1" aria-label="Search">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </button>
                </form>

                <button class="hover:opacity-70 transition-opacity hidden sm:block" aria-label="User Profile">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </button>
                <button id="cart-icon-btn" class="relative hover:opacity-70 transition-opacity" aria-label="Cart">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    <span id="cart-badge" class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-medium text-white opacity-0 transition-opacity duration-300">0</span>
                </button>
            </div>
        </div>
    </nav>
`;

const footerHTML = `
    <footer class="bg-stone-100 pt-20 pb-10 border-t border-stone-200">
        <div class="max-w-[1400px] mx-auto px-6 md:px-12">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div class="md:col-span-1">
                    <a href="index.html" class="font-serif text-2xl tracking-wide text-stone-900 block mb-6">AURA.</a>
                    <p class="font-sans text-sm text-stone-500 leading-relaxed">Defining the modern sanctuary through minimalist, sustainable, and timeless interior design.</p>
                </div>
                <div>
                    <a href="customer-care.html" class="block group mb-6">
                        <h4 class="font-sans text-sm font-semibold tracking-widest uppercase text-stone-900 group-hover:text-stone-500 transition-colors">Customer Care</h4>
                    </a>
                    <ul class="space-y-4 font-sans text-sm text-stone-500">
                        <li class="leading-relaxed">123 Aura Boulevard, Suite 400<br>New York, NY 10012</li>
                        <li>+1 800 555 0199</li>
                        <li><a href="mailto:hello@aurafurniture.com" class="hover:text-stone-900 transition-colors">hello@aurafurniture.com</a></li>
                        <li class="pt-2"><a href="customer-care.html" class="hover:text-stone-900 transition-colors underline underline-offset-4 decoration-stone-300">FAQs & Returns</a></li>
                    </ul>
                </div>
                <div>
                    <a href="details.html" class="block group mb-6">
                        <h4 class="font-sans text-sm font-semibold tracking-widest uppercase text-stone-900 group-hover:text-stone-500 transition-colors">Details</h4>
                    </a>
                    <ul class="space-y-4 font-sans text-sm text-stone-500">
                        <li><a href="details.html#shipping" class="hover:text-stone-900 transition-colors">Shipping Information</a></li>
                        <li><a href="details.html#sustainability" class="hover:text-stone-900 transition-colors">Sustainability</a></li>
                        <li><a href="details.html#terms" class="hover:text-stone-900 transition-colors">Terms of Service</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-sans text-sm font-semibold tracking-widest uppercase text-stone-900 mb-6">Newsletter</h4>
                    <p class="font-sans text-sm text-stone-500 mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
                    <form class="flex items-end group" onsubmit="event.preventDefault();">
                        <input type="email" placeholder="Enter your email address" required class="w-full bg-transparent border-b border-stone-300 py-2 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors">
                        <button type="submit" class="pb-2 pl-2 text-stone-400 group-hover:text-stone-900 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </button>
                    </form>
                </div>
            </div>
            <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-stone-200">
                <p class="font-sans text-xs text-stone-400">&copy; 2024 AURA Interior Design. All rights reserved.</p>
                <div class="flex gap-6 mt-4 md:mt-0">
                    <a href="#" class="text-stone-400 hover:text-stone-900 transition-colors text-sm font-medium">IG</a>
                    <a href="#" class="text-stone-400 hover:text-stone-900 transition-colors text-sm font-medium">PT</a>
                </div>
            </div>
        </div>
    </footer>
`;

const cartDrawerHTML = `
    <div id="cart-drawer-container" class="fixed inset-0 z-[100] hidden pointer-events-none">
        <div id="cart-backdrop" class="absolute inset-0 bg-stone-900/20 backdrop-blur-sm opacity-0 transition-opacity duration-300 pointer-events-auto"></div>
        <div id="cart-drawer" class="absolute top-0 right-0 h-full w-full max-w-md bg-[#FAFAFA] shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col pointer-events-auto">
            <div class="flex items-center justify-between px-8 py-6 border-b border-stone-200">
                <h2 class="font-serif text-2xl text-stone-900">Your Cart</h2>
                <button id="close-cart-btn" class="p-2 -mr-2 text-stone-500 hover:text-stone-900 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div id="cart-items-container" class="flex-1 overflow-y-auto px-8 py-6 space-y-6 no-scrollbar">
                <!-- Items injected here -->
            </div>
            <div class="px-8 py-6 border-t border-stone-200 bg-stone-50/50">
                <div class="flex justify-between items-center mb-6">
                    <span class="font-sans text-stone-500 uppercase tracking-widest text-xs font-semibold">Subtotal</span>
                    <span id="cart-total" class="font-serif text-2xl text-stone-900">€0</span>
                </div>
                <p class="font-sans text-xs text-stone-400 mb-6">Shipping and taxes calculated at checkout.</p>
                <button onclick="window.checkout()" class="w-full bg-stone-900 text-white font-sans text-sm tracking-widest uppercase py-4 rounded-md hover:bg-stone-800 transition-colors shadow-sm">
                    Secure Checkout
                </button>
            </div>
        </div>
    </div>
`;

// ==========================================
// 1. INJECT UI & INITIALIZE
// ==========================================
function initGlobalUI() {
    const navContainer = document.getElementById('navbar-container');
    if (navContainer) navContainer.innerHTML = navbarHTML;

    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) footerContainer.innerHTML = footerHTML;

    if (!document.getElementById('cart-drawer-container')) {
        document.body.insertAdjacentHTML('beforeend', cartDrawerHTML);
    }
    
    renderCart();

    const searchForm = document.getElementById('global-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('global-search-input');
            if (input) {
                const query = input.value.trim();
                if (query) {
                    window.location.href = `collection.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

// ==========================================
// 2. GLOBAL CART STATE MANAGEMENT
// ==========================================
let cart = JSON.parse(localStorage.getItem('aura_cart')) || [];

function saveCart() {
    localStorage.setItem('aura_cart', JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    const badge = document.getElementById('cart-badge');
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    
    let total = 0;
    let count = 0;
    let html = '';

    if (cart.length === 0) {
        html = `
            <div id="empty-cart-msg" class="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-4">
                <svg class="w-12 h-12 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                <p class="font-sans text-sm">Your cart is currently empty.</p>
            </div>
        `;
    } else {
        cart.forEach((item, index) => {
            total += item.price * item.quantity;
            count += item.quantity;
            html += `
                <div class="flex items-center gap-4 group">
                    <div class="w-20 h-20 bg-stone-100 rounded-md overflow-hidden flex-shrink-0">
                        <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <h4 class="font-serif text-stone-900 text-sm md:text-base">${item.title}</h4>
                            <button onclick="window.removeFromCart(${index})" class="text-stone-400 hover:text-stone-900 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <p class="font-sans text-stone-500 text-sm mt-1">€${item.price.toLocaleString()} <span class="text-xs text-stone-400 ml-2">Qty: ${item.quantity}</span></p>
                    </div>
                </div>
            `;
        });
    }

    if (badge) {
        badge.textContent = count;
        if (count > 0) {
            badge.classList.remove('opacity-0');
            badge.classList.add('opacity-100');
        } else {
            badge.classList.add('opacity-0');
            badge.classList.remove('opacity-100');
        }
    }

    if (container) container.innerHTML = html;
    if (totalEl) totalEl.textContent = `€${total.toLocaleString()}`;
}

/**
 * Adds an item to the cart, respecting the strict backend stock limit.
 * @param {Object} product - The product data { id, title, price, image, stock }
 * @returns {boolean} - True if successfully added, False if max stock reached.
 */
window.addToCart = function(product) {
    const existing = cart.find(item => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const maxStock = product.stock || 0;

    // Block addition if we have reached or exceeded the stock limit
    if (currentQty >= maxStock) {
        return false; 
    }

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    window.openCart();
    return true; 
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
};

window.openCart = function() {
    const drawerContainer = document.getElementById('cart-drawer-container');
    const backdrop = document.getElementById('cart-backdrop');
    const drawer = document.getElementById('cart-drawer');
    if(!drawerContainer) return;

    drawerContainer.classList.remove('hidden');
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        drawer.classList.remove('translate-x-full');
        drawer.classList.add('translate-x-0');
    }, 10);
    document.body.style.overflow = 'hidden';
};

window.closeCart = function() {
    const drawerContainer = document.getElementById('cart-drawer-container');
    const backdrop = document.getElementById('cart-backdrop');
    const drawer = document.getElementById('cart-drawer');
    if(!drawerContainer) return;

    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    drawer.classList.remove('translate-x-0');
    drawer.classList.add('translate-x-full');
    
    setTimeout(() => {
        drawerContainer.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
};

window.checkout = async function() {
    if (cart.length === 0) return alert("Your cart is empty.");
    try {
        const checkoutBtn = document.querySelector('#cart-drawer button[onclick="window.checkout()"]');
        const originalText = checkoutBtn.textContent;
        checkoutBtn.textContent = "Processing...";
        checkoutBtn.classList.add('opacity-70', 'cursor-not-allowed');
        
        setTimeout(() => {
            alert("This is a frontend demo. Backend integration required for actual checkout.");
            checkoutBtn.textContent = originalText;
            checkoutBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }, 1500);
    } catch (error) {
        console.error("Checkout process encountered an error:", error);
    }
};

// ==========================================
// 3. EVENT LISTENERS & TAB SYNC
// ==========================================
document.addEventListener('click', (e) => {
    const cartOpenBtn = e.target.closest('[aria-label="Cart"], #cart-icon-btn');
    if (cartOpenBtn) {
        e.preventDefault();
        window.openCart();
    }

    const cartCloseBtn = e.target.closest('#close-cart-btn, #cart-backdrop');
    if (cartCloseBtn) {
        e.preventDefault();
        window.closeCart();
    }
});

window.addEventListener('storage', (e) => {
    if (e.key === 'aura_cart') {
        cart = JSON.parse(e.newValue) || [];
        renderCart();
    }
});

// Run Init
initGlobalUI();
