/**
 * AURA Global Engine
 * Handles UI Component Injection (Navbar/Footer/Cart), Global Cart State, Hybrid Cloud/Local Sync, Auth State, and i18n Translation.
 */

import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { translations } from './translations.js';

const navbarHTML = `
    <nav class="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-stone-200/50 transition-all">
        <div class="max-w-[1400px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
            <a href="index.html" class="font-serif text-2xl tracking-wide text-stone-900">AURA.</a>
            <div class="hidden md:flex items-center gap-10">
                <a href="collection.html" class="font-sans text-sm text-stone-500 hover:text-stone-900 transition-colors" data-i18n="nav.collection">Collection</a>
            </div>
            <div class="flex items-center gap-4 sm:gap-6 text-stone-900">
                
                <!-- Global Search Form -->
                <form id="global-search-form" class="flex items-center">
                    <input type="text" id="global-search-input" data-i18n="nav.search" placeholder="Search..." class="w-20 sm:w-28 md:w-40 bg-transparent border-b border-transparent focus:border-stone-300 py-1 px-2 text-sm font-sans text-stone-900 placeholder-stone-400 focus:outline-none transition-all duration-300 mr-1">
                    <button type="submit" id="global-search-btn" class="hover:opacity-70 transition-opacity p-1" aria-label="Search">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </button>
                </form>

                <!-- User Profile Link with Auth Indicator -->
                <a href="auth.html" id="user-profile-link" class="relative hover:opacity-70 transition-opacity hidden sm:block" aria-label="User Profile">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span id="auth-indicator" class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-stone-900 rounded-full border-2 border-[#FBFBFA] hidden transition-all duration-300"></span>
                </a>

                <!-- Language Toggle -->
                <div class="relative group hidden sm:block">
                    <button class="font-sans text-xs font-medium tracking-widest text-stone-500 hover:text-stone-900 transition-colors uppercase flex items-center gap-1" id="current-lang-display">
                        EN
                    </button>
                    <div class="absolute top-full right-0 mt-2 w-16 bg-white border border-stone-200 shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col z-50">
                        <button onclick="window.changeLanguage('en')" class="text-xs font-sans tracking-widest text-stone-500 hover:text-stone-900 hover:bg-stone-50 py-3 w-full text-center transition-colors">EN</button>
                        <button onclick="window.changeLanguage('el')" class="text-xs font-sans tracking-widest text-stone-500 hover:text-stone-900 hover:bg-stone-50 py-3 w-full text-center transition-colors border-t border-stone-100">EL</button>
                    </div>
                </div>

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
                    <p class="font-sans text-sm text-stone-500 leading-relaxed" data-i18n="footer.desc">Defining the modern sanctuary through minimalist, sustainable, and timeless interior design.</p>
                </div>
                <div>
                    <a href="customer-care.html" class="block group mb-6">
                        <h4 class="font-sans text-sm font-semibold tracking-widest uppercase text-stone-900 group-hover:text-stone-500 transition-colors" data-i18n="footer.customer_care">Customer Care</h4>
                    </a>
                    <ul class="space-y-4 font-sans text-sm text-stone-500">
                        <li class="leading-relaxed" data-i18n="footer.address">123 Aura Boulevard, Suite 400<br>New York, NY 10012</li>
                        <li>+1 800 555 0199</li>
                        <li><a href="mailto:hello@aurafurniture.com" class="hover:text-stone-900 transition-colors">hello@aurafurniture.com</a></li>
                        <li class="pt-2"><a href="customer-care.html" class="hover:text-stone-900 transition-colors underline underline-offset-4 decoration-stone-300" data-i18n="footer.faq">FAQs & Returns</a></li>
                    </ul>
                </div>
                <div>
                    <a href="details.html" class="block group mb-6">
                        <h4 class="font-sans text-sm font-semibold tracking-widest uppercase text-stone-900 group-hover:text-stone-500 transition-colors" data-i18n="footer.details">Details</h4>
                    </a>
                    <ul class="space-y-4 font-sans text-sm text-stone-500">
                        <li><a href="details.html#shipping" class="hover:text-stone-900 transition-colors" data-i18n="footer.shipping">Shipping Information</a></li>
                        <li><a href="details.html#sustainability" class="hover:text-stone-900 transition-colors" data-i18n="footer.sustainability">Sustainability</a></li>
                        <li><a href="details.html#terms" class="hover:text-stone-900 transition-colors" data-i18n="footer.terms">Terms of Service</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-sans text-sm font-semibold tracking-widest uppercase text-stone-900 mb-6" data-i18n="footer.newsletter">Newsletter</h4>
                    <p class="font-sans text-sm text-stone-500 mb-4" data-i18n="footer.newsletter_desc">Subscribe to receive updates, access to exclusive deals, and more.</p>
                    <form class="flex items-end group" onsubmit="event.preventDefault();">
                        <input type="email" data-i18n="footer.newsletter_placeholder" placeholder="Enter your email address" required class="w-full bg-transparent border-b border-stone-300 py-2 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors">
                        <button type="submit" class="pb-2 pl-2 text-stone-400 group-hover:text-stone-900 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </button>
                    </form>
                </div>
            </div>
            <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-stone-200">
                <p class="font-sans text-xs text-stone-400" data-i18n="footer.rights">&copy; 2024 AURA Interior Design. All rights reserved.</p>
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
                <h2 class="font-serif text-2xl text-stone-900" data-i18n="cart.title">Your Cart</h2>
                <button id="close-cart-btn" class="p-2 -mr-2 text-stone-500 hover:text-stone-900 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div id="cart-items-container" class="flex-1 overflow-y-auto px-8 py-6 space-y-6 no-scrollbar">
                <!-- Items injected here -->
            </div>
            <div class="px-8 py-6 border-t border-stone-200 bg-stone-50/50">
                <div class="flex justify-between items-center mb-6">
                    <span class="font-sans text-stone-500 uppercase tracking-widest text-xs font-semibold" data-i18n="cart.subtotal">Subtotal</span>
                    <span id="cart-total" class="font-serif text-2xl text-stone-900">€0</span>
                </div>
                <p class="font-sans text-xs text-stone-400 mb-6" data-i18n="cart.shipping_note">Shipping and taxes calculated at checkout.</p>
                <button onclick="window.checkout()" class="w-full bg-stone-900 text-white font-sans text-sm tracking-widest uppercase py-4 rounded-md hover:bg-stone-800 transition-colors shadow-sm" data-i18n="cart.checkout">
                    Secure Checkout
                </button>
            </div>
        </div>
    </div>
`;

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
let cart = [];
let currentUser = null;

