import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { translations } from './translations.js';

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    let currentUser = null;
    let checkoutCart = [];

    // DOM Elements
    const autofillContainer = document.getElementById('autofill-container');
    const autofillToggle = document.getElementById('autofill-toggle');
    const errorContainer = document.getElementById('checkout-error');
    
    const fnInput = document.getElementById('checkout-fn');
    const lnInput = document.getElementById('checkout-ln');
    const emailInput = document.getElementById('checkout-email');
    const addressInput = document.getElementById('checkout-address');
    const cityInput = document.getElementById('checkout-city');
    const countryInput = document.getElementById('checkout-country');
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

    window.updateCheckoutCartQty = async function(index, change) {
        const item = checkoutCart[index];
        const newQty = item.quantity + change;
        
        if (newQty <= 0) {
            checkoutCart.splice(index, 1);
        } else if (newQty <= (item.stock || 0)) {
            item.quantity = newQty;
        }
        
        // Save
        if (currentUser) {
            try {
                const userRef = doc(db, "users", currentUser.uid);
                await updateDoc(userRef, { cart: checkoutCart });
            } catch (error) {
                console.error("Error updating cart quantity:", error);
            }
        } else {
            localStorage.setItem('aura_cart', JSON.stringify(checkoutCart));
        }
        
        renderCheckoutSummary(checkoutCart);
        
        // Sync with global cart state if available
        if (typeof window.syncGlobalCart === 'function') {
            window.syncGlobalCart(checkoutCart);
        }
    };

    function renderCheckoutSummary(cartItems) {
        const container = document.getElementById('checkout-items-container');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const totalEl = document.getElementById('checkout-total');
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        
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
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            submitBtn.textContent = 'Cart is empty';
            return;
        }

        let html = '';
        let total = 0;

        cartItems.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const disablePlus = item.quantity >= (item.stock || 0);
            
            html += `
                <div class="flex items-center gap-5">
                    <div class="relative flex-shrink-0">
                        <div class="w-16 h-20 bg-stone-100 rounded-sm overflow-hidden border border-stone-200">
                            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
                        </div>
                        <span class="absolute -top-2 -right-2 w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10 shadow-sm">${item.quantity}</span>
                    </div>
                    <div class="flex-1 flex justify-between items-center">
                        <div class="flex flex-col">
                            <h4 class="font-serif text-stone-900 text-sm md:text-base">${item.title}</h4>
                            <p class="font-sans text-stone-500 text-xs mt-1">€${item.price.toLocaleString()} each</p>
                            <div class="flex items-center gap-3 mt-2">
                                <button onclick="window.updateCheckoutCartQty(${index}, -1)" type="button" class="w-6 h-6 flex items-center justify-center border border-stone-300 text-stone-500 hover:text-stone-900 hover:border-stone-900 rounded-sm transition-colors">-</button>
                                <span class="font-sans text-sm text-stone-900 w-4 text-center">${item.quantity}</span>
                                <button onclick="window.updateCheckoutCartQty(${index}, 1)" type="button" class="w-6 h-6 flex items-center justify-center border border-stone-300 text-stone-500 hover:text-stone-900 hover:border-stone-900 rounded-sm transition-colors ${disablePlus ? 'opacity-50 cursor-not-allowed' : ''}" ${disablePlus ? 'disabled' : ''}>+</button>
                            </div>
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
        
        // Enable form if items exist
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        const currentLang = localStorage.getItem('aura_lang') || 'el';
        submitBtn.textContent = translations[currentLang]?.checkout?.complete_order || translations['en'].checkout.complete_order;
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
                    cityInput.value = data.city || '';
                    countryInput.value = data.country || '';
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
            cityInput.value = '';
            countryInput.value = '';
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

    // Helper: Display Error
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Helper: Hide Error
    function hideError() {
        errorContainer.textContent = '';
        errorContainer.classList.add('hidden');
    }

    // 5. Form Submission & Validation
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();

        // Strict Validations
        const nameRegex = /^[a-zA-Zα-ωΑ-ΩάέήίόύώΆΈΉΊΌΎΏ\s]+$/;
        const phoneRegex = /^\+?\d+$/;

        if (!nameRegex.test(fnInput.value.trim())) {
            showError("First name can only contain letters.");
            return;
        }
        if (!nameRegex.test(lnInput.value.trim())) {
            showError("Last name can only contain letters.");
            return;
        }
        if (!phoneRegex.test(phoneInput.value.trim())) {
            showError("Phone number can only contain numbers and an optional leading '+'.");
            return;
        }

        // Proceed with simulated checkout
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
