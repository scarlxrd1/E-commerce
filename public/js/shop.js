// public/js/shop.js

// Import Firebase dependencies
import { db } from './firebase-config.js';
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- Global State ---
let cartCount = 0;
let cartTotal = 0;

// --- DOM Elements ---
const cartBadge = document.getElementById('cart-badge');
const cartTotalEl = document.getElementById('cart-total');
const cartItemsContainer = document.getElementById('cart-items-container');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const productGrid = document.getElementById('product-grid');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch and render products from Firebase
    await fetchAndRenderProducts();

    // 2. Initialize UI scripts AFTER products are loaded into the DOM
    initCategoryFilters();
    initQuickViewModal();
    initCartDrawer();
    initGridAddToCart();
    
    // UNCOMMENT THE LINE BELOW TO SEED YOUR DATABASE ONCE, THEN RE-COMMENT IT.
    // await seedDatabase(); 
});

/**
 * Fetch products from Firestore and inject them into the HTML grid
 */
async function fetchAndRenderProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        
        let htmlString = "";
        
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            
            // Build the HTML for each product using your premium Tailwind styling
            htmlString += `
                <div class="product-card group flex flex-col gap-4 cursor-pointer" 
                     data-category="${product.categories}" 
                     data-title="${product.title}" 
                     data-price="${product.price}" 
                     data-image="${product.image}" 
                     data-desc="${product.desc}">
                    <div class="relative aspect-[4/5] overflow-hidden bg-stone-100 rounded-md">
                        <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                        <div class="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <button class="grid-add-to-cart-btn absolute bottom-6 left-6 right-6 bg-stone-900 text-white font-sans text-sm tracking-wide py-3.5 rounded-md opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-sm z-10 hover:bg-stone-800">
                            Add to Cart
                        </button>
                    </div>
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-serif text-lg text-stone-900">${product.title}</h3>
                            <p class="font-sans text-sm text-stone-500 mt-1">${product.subtitle}</p>
                        </div>
                        <span class="font-sans text-stone-900 font-medium">€${product.price.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });

        // Inject into the DOM
        if (productGrid) {
            productGrid.innerHTML = htmlString;
        }

    } catch (error) {
        console.error("Error fetching products from Firebase:", error);
        if (productGrid) {
            productGrid.innerHTML = `<p class="col-span-full text-center text-stone-500">Failed to load collection. Please try again later.</p>`;
        }
    }
}

/**
 * 1. Category Filtering Logic
 */
function initCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn, .nav-filter');
    const products = document.querySelectorAll('.product-card');
    const mainFilterBtns = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedCategory = btn.getAttribute('data-category');

            if (btn.classList.contains('filter-btn')) {
                mainFilterBtns.forEach(b => {
                    b.classList.remove('border-stone-900', 'text-stone-900');
                    b.classList.add('border-transparent', 'text-stone-500');
                });
                btn.classList.remove('border-transparent', 'text-stone-500');
                btn.classList.add('border-stone-900', 'text-stone-900');
            }

            products.forEach(product => {
                const productCategories = product.getAttribute('data-category').split(' ');
                
                if (selectedCategory === 'all' || productCategories.includes(selectedCategory)) {
                    product.classList.remove('hidden');
                    product.classList.add('flex');
                    product.style.opacity = '0';
                    setTimeout(() => product.style.opacity = '1', 50);
                } else {
                    product.classList.add('hidden');
                    product.classList.remove('flex');
                }
            });

            if (btn.classList.contains('nav-filter')) {
                document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/**
 * 2. Quick View Modal Logic
 */
function initQuickViewModal() {
    const products = document.querySelectorAll('.product-card');
    const modal = document.getElementById('quick-view-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const content = document.getElementById('modal-content');
    const closeBtn = document.getElementById('close-modal-btn');
    
    const mImage = document.getElementById('modal-image');
    const mTitle = document.getElementById('modal-title');
    const mPrice = document.getElementById('modal-price');
    const mDesc = document.getElementById('modal-desc');
    const mAddBtn = document.getElementById('modal-add-to-cart-btn');

    products.forEach(product => {
        product.addEventListener('click', (e) => {
            if (e.target.closest('.grid-add-to-cart-btn')) return;

            const title = product.getAttribute('data-title');
            const price = product.getAttribute('data-price');
            const image = product.getAttribute('data-image');
            const desc = product.getAttribute('data-desc');

            mTitle.textContent = title;
            mPrice.textContent = `€${parseInt(price).toLocaleString()}`;
            mImage.src = image;
            mImage.alt = title;
            mDesc.textContent = desc;

            mAddBtn.dataset.title = title;
            mAddBtn.dataset.price = price;
            mAddBtn.dataset.image = image;

            modal.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.remove('opacity-0');
                backdrop.classList.add('opacity-100');
                content.classList.remove('opacity-0', 'scale-95');
                content.classList.add('opacity-100', 'scale-100');
            }, 10);
            
            document.body.style.overflow = 'hidden';
        });
    });

    const closeModal = () => {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        content.classList.remove('opacity-100', 'scale-100');
        content.classList.add('opacity-0', 'scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; 
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

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
            e.stopPropagation(); 
            
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
 * Process Adding to Cart
 */
function processAddToCart(product, buttonElement) {
    cartCount++;
    cartTotal += product.price;

    cartBadge.textContent = cartCount;
    if (cartCount === 1) {
        cartBadge.classList.remove('opacity-0');
        cartBadge.classList.add('opacity-100');
        emptyCartMsg.style.display = 'none'; 
    }

    cartTotalEl.textContent = `€${cartTotal.toLocaleString()}`;

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
 * Checkout function exposed to the global window object
 * so it can be called from the HTML inline onclick handler.
 */
window.checkout = async function() {
    if (cartCount === 0) return alert("Your cart is empty.");
    
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
}

/**
 * TEMPORARY SEED FUNCTION
 * Uncomment the call to this function at the top of the file to populate your Firestore database.
 */
async function seedDatabase() {
    console.log("Seeding database...");
    const dummyProducts = [
        {
            title: "Minimalist Lounge Chair",
            subtitle: "Solid Oak & Linen",
            price: 850,
            categories: "seating living bedroom",
            image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80",
            desc: "A beautiful minimalist lounge chair crafted from solid oak and upholstered in premium organic linen. Perfect for reading corners or as an accent piece in any modern living space."
        },
        {
            title: "Marble Coffee Table",
            subtitle: "Carrara Marble",
            price: 1200,
            categories: "tables living",
            image: "https://images.unsplash.com/photo-1604074131665-7a4b13870ab4?auto=format&fit=crop&w=800&q=80",
            desc: "An elegant centerpiece featuring a solid slab of Italian Carrara marble resting on a sleek, matte-black powder-coated steel frame."
        },
        {
            title: "Ceramic Vase",
            subtitle: "Handcrafted Clay",
            price: 120,
            categories: "decor living dining bedroom",
            image: "https://images.unsplash.com/photo-1612152505975-641c25013ca0?auto=format&fit=crop&w=800&q=80",
            desc: "Hand-thrown by master ceramists, this textured vase brings an earthy, organic feel to any surface. Perfect for dried botanicals or standing elegantly on its own."
        },
        {
            title: "Oak Dining Table",
            subtitle: "Solid Oak",
            price: 2100,
            categories: "tables dining",
            image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80",
            desc: "Gather around this expansive solid oak dining table. Its minimalist silhouette highlights the natural grain and beauty of sustainably sourced timber."
        }
    ];

    try {
        for (const product of dummyProducts) {
            await addDoc(collection(db, "products"), product);
            console.log(`Added ${product.title}`);
        }
        console.log("Database successfully seeded! Please comment out the seedDatabase() function call.");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}
