import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    let currentUser = null;

    // DOM Elements
    const autofillContainer = document.getElementById('autofill-container');
    const autofillToggle = document.getElementById('autofill-toggle');
    
    const fnInput = document.getElementById('checkout-fn');
    const lnInput = document.getElementById('checkout-ln');
    const emailInput = document.getElementById('checkout-email');
    const addressInput = document.getElementById('checkout-address');
    const zipInput = document.getElementById('checkout-zip');
    const phoneInput = document.getElementById('checkout-phone');
    
    const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
    const ccDetails = document.getElementById('cc-details');
    const checkoutForm = document.getElementById('checkout-form');

    // 1. Auth State & Cart Loading
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            // Show Autofill option for logged-in users
            autofillContainer.classList.remove('hidden');
            autofillContainer.classList.add('flex');
            
            // Fetch authoritative cart from Firestore
            await loadCheckoutCart(user);
        } else {
            currentUser = null;
            // Hide Autofill option for guests
            autofillContainer.classList.add('hidden');
            autofillContainer.classList.remove('flex');
            
            // Fetch cart from LocalStorage
            await loadCheckoutCart(null);
        }
    });

    // 2. Fetch & Render Cart Summary
    async function loadCheckoutCart(user) {
        let checkoutCart = [];
        
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    checkoutCart = userDoc.data().cart || [];
                }
            } catch (error) {
                console.error("Error fetching user cart for checkout:", error);
            }
        } else {
            checkoutCart = JSON.parse(localStorage.getItem('aura_cart')) || [];
        }

        renderCheckoutSummary(checkoutCart);
    }

    function renderCheckoutSummary(cartItems) {
        const container = document.getElementById('checkout-items-container');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const totalEl = document.getElementById('checkout-total');
        
        if (cartItems.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-stone-500 font-sans text-sm mb-4">Your cart is currently empty.</p>
                    <a href="collection.html" class="font-sans text-xs tracking-widest uppercase border-b border-stone-900 text-stone-900 pb-1 hover:text-stone-600 transition-colors">Return to Shop</a>
                </div>
            `;
            subtotalEl.textContent = '€0';
            totalEl.textContent = '€0';
            
            // Disable form if cart is empty
            const submitBtn = checkoutForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            submitBtn.textContent = 'Cart is empty';
            return;
        }

        let html = '';
        let total = 0;

        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            html += `
                <div class="flex items-center gap-5">
                    <div class="relative flex-shrink-0">
                        <div class="w-16 h-20 bg-stone-100 rounded-sm overflow-hidden border border-stone-200">
                            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
                        </div>
                        <span class="absolute -top-2 -right-2 bg-stone-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">${item.quantity}</span>
                    </div>
                    <div class="flex-1 flex justify-between items-center">
                        <div class="flex flex-col">
                            <h4 class="font-serif text-stone-900 text-sm md:text-base">${item.title}</h4>
                            <p class="font-sans text-stone-500 text-xs mt-1">€${item.price.toLocaleString()} each</p>
                        </div>
                        <div class="font-sans text-stone-900 text-sm font-medium">
                            €${itemTotal.toLocaleString()}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        subtotalEl.textContent = `€${total.toLocaleString()}`;
        totalEl.textContent = `€${total.toLocaleString()}`;
    }

    // 3. Autofill Logic
    autofillToggle.addEventListener('change', async (e) => {
        if (e.target.checked && currentUser) {
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    fnInput.value = data.firstName || '';
                    lnInput.value = data.lastName || '';
                    emailInput.value = data.email || currentUser.email || '';
                    phoneInput.value = data.phone || '';
                    addressInput.value = data.address || '';
                    zipInput.value = data.postalCode || data.zip || '';
                }
            } catch (error) {
                console.error("Error fetching user data for autofill:", error);
            }
        } else {
            // Unchecked: Clear fields
            fnInput.value = '';
            lnInput.value = '';
            emailInput.value = '';
            phoneInput.value = '';
            addressInput.value = '';
            zipInput.value = '';
        }
    });

    // 4. Payment Method UI Toggle
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'credit-card') {
                ccDetails.classList.remove('hidden');
            } else {
                ccDetails.classList.add('hidden');
            }
        });
    });

    // 5. Form Submission Placeholder
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Processing Securely...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

        // Simulate API Processing Delay
        setTimeout(() => {
            alert("This is a frontend demo. Backend integration (e.g., Stripe) is required to process real payments.");
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }, 1500);
    });
});
