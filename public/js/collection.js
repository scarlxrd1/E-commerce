/**
 * AURA Collection Page Logic
 * Handles scroll animations, category filtering, and quick add interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initFilters();
    initQuickAdd();
});

/**
 * Uses Intersection Observer to fade in products as they scroll into view.
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add class to trigger CSS transition
                entry.target.classList.add('is-visible');
                // Unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Handles the filtering of the product grid based on category selection.
 */
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');
    const countDisplay = document.getElementById('item-count');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset all buttons styling
            filterBtns.forEach(b => {
                b.classList.remove('border-stone-900', 'text-stone-900');
                b.classList.add('border-transparent', 'text-stone-400');
            });
            
            // Apply active styling to clicked button
            btn.classList.remove('border-transparent', 'text-stone-400');
            btn.classList.add('border-stone-900', 'text-stone-900');

            const category = btn.getAttribute('data-filter');
            let visibleCount = 0;

            // Filter products
            products.forEach(product => {
                if (category === 'all' || product.getAttribute('data-category') === category) {
                    product.style.display = 'flex';
                    visibleCount++;
                    
                    // Re-trigger the fade-in animation slightly for a smooth UI refresh
                    product.classList.remove('is-visible');
                    setTimeout(() => product.classList.add('is-visible'), 50);
                } else {
                    product.style.display = 'none';
                    product.classList.remove('is-visible');
                }
            });

            // Update item count text
            countDisplay.textContent = `Showing ${visibleCount} piece${visibleCount !== 1 ? 's' : ''}`;
        });
    });
}

/**
 * Handles the "Quick Add" button interactions and UI feedback.
 */
function initQuickAdd() {
    const addBtns = document.querySelectorAll('.quick-add-btn');
    const cartBadge = document.getElementById('cart-badge');
    let cartCount = 0;

    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Increment cart logic
            cartCount++;
            cartBadge.textContent = cartCount;
            cartBadge.classList.remove('opacity-0');
            cartBadge.classList.add('opacity-100');

            // Visual feedback on the button
            const originalText = btn.textContent;
            btn.textContent = 'Added';
            btn.classList.remove('bg-stone-900', 'hover:bg-stone-800');
            btn.classList.add('bg-stone-400', 'text-stone-900');

            // Revert button text after delay
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-stone-400', 'text-stone-900');
                btn.classList.add('bg-stone-900', 'hover:bg-stone-800');
            }, 2000);
        });
    });
}
