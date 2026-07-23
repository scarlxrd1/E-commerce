import { app, db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    const navSupport = document.getElementById('nav-support');
    
    const productsSection = document.getElementById('products-section');
    const customersSection = document.getElementById('customers-section');
    const supportSection = document.getElementById('support-section');
    
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

    // Support Elements
    const supportTableBody = document.getElementById('support-table-body');

    // Dynamic Images Elements
    const addImageBtn = document.getElementById('add-image-btn');
    const addImageInputsContainer = document.getElementById('add-image-inputs');
    const editAddImageBtn = document.getElementById('edit-add-image-btn');
    const editImageInputsContainer = document.getElementById('edit-image-inputs');

    // State Variables
    let productsList = [];

    // ==========================================
    // 1. AUTHENTICATION & SECURITY LOCK
    // ==========================================
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Fetch user document to check for 'admin' role
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                    // Authorized Admin
                    showDashboardView();
                    fetchProducts();
                    fetchCustomers();
                    fetchSupportTickets();
                } else {
                    // Unauthorized User
                    alert("Access Denied: Unauthorized account. You do not have admin privileges.");
                    await signOut(auth);
                    showLoginView();
                }
            } catch (error) {
                console.error("Error verifying admin role:", error);
                alert("Access Denied: Could not verify authorization.");
                await signOut(auth);
                showLoginView();
            }
        } else {
            // Logged out
            showLoginView();
        }
    });

    function showDashboardView() {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        dashboardView.classList.add('flex');
    }

    function showLoginView() {
        dashboardView.classList.add('hidden');
        dashboardView.classList.remove('flex');
        loginView.classList.remove('hidden');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'Authenticating...';
        loginBtn.disabled = true;

        try {
            // This triggers onAuthStateChanged which handles the role validation
            await signInWithEmailAndPassword(auth, loginEmailInput.value.trim(), loginPasswordInput.value);
            loginForm.reset();
        } catch (error) {
            console.error("Login error:", error);
            loginError.textContent = "Invalid admin credentials. Please try again.";
            loginError.classList.remove('hidden');
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
    function resetNavStyles() {
        [navProducts, navCustomers, navSupport].forEach(btn => {
            btn.classList.replace('text-stone-900', 'text-stone-400');
            btn.classList.replace('border-stone-900', 'border-transparent');
            btn.classList.remove('font-semibold');
        });
        
        [productsSection, customersSection, supportSection].forEach(sec => {
            sec.classList.add('hidden');
        });
    }

    navProducts.addEventListener('click', () => {
        resetNavStyles();
        navProducts.classList.replace('text-stone-400', 'text-stone-900');
        navProducts.classList.replace('border-transparent', 'border-stone-900');
        navProducts.classList.add('font-semibold');
        productsSection.classList.remove('hidden');
    });

    navCustomers.addEventListener('click', () => {
        resetNavStyles();
        navCustomers.classList.replace('text-stone-400', 'text-stone-900');
        navCustomers.classList.replace('border-transparent', 'border-stone-900');
        navCustomers.classList.add('font-semibold');
        customersSection.classList.remove('hidden');
    });

    navSupport.addEventListener('click', () => {
        resetNavStyles();
        navSupport.classList.replace('text-stone-400', 'text-stone-900');
        navSupport.classList.replace('border-transparent', 'border-stone-900');
        navSupport.classList.add('font-semibold');
        supportSection.classList.remove('hidden');
    });

    // ==========================================
    // 3. PRODUCTS CRUD OPERATIONS
    // ==========================================
    
    // Fetch and Render Products
    async function fetchProducts() {
        productsTableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-stone-400">Loading products...</td></tr>`;
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            productsList = [];
            querySnapshot.forEach((doc) => {
                productsList.push({ id: doc.id, ...doc.data() });
            });
            renderProductsTable();
        } catch (error) {
            console.error("Error fetching products:", error);
            productsTableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500">Failed to load products.</td></tr>`;
        }
    }

    function renderProductsTable() {
        if (productsList.length === 0) {
            productsTableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-stone-400">No products found.</td></tr>`;
            return;
        }

        productsTableBody.innerHTML = productsList.map(product => {
            // Badges
            const statusBadge = product.status === 'hidden'
                ? `<span class="px-2 py-1 bg-stone-200 text-stone-600 rounded text-[10px] uppercase font-bold tracking-wider">Hidden</span>`
                : `<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-[10px] uppercase font-bold tracking-wider">Active</span>`;
                
            const stockBadge = product.stock <= 0
                ? `<span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Out of Stock</span>`
                : `<span class="px-2 py-1 bg-stone-100 rounded text-xs">${product.stock} in stock</span>`;

            return `
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
                    <td class="p-4">${stockBadge}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-right space-x-3">
                        <button class="edit-product-btn text-stone-400 hover:text-stone-900 transition-colors underline underline-offset-4 text-xs tracking-widest uppercase" data-id="${product.id}">
                            Edit
                        </button>
                        <button class="delete-product-btn text-red-400 hover:text-red-700 transition-colors underline underline-offset-4 text-xs tracking-widest uppercase" data-id="${product.id}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Dynamic Image Inputs Logic
    addImageBtn.addEventListener('click', () => {
        const currentInputs = addImageInputsContainer.querySelectorAll('.add-image-input');
        if (currentInputs.length >= 10) {
            alert("Maximum of 10 images allowed.");
            return;
        }
        const inputHTML = `
            <div class="flex gap-2 items-center">
                <input type="url" required class="add-image-input w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-stone-900" placeholder="Additional Image URL">
                <button type="button" class="text-red-400 hover:text-red-700 font-bold text-xl remove-image-btn">&times;</button>
            </div>
        `;
        addImageInputsContainer.insertAdjacentHTML('beforeend', inputHTML);
    });

    addImageInputsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-image-btn')) {
            e.target.parentElement.remove();
        }
    });

    editAddImageBtn.addEventListener('click', () => {
        const currentInputs = editImageInputsContainer.querySelectorAll('.edit-image-input');
        if (currentInputs.length >= 10) {
            alert("Maximum of 10 images allowed.");
            return;
        }
        const inputHTML = `
            <div class="flex gap-2 items-center">
                <input type="url" required class="edit-image-input w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-stone-900" placeholder="Additional Image URL">
                <button type="button" class="text-red-400 hover:text-red-700 font-bold text-xl remove-image-btn">&times;</button>
            </div>
        `;
        editImageInputsContainer.insertAdjacentHTML('beforeend', inputHTML);
    });

    editImageInputsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-image-btn')) {
            e.target.parentElement.remove();
        }
    });

    // Toggle Add Product Form
    toggleAddProductBtn.addEventListener('click', () => {
        addProductContainer.classList.remove('hidden');
        toggleAddProductBtn.classList.add('hidden');
    });

    cancelAddBtn.addEventListener('click', () => {
        addProductContainer.classList.add('hidden');
        toggleAddProductBtn.classList.remove('hidden');
        addProductForm.reset();
        addImageInputsContainer.innerHTML = `
            <div class="flex gap-2 items-center">
                <input type="url" required class="add-image-input w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-stone-900" placeholder="Primary Image URL">
            </div>
        `;
    });

    // Add New Product
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-add-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        try {
            const inputs = Array.from(document.querySelectorAll('.add-image-input'));
            const images = inputs.map(input => input.value.trim()).filter(val => val !== '');
            const primaryImage = images[0] || '';
            const hoverImage = images[1] || primaryImage;
            
            const newProduct = {
                title: document.getElementById('add-title').value.trim(),
                price: parseFloat(document.getElementById('add-price').value),
                stock: parseInt(document.getElementById('add-stock').value),
                categories: document.getElementById('add-category').value,
                estimated_dispatch: document.getElementById('add-dispatch').value,
                status: document.getElementById('add-status').value,
                description: document.getElementById('add-description').value.trim(),
                image: primaryImage,
                hoverImage: hoverImage,
                images: images
            };

            await addDoc(collection(db, "products"), newProduct);
            
            cancelAddBtn.click(); // resets form and UI
            await fetchProducts(); // Refresh list
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Event Delegation for Edit & Delete Buttons
    productsTableBody.addEventListener('click', async (e) => {
        const productId = e.target.getAttribute('data-id');
        
        if (e.target.classList.contains('edit-product-btn')) {
            openEditModal(productId);
        } else if (e.target.classList.contains('delete-product-btn')) {
            if (confirm("Are you sure you want to delete this piece? This action cannot be undone.")) {
                try {
                    await deleteDoc(doc(db, "products", productId));
                    await fetchProducts(); // Refresh UI instantly
                } catch (error) {
                    console.error("Error deleting product:", error);
                    alert("Failed to delete the product. Please try again.");
                }
            }
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
        
        // Handle selects safely
        const categorySelect = document.getElementById('edit-category');
        if([...categorySelect.options].some(o => o.value === product.categories)) {
            categorySelect.value = product.categories;
        }
        
        const dispatchSelect = document.getElementById('edit-dispatch');
        if([...dispatchSelect.options].some(o => o.value === product.estimated_dispatch)) {
            dispatchSelect.value = product.estimated_dispatch;
        } else {
            dispatchSelect.value = "3-5 Business Days"; // Fallback if old data
        }

        const statusSelect = document.getElementById('edit-status');
        if([...statusSelect.options].some(o => o.value === product.status)) {
            statusSelect.value = product.status;
        } else {
            statusSelect.value = "active"; // Default fallback
        }

        document.getElementById('edit-description').value = product.description || product.desc || '';

        // Populate images
        editImageInputsContainer.innerHTML = '';
        let images = product.images || [];
        if (images.length === 0) {
            if (product.image) images.push(product.image);
            if (product.hoverImage && product.hoverImage !== product.image) images.push(product.hoverImage);
        }
        if (images.length === 0) images.push(''); // at least one empty input

        images.forEach((imgUrl, index) => {
            let removeBtn = index === 0 ? '' : `<button type="button" class="text-red-400 hover:text-red-700 font-bold text-xl remove-image-btn">&times;</button>`;
            const inputHTML = `
                <div class="flex gap-2 items-center">
                    <input type="url" required class="edit-image-input w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-stone-900" placeholder="${index === 0 ? 'Primary Image URL' : 'Additional Image URL'}" value="${imgUrl}">
                    ${removeBtn}
                </div>
            `;
            editImageInputsContainer.insertAdjacentHTML('beforeend', inputHTML);
        });

        // Show Modal
        editModal.classList.remove('hidden');
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
        editProductForm.reset();
        editImageInputsContainer.innerHTML = '';
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
            const inputs = Array.from(document.querySelectorAll('.edit-image-input'));
            const images = inputs.map(input => input.value.trim()).filter(val => val !== '');
            const primaryImage = images[0] || '';
            const hoverImage = images[1] || primaryImage;

            const productRef = doc(db, "products", id);
            await updateDoc(productRef, {
                title: document.getElementById('edit-title').value.trim(),
                price: parseFloat(document.getElementById('edit-price').value),
                stock: parseInt(document.getElementById('edit-stock').value),
                categories: document.getElementById('edit-category').value,
                estimated_dispatch: document.getElementById('edit-dispatch').value,
                status: document.getElementById('edit-status').value,
                description: document.getElementById('edit-description').value.trim(),
                image: primaryImage,
                hoverImage: hoverImage,
                images: images
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
    // 4. CUSTOMERS DIRECTORY
    // ==========================================
    async function fetchCustomers() {
        customersTableBody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-stone-400">Loading customers...</td></tr>`;
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push(doc.data());
            });

            if (users.length === 0) {
                customersTableBody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-stone-400">No registered customers found.</td></tr>`;
                return;
            }

            customersTableBody.innerHTML = users.map(user => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not provided';
                
                // Combine Address and Postal Code/Zip
                const postalCode = user.postalCode || user.zip || '';
                const fullAddress = `${user.address || ''}, ${postalCode}`.replace(/^, | , $/g, '').trim();
                const displayAddress = fullAddress && fullAddress !== ',' ? fullAddress : 'N/A';

                return `
                    <tr class="hover:bg-stone-50 transition-colors">
                        <td class="p-4 font-medium">${fullName}</td>
                        <td class="p-4 text-stone-500">${user.email || 'N/A'}</td>
                        <td class="p-4 text-stone-500">${user.phone || 'N/A'}</td>
                        <td class="p-4 text-stone-500">${displayAddress}</td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error("Error fetching customers:", error);
            customersTableBody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-500">Failed to load customers.</td></tr>`;
        }
    }

    // ==========================================
    // 5. SUPPORT TICKETS MANAGEMENT
    // ==========================================
    async function fetchSupportTickets() {
        supportTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-stone-400">Loading tickets...</td></tr>`;
        try {
            const querySnapshot = await getDocs(collection(db, "support_tickets"));
            let tickets = [];
            
            querySnapshot.forEach((doc) => {
                tickets.push({ id: doc.id, ...doc.data() });
            });

            // Sort by timestamp descending (newest first)
            tickets.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
                const timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
                return timeB - timeA;
            });

            if (tickets.length === 0) {
                supportTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-stone-400">No support tickets found.</td></tr>`;
                return;
            }

            supportTableBody.innerHTML = tickets.map(ticket => {
                const badgeHtml = ticket.isRegistered 
                    ? `<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-[10px] uppercase font-bold tracking-wider">Registered</span>`
                    : `<span class="px-2 py-1 bg-stone-200 text-stone-700 rounded text-[10px] uppercase font-bold tracking-wider">Guest</span>`;

                const dateObj = ticket.timestamp ? ticket.timestamp.toDate() : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                return `
                    <tr class="hover:bg-stone-50 transition-colors align-top">
                        <td class="p-4">
                            <div class="flex flex-col gap-1">
                                <span class="font-medium text-stone-900">${ticket.senderName || 'N/A'}</span>
                                <span class="text-stone-500 text-xs">${ticket.senderEmail || 'N/A'}</span>
                                <span class="text-stone-500 text-xs">${ticket.senderPhone || 'N/A'}</span>
                                <span class="text-stone-400 text-xs mt-1 max-w-[200px] truncate" title="${ticket.senderAddress || ''}">${ticket.senderAddress || 'N/A'}</span>
                            </div>
                        </td>
                        <td class="p-4">
                            <div class="flex flex-col gap-1">
                                <span class="text-stone-900 font-medium">${ticket.issueType || 'General Inquiry'}</span>
                                <span class="text-stone-400 text-xs">${dateStr}</span>
                            </div>
                        </td>
                        <td class="p-4">
                            <div class="text-stone-600 text-sm max-w-sm whitespace-pre-wrap">${ticket.message || 'No message provided.'}</div>
                        </td>
                        <td class="p-4">
                            ${badgeHtml}
                        </td>
                        <td class="p-4 text-right">
                            <button class="delete-ticket-btn text-red-400 hover:text-red-700 transition-colors underline underline-offset-4 text-xs tracking-widest uppercase" data-id="${ticket.id}">
                                Mark Resolved
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error("Error fetching support tickets:", error);
            supportTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to load support tickets.</td></tr>`;
        }
    }

    // Event Delegation for Delete/Resolve Ticket Button
    supportTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-ticket-btn')) {
            const ticketId = e.target.getAttribute('data-id');
            if (confirm("Are you sure you want to mark this ticket as resolved? This will permanently delete the record.")) {
                try {
                    await deleteDoc(doc(db, "support_tickets", ticketId));
                    await fetchSupportTickets(); // Refresh UI instantly
                } catch (error) {
                    console.error("Error deleting ticket:", error);
                    alert("Failed to resolve the ticket. Please try again.");
                }
            }
        }
    });
});