// ==========================================
// 2. I18N TRANSLATION ENGINE
// ==========================================
window.changeLanguage = function(lang) {
    localStorage.setItem('aura_lang', lang);
    document.documentElement.lang = lang;

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const keys = key.split('.');
        let value = translations[lang];
        
        for (const k of keys) {
            if (value) value = value[k];
        }

        if (value) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = value;
            } else {
                el.innerHTML = value; 
            }
        }
    });

    const langDisplay = document.getElementById('current-lang-display');
    if (langDisplay) {
        langDisplay.textContent = lang.toUpperCase();
    }

    // Re-render cart to ensure dynamic strings (like Empty Cart) are translated
    renderCart();
};

// ==========================================
// 3. INJECT UI & INITIALIZE
// ==========================================
function initGlobalUI() {
    const navContainer = document.getElementById('navbar-container');
    if (navContainer) navContainer.innerHTML = navbarHTML;

    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) footerContainer.innerHTML = footerHTML;

    if (!document.getElementById('cart-drawer-container')) {
        document.body.insertAdjacentHTML('beforeend', cartDrawerHTML);
    }

    // Initialize Language
    const savedLang = localStorage.getItem('aura_lang') || 'en';
    window.changeLanguage(savedLang);

    // Global Search Logic
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

    // Auth State Listener (Smart Routing & Hybrid Cart Sync)
    const auth = getAuth(app);
    onAuthStateChanged(auth, async (user) => {
        const indicator = document.getElementById('auth-indicator');
        const profileLink = document.getElementById('user-profile-link');
        
        if (user) {
            // Logged in
            currentUser = user;
            if (indicator) indicator.classList.remove('hidden');
            if (profileLink) profileLink.href = 'profile.html';
            
            // Sync cart from Firestore and merge local storage if needed
            await syncCartOnLogin(user);
        } else {
            // Logged out
            currentUser = null;
            if (indicator) indicator.classList.add('hidden');
            if (profileLink) profileLink.href = 'auth.html';
            
            // Load local cart
            cart = JSON.parse(localStorage.getItem('aura_cart')) || [];
            renderCart();
        }
    });
}

