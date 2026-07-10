/**
 * AURA E-Commerce Frontend Logic
 * Handles interactive cart states, dynamic modal injection, and category filtering.
 */

// --- Global State ---
let cartCount = 0;
let cartTotal = 0;

// --- DOM Elements ---
const cartBadge = document.getElementById('cart-badge');
const cartTotalEl = document.getElementById('cart-total');
const cartItemsContainer = document.getElementById('cart-items-container');
const emptyCartMsg = document.getElementById('empty-cart-msg');

document.addEventListener('DOMContentLoaded', () => {
    initCategoryFilters();
    initQuickViewModal();
    initCartDrawer();
    initGridAddToCart();
});

/**
 * 1. Category Filtering Logic
 * Handles clicks on both top nav links and the main filter bar.
 */
function initCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn, .nav-filter');
    const products = document.querySelectorAll('.product-card');
    const mainFilterBtns = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedCategory = btn.getAttribute('data-category');

            // Update styling only for the main filter bar buttons
            if (btn.classList.contains('filter-btn')) {
                mainFilterBtns.forEach(b => {
                    b.classList.remove('border-stone-900', 'text-stone-900');
                    b.classList.add('border-transparent', 'text-stone-500');
                });
                btn.classList.remove('border-transparent', 'text-stone-500');
                btn.classList.add('border-stone-900', 'text-stone-900');
            }

            // Filter the product grid
            products.forEach(product => {
                const productCategories = product.getAttribute('data-category').split(' ');
                
                if (selectedCategory === 'all' || productCategories.includes(selectedCategory)) {
                    // Show product
                    product.classList.remove('hidden');
                    product.classList.add('flex');
                    // Small animation trigger
                    product.style.opacity = '0';
                    setTimeout(() => product.style.opacity = '1', 50);
                } else {
                    // Hide product
                    product.classList.add('hidden');
                    product.classList.remove('flex');
                }
            });

            // If a nav link was clicked, scroll smoothly to the shop section
            if (btn.classList.contains('nav-filter')) {
                document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/**
 * 2. Quick View Modal Logic
 * Intercepts product card clicks, injects data, and manages modal state.
 */
function initQuickViewModal() {
    const products = document.querySelectorAll('.product-card');
    const modal = document.getElementById('quick-view-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const content = document.getElementById('modal-content');
    const closeBtn = document.getElementById('close-modal-btn');
    
    // Modal internal elements
    const mImage = document.getElementById('modal-image');
    const mTitle = document.getElementById('modal-title');
    const mPrice = document.getElementById('modal-price');
    const mDesc = document.getElementById('modal-desc');
    const mAddBtn = document.getElementById('modal-add-to-cart-btn');

    // Open Modal
    products.forEach(product => {
        product.addEventListener('click', (e) => {
            // Prevent opening modal if the "Add to Cart" grid button was clicked
            if (e.target.closest('.grid-add-to-cart-btn')) return;

            // Extract Data
            const title = product.getAttribute('data-title');
            const price = product.getAttribute('data-price');
            const image = product.getAttribute('data-image');
            const desc = product.getAttribute('data-desc');

            // Inject Data into Modal
            mTitle.textContent = title;
            mPrice.textContent = `€${parseInt(price).toLocaleString()}`;
            mImage.src = image;
            mImage.alt = title;
            mDesc.textContent = desc;

            // Attach current product data to the modal's Add to Cart button
            mAddBtn.dataset.title = title;
            mAddBtn.dataset.price = price;
            mAddBtn.dataset.image = image;

            // Show Modal (with transitions)
            modal.classList.remove('hidden');
            // Small delay to allow display:block to apply before animating opacity/transform
            setTimeout(() => {
                backdrop.classList.remove('opacity-0');
                backdrop.classList.add('opacity-100');
                content.classList.remove('opacity-0', 'scale-95');
                content.classList.add('opacity-100', 'scale-100');
            }, 10);
            
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close Modal Function
    const closeModal = () => {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        content.classList.remove('opacity-100', 'scale-100');
        content.classList.add('opacity-0', 'scale-95');
        
        // Wait for transition to finish before hiding completely
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Modal Add to Cart Button Logic
    mAddBtn.addEventListener('click', (e) => {
        const productData = {
            title: mAddBtn.dataset.title,
            price: parseInt(mAddBtn.dataset.price),
            image: mAddBtn.dataset.image
        };
        
        processAddToCart(productData, mAddBtn);
    });
}

/**
 * 3. Cart Drawer Logic
 * Toggles the slide-out cart drawer.
 */
function initCartDrawer() {
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const drawerContainer = document.getElementById('cart-drawer-container');
    const backdrop = document.getElementById('cart-backdrop');
    const drawer = document.getElementById('cart-drawer');
    const closeBtn = document.getElementById('close-cart-btn');

    const openCart = () => {
        drawerContainer.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            backdrop.classList.add('opacity-100');
            drawer.classList.remove('translate-x-full');
            drawer.classList.add('translate-x-0');
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    const closeCart = () => {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        drawer.classList.remove('translate-x-0');
        drawer.classList.add('translate-x-full');
        
        setTimeout(() => {
            drawerContainer.classList.add('hidden');
            // Only restore body overflow if the Quick View modal isn't also open
            if(document.getElementById('quick-view-modal').classList.contains('hidden')){
                document.body.style.overflow = '';
            }
        }, 300);
    };

    cartIconBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });
    
    closeBtn.addEventListener('click', closeCart);
    backdrop.addEventListener('click', closeCart);
}

/**
 * 4. Add to Cart Logic (Grid Buttons)
 */
function initGridAddToCart() {
    const gridBtns = document.querySelectorAll('.grid-add-to-cart-btn');
    
    gridBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the modal
            
            const productCard = btn.closest('.product-card');
            const productData = {
                title: productCard.getAttribute('data-title'),
                price: parseInt(productCard.getAttribute('data-price')),
                image: productCard.getAttribute('data-image')
            };

            processAddToCart(productData, btn);
        });
    });
}

/**
 * Core function to process adding an item to the cart.
 * Updates state, UI badge, drawer list, totals, and button visual feedback.
 */
function processAddToCart(product, buttonElement) {
    // 1. Update State
    cartCount++;
    cartTotal += product.price;

    // 2. Update Navbar Badge
    cartBadge.textContent = cartCount;
    if (cartCount === 1) {
        cartBadge.classList.remove('opacity-0');
        cartBadge.classList.add('opacity-100');
        emptyCartMsg.style.display = 'none'; // Hide empty message
    }

    // 3. Update Cart Total UI
    cartTotalEl.textContent = `€${cartTotal.toLocaleString()}`;

    // 4. Inject Item into Cart Drawer
    const itemHTML = `
        <div class="flex items-center gap-4 group">
            <div class="w-20 h-20 bg-stone-100 rounded-md overflow-hidden flex-shrink-0">
                <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1">
                <h4 class="font-serif text-stone-900 text-sm md:text-base">${product.title}</h4>
                <p class="font-sans text-stone-500 text-sm mt-1">€${product.price.toLocaleString()}</p>
            </div>
        </div>
    `;
    cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);

    // 5. Button Visual Feedback
    const originalText = buttonElement.textContent;
    
    buttonElement.textContent = 'Added';
    buttonElement.classList.remove('bg-stone-900', 'hover:bg-stone-800');
    buttonElement.classList.add('bg-stone-500'); 
    
    setTimeout(() => {
        buttonElement.textContent = originalText.trim();
        buttonElement.classList.remove('bg-stone-500');
        buttonElement.classList.add('bg-stone-900', 'hover:bg-stone-800');
    }, 2000);
}

/**
 * Stub function ready for Backend integration.
 */
async function checkout() {
    if (cartCount === 0) return alert("Your cart is empty.");
    
    try {
        console.log(`Initiating secure checkout for ${cartCount} items totaling €${cartTotal}...`);
        
        // TODO: Inject your backend logic here (Stripe, Firebase, etc.)
        // Example: const session = await stripe.redirectToCheckout({ sessionId: 'YOUR_SESSION_ID' });
        
        // Simulate a redirect/processing state
        const checkoutBtn = document.querySelector('#cart-drawer button[onclick="checkout()"]');
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
}
