// public/js/global.js

/**
 * AURA Global Engine
 * Handles UI Component Injection (Navbar/Footer) and Global Cart State.
 */

const navbarHTML = `
    <nav class="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-stone-200/50 transition-all">
        <div class="max-w-[1400px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
            <!-- Brand Logo -->
            <a href="index.html" class="font-serif text-2xl tracking-wide text-stone-900">AURA.</a>
            
            <!-- Center Navigation Links (Minimized) -->
            <div class="hidden md:flex items-center gap-10">
                <a href="collection.html" class="font-sans text-sm text-stone-500 hover:text-stone-900 transition-colors">Collection</a>
            </div>
            
            <!-- Right Icons -->
            <div class="flex items-center gap-6 text-stone-900">
                <button class="hover:opacity-70 transition-opacity" aria-label="Search">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
                <button class="hover:opacity-70 transition-opacity hidden sm:block" aria-label="User Profile">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </button>
                <!-- Shopping Cart Icon -->
                <button id="cart-icon-btn" class="relative hover:opacity-70 transition-opacity" aria-label="Shopping Cart">
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
                        <li class="leading-relaxed">
                            123 Aura Boulevard, Suite 400<br>
                            New York, NY 10012
                        </li>
                        <li>+1 800 555 0199</li>
                        <li><a href="mailto:hello@aurafurniture.com" class="hover:text-stone-900 transition-colors">hello@aurafurniture.com</a></li>
                        <li class="pt-2"><a href="customer-care.html" class="hover:text-stone-900 transition-colors underline underline-offset-4 decoration-stone-300">FAQs & Returns</a></li>
                    </ul>
                </div>
                <div>
                    <!-- Active Details Header Link -->
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

// ==========================================
// 1. COMPONENT INJECTION
// ==========================================
// We run this immediately (synchronously) so the DOM elements exist 
// before other scripts (like shop.js) look for them on DOMContentLoaded.
function renderNavbar() {
    const navContainer = document.getElementById('navbar-container');
    if (navContainer) navContainer.innerHTML = navbarHTML;
}

function renderFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) footerContainer.innerHTML = footerHTML;
}

renderNavbar();
renderFooter();

// ==========================================
// 2. GLOBAL CART STATE MANAGEMENT
// ==========================================
let globalCartCount = parseInt(localStorage.getItem('aura_cart_count')) || 0;

function renderBadge(count) {
    const cartBadge = document.getElementById('cart-badge');
    if (!cartBadge) return;
    
    cartBadge.textContent = count;
    if (count > 0) {
        cartBadge.classList.remove('opacity-0');
        cartBadge.classList.add('opacity-100');
    } else {
        cartBadge.classList.add('opacity-0');
        cartBadge.classList.remove('opacity-100');
    }
}

// Initial badge render
renderBadge(globalCartCount);

/**
 * Global Add to Cart Function
 * Increments localStorage, updates the badge, and triggers button animations.
 */
window.addToCart = function(buttonElement = null) {
    globalCartCount++;
    localStorage.setItem('aura_cart_count', globalCartCount);
    renderBadge(globalCartCount);

    // Visual Confirmation on the Button
    if (buttonElement) {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Added';
        buttonElement.classList.remove('bg-stone-900', 'hover:bg-stone-800');
        buttonElement.classList.add('bg-stone-400', 'text-stone-900'); 
        
        setTimeout(() => {
            buttonElement.textContent = originalText.trim();
            buttonElement.classList.remove('bg-stone-400', 'text-stone-900');
            buttonElement.classList.add('bg-stone-900', 'hover:bg-stone-800');
        }, 2000);
    }
};

// Global Event Listener to catch ALL Add to Cart clicks across the site
document.addEventListener('click', (e) => {
    const isAddBtn = e.target.closest('.quick-add-btn, .grid-add-to-cart-btn, #modal-add-to-cart-btn');
    if (isAddBtn) {
        // Prevent default only if it's a link/submit, but allow the event to propagate 
        // so shop.js/collection.js can still do their specific logic (like opening modals)
        window.addToCart(isAddBtn);
    }
});

// Sync cart badge automatically if the user has multiple tabs open
window.addEventListener('storage', (e) => {
    if (e.key === 'aura_cart_count') {
        globalCartCount = parseInt(e.newValue) || 0;
        renderBadge(globalCartCount);
    }
});
