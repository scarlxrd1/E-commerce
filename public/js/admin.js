import { app, db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    
    // UI Views
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    // Login Elements
    const loginForm = document.getElementById('admin-login-form');
    const loginEmailInput = document.getElementById('admin-email');
    const loginPasswordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-submit-btn');
    
    // Navigation & Layout Elements
    const navProducts = document.getElementById('nav-products');
    const navCustomers = document.getElementById('nav-customers');
    const productsSection = document.getElementById('products-section');
    const customersSection = document.getElementById('customers-section');
    const logoutBtn = document.getElementById('logout-btn');

    // Products Elements
    const productsTableBody = document.getElementById('products-table-body');
    const toggleAddProductBtn = document.getElementById('toggle-add-product-btn');
    const addProductContainer = document.getElementById('add-product-container');
    const addProductForm = document.getElementById('add-product-form');
    const cancelAddBtn = document.getElementById('cancel-add-btn');

    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const editModalBackdrop = document.getElementById('edit-modal-backdrop');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const editProductForm = document.getElementById('edit-product-form');
    
    // Customers Elements
    const customersTableBody = document.getElementById('customers-table-body');

    // State Variables
    let productsList = [];

    // ==========================================
    // 1. AUTHENTICATION & ROUTE PROTECTION
    // ==========================================
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Logged in: Show Dashboard
            loginView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            dashboardView.classList.add('flex'); // Apply flex layout
            
            // Load Data
            fetchProducts();
            fetchCustomers();
        } else {
            // Logged out: Show Login
            dashboardView.classList.add('hidden');
            dashboardView.classList.remove('flex');
            loginView.classList.remove('hidden');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'Authenticating...';
        loginBtn.disabled = true;

        try {
            await signInWithEmailAndPassword(auth, loginEmailInput.value.trim(), loginPasswordInput.value);
            loginForm.reset();
        } catch (error) {
            console.error("Login error:", error);
            loginError.textContent = "Invalid admin credentials. Please try again.";
            loginError.classList.remove('hidden');
        } finally {
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
    });

    // ==========================================
    // 2. DASHBOARD NAVIGATION
    // ==========================================
    navProducts.addEventListener('click', () => {
        // Update Nav Styles
        navProducts.classList.replace('text-stone-400', 'text-stone-900');
        navProducts.classList.replace('border-transparent', 'border-stone-900');
        navProducts.classList.add('font-semibold');
        
        navCustomers.classList.replace('text-stone-900', 'text-stone-400');
        navCustomers.classList.replace('border-stone-900', 'border-transparent');
        navCustomers.classList.remove('font-semibold');

        // Toggle Sections
        productsSection.classList.remove('hidden');
        customersSection.classList.add('hidden');
    });

    navCustomers.addEventListener('click', () => {
        // Update Nav Styles
        navCustomers.classList.replace('text-stone-400', 'text-stone-900');
        navCustomers.classList.replace('border-transparent', 'border-stone-900');
        navCustomers.classList.add('font-semibold');
        
        navProducts.classList.replace('text-stone-900', 'text-stone-400');
        navProducts.classList.replace('border-stone-900', 'border-transparent');
        navProducts.classList.remove('font-semibold');

        // Toggle Sections
        customersSection.classList.remove('hidden');
        productsSection.classList.add('hidden');
    });

    // ==========================================
    // 3. PRODUCTS CRUD OPERATIONS
    // ==========================================
    
    // Fetch and Render Products
    async function fetchProducts() {
        productsTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-stone-400">Loading products...</td></tr>`;
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            productsList = [];
            querySnapshot.forEach((doc) => {
                productsList.push({ id: doc.id, ...doc.data() });
            });
            renderProductsTable();
        } catch (error) {
            console.error("Error fetching products:", error);
            productsTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to load products.</td></tr>`;
        }
    }

    function renderProductsTable() {
        if (productsList.length === 0) {
            productsTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-stone-400">No products found.</td></tr>`;
            return;
        }

        productsTableBody.innerHTML = productsList.map(product => `
            <tr class="hover:bg-stone-50 transition-colors">
                <td class="p-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-stone-100 rounded-sm overflow-hidden flex-shrink-0">
                            <img src="${product.image || ''}" alt="${product.title}" class="w-full h-full object-cover">
                        </div>
                        <span class="font-serif font-medium">${product.title}</span>
                    </div>
                </td>
                <td class="p-4 capitalize text-stone-500">${product.categories || 'N/A'}</td>
                <td class="p-4">€${(product.price || 0).toLocaleString()}</td>
                <td class="p-4">
                    <span class="px-2 py-1 bg-stone-100 rounded text-xs">${product.stock || 0} in stock</span>
                </td>
                <td class="p-4 text-right">
                    <button class="edit-product-btn text-stone-400 hover:text-stone-900 transition-colors underline underline-offset-4 text-xs tracking-widest uppercase" data-id="${product.id}">
                        Edit
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Toggle Add Product Form
    toggleAddProductBtn.addEventListener('click', () => {
        addProductContainer.classList.remove('hidden');
        toggleAddProductBtn.classList.add('hidden');
    });

    cancelAddBtn.addEventListener('click', () => {
        addProductContainer.classList.add('hidden');
        toggleAddProductBtn.classList.remove('hidden');
        addProductForm.reset();
    });

    // Add New Product
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-add-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        try {
            const newProduct = {
                title: document.getElementById('add-title').value.trim(),
                price: parseFloat(document.getElementById('add-price').value),
                stock: parseInt(document.getElementById('add-stock').value),
                categories: document.getElementById('add-category').value.trim().toLowerCase(),
                image: document.getElementById('add-image').value.trim()
            };

            await addDoc(collection(db, "products"), newProduct);
            
            addProductForm.reset();
            cancelAddBtn.click();
            await fetchProducts(); // Refresh list
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Event Delegation for Edit Buttons
    productsTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-product-btn')) {
            const productId = e.target.getAttribute('data-id');
            openEditModal(productId);
        }
    });

    function openEditModal(id) {
        const product = productsList.find(p => p.id === id);
        if (!product) return;

        // Populate Modal
        document.getElementById('edit-id').value = product.id;
        document.getElementById('edit-title').value = product.title;
        document.getElementById('edit-price').value = product.price || 0;
        document.getElementById('edit-stock').value = product.stock || 0;
        document.getElementById('edit-image').value = product.image || '';

        // Show Modal
        editModal.classList.remove('hidden');
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
        editProductForm.reset();
    }

    closeModalBtn.addEventListener('click', closeEditModal);
    editModalBackdrop.addEventListener('click', closeEditModal);

    // Save Edited Product
    editProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-modal-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const id = document.getElementById('edit-id').value;
        try {
            const productRef = doc(db, "products", id);
            await updateDoc(productRef, {
                title: document.getElementById('edit-title').value.trim(),
                price: parseFloat(document.getElementById('edit-price').value),
                stock: parseInt(document.getElementById('edit-stock').value),
                image: document.getElementById('edit-image').value.trim()
            });

            closeEditModal();
            await fetchProducts(); // Refresh list
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Failed to update product.");
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    });

    // ==========================================
    // 4. CUSTOMERS DIRECTORY (READ ONLY)
    // ==========================================
    async function fetchCustomers() {
        customersTableBody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-stone-400">Loading customers...</td></tr>`;
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push(doc.data());
            });

            if (users.length === 0) {
                customersTableBody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-stone-400">No registered customers found.</td></tr>`;
                return;
            }

            customersTableBody.innerHTML = users.map(user => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not provided';
                return `
                    <tr class="hover:bg-stone-50 transition-colors">
                        <td class="p-4 font-medium">${fullName}</td>
                        <td class="p-4 text-stone-500">${user.email}</td>
                        <td class="p-4 text-stone-500">${user.phone || 'N/A'}</td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error("Error fetching customers:", error);
            customersTableBody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-red-500">Failed to load customers.</td></tr>`;
        }
    }
});
