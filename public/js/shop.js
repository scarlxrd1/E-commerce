/**
 * AURA E-Commerce Frontend Logic
 * Handles interactive cart states, UI feedback, and category filtering.
 */

let cartCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    initCartLogic();
    initCategoryFilters();
});

/**
 * Initializes the "Add to Cart" functionality and visual feedback.
 */
function initCartLogic() {
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    const cartBadge = document.getElementById('cart-badge');

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent triggering any parent link/click events
            e.preventDefault();
            e.stopPropagation();
            
            // 1. Increment Cart Counter
            cartCount++;
            
            // 2. Update UI Navbar Badge
            cartBadge.textContent = cartCount;
            if (cartCount === 1) {
                // Reveal the badge smoothly on first add
                cartBadge.classList.remove('opacity-0');
                cartBadge.classList.add('opacity-100');
            }
            
            // 3. Provide Visual Feedback on the Button
            const originalText = "Add to Cart";
            
            // Apply success styling (Lighter stone color to indicate success, keeping premium feel)
            btn.textContent = 'Added';
            btn.classList.remove('bg-stone-900');
            btn.classList.add('bg-stone-500'); 
            
            // Revert the button text and styling after 2 seconds
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-stone-500');
                btn.classList.add('bg-stone-900');
            }, 2000);
        });
    });
}

/**
 * Initializes the dynamic product filtering functionality.
 */
function initCategoryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset the active state styling for all filter buttons
            filterBtns.forEach(b => {
                b.classList.remove('border-stone-900', 'text-stone-900');
                b.classList.add('border-transparent', 'text-stone-500');
            });
            
            // Apply the active state styling to the currently clicked button
            btn.classList.remove('border-transparent', 'text-stone-500');
            btn.classList.add('border-stone-900', 'text-stone-900');

            const selectedCategory = btn.getAttribute('data-filter');

            // Filter the product grid
            products.forEach(product => {
                const productCategory = product.getAttribute('data-category');
                
                if (selectedCategory === 'all' || productCategory === selectedCategory) {
                    product.style.display = 'flex';
                } else {
                    product.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Stub function ready for Backend integration.
 * Connect your Firebase/Stripe or custom backend logic here.
 */
async function checkout() {
    try {
        console.log("Initiating secure checkout process...");
        
        // TODO: Inject your backend logic here
        // Example Stripe Integration:
        // const session = await stripe.redirectToCheckout({ sessionId: 'YOUR_SESSION_ID' });
        
        // Example Firebase Integration:
        // await firebase.firestore().collection('orders').add({
        //     items: cartCount,
        //     timestamp: firebase.firestore.FieldValue.serverTimestamp()
        // });
        
    } catch (error) {
        console.error("Checkout process encountered an error:", error);
    }
}