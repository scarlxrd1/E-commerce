/**
 * AURA Global Scripts
 * Handles global state like the Cart Notification Badge across all pages using localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
    const cartBadge = document.getElementById('cart-badge');
    
    // 1. Initialize cart count from localStorage on page load
    let globalCartCount = parseInt(localStorage.getItem('aura_cart_count')) || 0;
    renderBadge(globalCartCount);

    // 2. Intercept clicks on any "Add to Cart" or "Quick Add" buttons globally
    document.body.addEventListener('click', (e) => {
        // Find if the clicked element (or its parent) is one of our add-to-cart buttons
        const isAddBtn = e.target.closest('.quick-add-btn, .grid-add-to-cart-btn, #modal-add-to-cart-btn');
        
        if (isAddBtn) {
            globalCartCount++;
            localStorage.setItem('aura_cart_count', globalCartCount);
            renderBadge(globalCartCount);
        }
    });

    // 3. Listen for storage events to sync the badge across multiple open tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'aura_cart_count') {
            globalCartCount = parseInt(e.newValue) || 0;
            renderBadge(globalCartCount);
        }
    });

    // Helper function to update the UI badge
    function renderBadge(count) {
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
    
    // Expose to window so other scripts (like shop.js) can manually override if needed
    window.updateGlobalCartCount = function(newCount) {
        globalCartCount = newCount;
        localStorage.setItem('aura_cart_count', globalCartCount);
        renderBadge(globalCartCount);
    };
});
