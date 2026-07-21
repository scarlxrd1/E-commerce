import { app, db } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    let currentUser = null;
    let currentCaptcha = '';

    // DOM Elements
    const supportForm = document.getElementById('support-form');
    const guestFields = document.getElementById('guest-fields');
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const issueTypeInput = document.getElementById('issue-type');
    const messageInput = document.getElementById('message');
    const submitBtn = document.getElementById('submit-support-btn');

    // Captcha Elements
    const captchaCanvas = document.getElementById('captcha-canvas');
    const captchaInput = document.getElementById('captcha-input');
    const refreshCaptchaBtn = document.getElementById('refresh-captcha-btn');

    // 1. Captcha Generator Function (Clean UI, High Contrast, No Distortion)
    function generateCaptcha() {
        // Excluded ambiguous characters like 0, O, 1, I, l
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars[Math.floor(Math.random() * chars.length)];
        }
        currentCaptcha = captcha;
        captchaInput.value = '';

        if (captchaCanvas) {
            const ctx = captchaCanvas.getContext('2d');
            const width = captchaCanvas.width;
            const height = captchaCanvas.height;

            // Clean Background (Stone 100)
            ctx.fillStyle = '#F5F5F4'; 
            ctx.fillRect(0, 0, width, height);

            // Minimal, elegant noise (subtle dots instead of harsh lines)
            ctx.fillStyle = '#E7E5E4'; // Stone 200
            for (let i = 0; i < 40; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw highly readable text
            ctx.font = 'bold 22px monospace';
            ctx.fillStyle = '#1C1917'; // Stone 900 (High contrast)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Clear letter spacing and minimal rotation
            const startX = width / 2 - 60; // Center the 6 characters
            const spacing = 24;
            
            for (let i = 0; i < 6; i++) {
                ctx.save();
                ctx.translate(startX + (i * spacing), height / 2);
                
                // Very slight rotation (-5 to 5 degrees) for basic security without ruining readability
                const angle = (Math.random() - 0.5) * 0.1; 
                ctx.rotate(angle);
                
                ctx.fillText(captcha[i], 0, 0);
                ctx.restore();
            }
        }
    }

    // Initialize Captcha
    refreshCaptchaBtn.addEventListener('click', generateCaptcha);
    generateCaptcha();

    // 2. Listen to Auth State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            // Hide guest fields
            guestFields.classList.add('hidden');
            guestFields.classList.remove('flex');
            // Remove required attributes so form can submit
            nameInput.removeAttribute('required');
            emailInput.removeAttribute('required');
            phoneInput.removeAttribute('required');
        } else {
            currentUser = null;
            // Show guest fields
            guestFields.classList.remove('hidden');
            guestFields.classList.add('flex');
            // Add required attributes back
            nameInput.setAttribute('required', 'true');
            emailInput.setAttribute('required', 'true');
            phoneInput.setAttribute('required', 'true');
        }
    });

    // 3. Handle Form Submission
    supportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate Captcha First
        if (captchaInput.value.trim().toUpperCase() !== currentCaptcha.toUpperCase()) {
            alert("Security check failed. Please try again.");
            generateCaptcha();
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting Request...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

        try {
            let ticketPayload = {
                issueType: issueTypeInput.value,
                message: messageInput.value.trim(),
                timestamp: serverTimestamp()
            };

            if (currentUser) {
                // Fetch registered user details from Firestore
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'No Name Provided';
                    
                    ticketPayload = {
                        ...ticketPayload,
                        isRegistered: true,
                        userId: currentUser.uid,
                        senderName: fullName,
                        senderEmail: data.email || currentUser.email,
                        senderPhone: data.phone || 'N/A',
                        senderAddress: `${data.address || ''}, ${data.city || ''}, ${data.country || ''}`.replace(/^, | , $/g, '').trim() || 'N/A'
                    };
                } else {
                    // Fallback if user doc is missing
                    ticketPayload = {
                        ...ticketPayload,
                        isRegistered: true,
                        userId: currentUser.uid,
                        senderName: 'Registered User',
                        senderEmail: currentUser.email,
                        senderPhone: 'N/A',
                        senderAddress: 'N/A'
                    };
                }
            } else {
                // Use Guest Inputs
                ticketPayload = {
                    ...ticketPayload,
                    isRegistered: false,
                    senderName: nameInput.value.trim(),
                    senderEmail: emailInput.value.trim(),
                    senderPhone: phoneInput.value.trim(),
                    senderAddress: 'Guest (No Address)'
                };
            }

            // Save to Firestore 'support_tickets' collection
            await addDoc(collection(db, "support_tickets"), ticketPayload);

            alert("Your request has been successfully submitted. Our team will contact you shortly.");
            supportForm.reset();
            generateCaptcha(); // Refresh captcha on successful submission

        } catch (error) {
            console.error("Error submitting support ticket:", error);
            alert("An error occurred while submitting your request. Please try again.");
            generateCaptcha(); // Refresh captcha on error as a safety measure
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    });
});