// ==========================================
// 4. HYBRID CART LOGIC
// ==========================================
async function syncCartOnLogin(user) {
    const userRef = doc(db, "users", user.uid);
    let firestoreCart = [];
    
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            firestoreCart = docSnap.data().cart || [];
        } else {
            // Create user doc if it doesn't exist (failsafe)
            await setDoc(userRef, { email: user.email, cart: [] }, { merge: true });
        }

        // Merge logic: Check if guest cart exists in localStorage
        const localCart = JSON.parse(localStorage.getItem('aura_cart')) || [];
        
        if (localCart.length > 0) {
            localCart.forEach(localItem => {
                const existing = firestoreCart.find(item => item.id === localItem.id);
                if (existing) {
                    existing.quantity += localItem.quantity;
                    // Cap at stock limit
                    if (existing.stock && existing.quantity > existing.stock) {
                        existing.quantity = existing.stock;
                    }
                } else {
                    firestoreCart.push(localItem);
                }
            });
            
            // Update Firestore with merged cart
            await updateDoc(userRef, { cart: firestoreCart });
            
            // Clear local cache since it's now synced to the cloud
            localStorage.removeItem('aura_cart');
        }

        cart = firestoreCart;
        renderCart();

    } catch (error) {
        console.error("Error syncing cart on login:", error);
        cart = [];
        renderCart();
    }
}

async function saveCart() {
    if (currentUser) {
        // Save to Firestore
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, { cart: cart });
        } catch (error) {
            console.error("Error saving cart to cloud:", error);
        }
    } else {
        // Save to LocalStorage
        localStorage.setItem('aura_cart', JSON.stringify(cart));
    }
    renderCart();
}

function renderCart() {
    const badge = document.getElementById('cart-badge');
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    
    let total = 0;
    let count = 0;
    let html = '';

    const currentLang = localStorage.getItem('aura_lang') || 'en';
    const emptyMsg = translations[currentLang]?.cart?.empty || translations['en'].cart.empty;
    const qtyLabel = translations[currentLang]?.cart?.qty || translations['en'].cart.qty;

    if (cart.length === 0) {
        html = `
            <div id="empty-cart-msg" class="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-4">
                <svg class="w-12 h-12 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                <p class="font-sans text-sm" data-i18n="cart.empty">${emptyMsg}</p>
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
                        <p class="font-sans text-stone-500 text-sm mt-1">€${item.price.toLocaleString()} <span class="text-xs text-stone-400 ml-2"><span data-i18n="cart.qty">${qtyLabel}</span>: ${item.quantity}</span></p>
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

window.addToCart = function(product) {
    const existing = cart.find(item => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const maxStock = product.stock || 0;

    if (currentQty >= maxStock) {
        return false; 
    }

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    // Asynchronous save, UI updates immediately inside saveCart
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

// Redirect to the new Checkout Page
window.checkout = async function() {
    if (cart.length === 0) return alert("Your cart is empty.");
    
    const checkoutBtn = document.querySelector('#cart-drawer button[onclick="window.checkout()"]');
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = "Redirecting...";
    checkoutBtn.classList.add('opacity-70', 'cursor-not-allowed');
    
    setTimeout(() => {
        window.location.href = 'checkout.html';
    }, 300);
};

// ==========================================
// 5. EVENT LISTENERS & TAB SYNC
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

// Sync local storage cart updates across tabs (only for guests)
window.addEventListener('storage', (e) => {
    if (!currentUser && e.key === 'aura_cart') {
        cart = JSON.parse(e.newValue) || [];
        renderCart();
    }
});

// Run Init
initGlobalUI();
