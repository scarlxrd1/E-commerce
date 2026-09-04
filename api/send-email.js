/**
 * AURA Transactional Email Dispatcher (Resend API)
 * --------------------------------------------------------------------------
 * Handles server-side transactional email delivery for:
 *   - 'welcome': Welcome email sent upon account registration
 *   - 'order_confirmation': Detailed purchase receipt and order summary
 *
 * Utilizes the Resend REST API via native fetch and process.env.RESEND_API_KEY.
 * Sender: "AURA Orders" <orders@sqysystemsdev.org>
 * Reply-To: info@sqysystemsdev.org
 */

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildWelcomeTemplate(name) {
    const safeName = escapeHTML(name || 'Valued Customer');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AURA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1C1917;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FAFAFA; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 44px 32px 32px 32px; border-bottom: 1px solid #F5F5F4;">
              <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; letter-spacing: 0.18em; color: #1C1917; font-weight: 600; display: block;">AURA.</span>
              <span style="font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #78716C; margin-top: 8px; display: block;">Mindful Living &bull; Curated Spaces</span>
            </td>
          </tr>

          <!-- Editorial Greeting -->
          <tr>
            <td style="padding: 40px 40px 24px 40px;">
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 400; line-height: 1.3; color: #1C1917; margin: 0 0 18px 0;">
                Welcome, ${safeName}.
              </h1>
              <p style="font-size: 14px; line-height: 1.8; color: #57534E; margin: 0 0 24px 0;">
                Your account has been successfully created. At AURA, we believe a sanctuary should hold its silence. Each piece in our collection is stripped back to natural materials, honest proportions, and enduring craft.
              </p>
            </td>
          </tr>

          <!-- Brand Values Strip -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #F5F5F4; border-bottom: 1px solid #F5F5F4; padding: 24px 0;">
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #1C1917; margin-bottom: 4px;">FSC-Certified Timbers</strong>
                    <span style="font-size: 13px; color: #78716C; line-height: 1.6;">Responsibly harvested solid hardwoods with non-toxic, low-VOC organic finishes.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 8px 0;">
                    <strong style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #1C1917; margin-bottom: 4px;">Artisan Batches</strong>
                    <span style="font-size: 13px; color: #78716C; line-height: 1.6;">Finished by hand in small studios, built with heirloom integrity to outlast generations.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0 0;">
                    <strong style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #1C1917; margin-bottom: 4px;">White-Glove Care</strong>
                    <span style="font-size: 13px; color: #78716C; line-height: 1.6;">Complimentary shipping on decor, with dedicated assembly for large architectural furniture.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Signoff & Footer -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="font-size: 13px; line-height: 1.8; color: #78716C; margin: 0 0 24px 0;">
                Warm regards,<br>
                <strong style="color: #1C1917; font-weight: 500;">The AURA Design Studio</strong>
              </p>
              <div style="border-top: 1px solid #F5F5F4; padding-top: 24px; font-size: 11px; color: #A8A29E; line-height: 1.6; text-align: center;">
                &copy; ${new Date().getFullYear()} AURA Interior Design. All rights reserved.<br>
                If you did not register for this account, please contact <a href="mailto:info@sqysystemsdev.org" style="color: #78716C; text-decoration: underline;">info@sqysystemsdev.org</a>.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOrderConfirmationTemplate(orderData) {
    const customer = orderData.customer || {};
    const safeCustomerName = escapeHTML(`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Customer');
    const orderId = escapeHTML(orderData.orderId || 'N/A');
    const shortOrderId = escapeHTML(orderData.orderId ? orderData.orderId.slice(0, 8).toUpperCase() : 'N/A');

    const paymentMethodLabel = orderData.paymentMethod === 'cod'
        ? 'Cash on Delivery (Αντικαταβολή)'
        : 'Credit / Debit Card (Viva Wallet)';

    const addressParts = [customer.address, customer.city, customer.zip, customer.country].filter(Boolean);
    const safeAddress = escapeHTML(addressParts.join(', ') || 'N/A');
    const safePhone = escapeHTML(customer.phone || 'N/A');

    let calculatedSubtotal = 0;
    let itemsRows = '';

    if (Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
            const price = Number(item.price || 0);
            const qty = Number(item.quantity || 1);
            const lineTotal = price * qty;
            calculatedSubtotal += lineTotal;

            const safeTitle = escapeHTML(item.title || 'Curated Piece');
            const safeSku = item.sku ? `<div style="font-family: monospace; font-size: 11px; color: #78716C; margin-top: 2px;">SKU: ${escapeHTML(item.sku)}</div>` : '';
            const safeImage = escapeHTML(item.image || 'https://via.placeholder.com/64');

            itemsRows += `
            <tr>
              <td style="padding: 16px 0; border-bottom: 1px solid #F5F5F4; vertical-align: middle; width: 64px;">
                <img src="${safeImage}" alt="${safeTitle}" width="60" height="60" style="width: 60px; height: 60px; object-fit: cover; border-radius: 3px; border: 1px solid #E7E5E4; display: block;" />
              </td>
              <td style="padding: 16px 14px; border-bottom: 1px solid #F5F5F4; vertical-align: middle;">
                <div style="font-weight: 600; font-size: 14px; color: #1C1917; line-height: 1.3;">${safeTitle}</div>
                ${safeSku}
                <div style="font-size: 12px; color: #78716C; margin-top: 4px;">Qty: ${qty} &times; €${price.toFixed(2)}</div>
              </td>
              <td align="right" style="padding: 16px 0; border-bottom: 1px solid #F5F5F4; vertical-align: middle; font-weight: 600; font-size: 14px; color: #1C1917; white-space: nowrap;">
                €${lineTotal.toFixed(2)}
              </td>
            </tr>`;
        });
    }

    const codFee = orderData.paymentMethod === 'cod' ? (Number(orderData.codFee) || 2.50) : 0;
    const totalAmount = Number(orderData.totalAmount || (calculatedSubtotal + codFee));
    const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (totalAmount - codFee);

    let invoiceHtml = '';
    if (orderData.invoice && orderData.invoice.isRequired) {
        invoiceHtml = `
        <tr>
          <td style="padding: 0 40px 24px 40px;">
            <div style="padding: 16px; background-color: #FAFAFA; border: 1px solid #E7E5E4; border-radius: 4px; font-size: 12px; line-height: 1.6; color: #57534E;">
              <div style="font-weight: 600; color: #1C1917; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; margin-bottom: 6px;">Invoice Details (Στοιχεία Τιμολογίου)</div>
              <div><strong>Company:</strong> ${escapeHTML(orderData.invoice.companyName)}</div>
              <div><strong>VAT / ΑΦΜ:</strong> ${escapeHTML(orderData.invoice.vat)} &nbsp;|&nbsp; <strong>Tax Office / ΔΟΥ:</strong> ${escapeHTML(orderData.invoice.taxOffice)}</div>
              <div><strong>Activity / Επάγγελμα:</strong> ${escapeHTML(orderData.invoice.activity)}</div>
            </div>
          </td>
        </tr>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${shortOrderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1C1917;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FAFAFA; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 44px 32px 30px 32px; border-bottom: 1px solid #F5F5F4;">
              <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; letter-spacing: 0.18em; color: #1C1917; font-weight: 600; display: block;">AURA.</span>
              <span style="font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #16A34A; margin-top: 8px; font-weight: 600; display: inline-block;">&bull; Order Confirmed &bull;</span>
            </td>
          </tr>

          <!-- Greeting & Intro -->
          <tr>
            <td style="padding: 36px 40px 24px 40px;">
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 400; line-height: 1.3; color: #1C1917; margin: 0 0 14px 0;">
                Thank you for your order, ${safeCustomerName}.
              </h1>
              <p style="font-size: 14px; line-height: 1.8; color: #57534E; margin: 0;">
                We have received your order <strong>#${shortOrderId}</strong>. Our workshop is preparing your pieces with deliberate care. We will notify you with full courier tracking the moment your shipment departs.
              </p>
            </td>
          </tr>

          <!-- Order Summary Metadata Box -->
          <tr>
            <td style="padding: 0 40px 28px 40px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FAFAFA; border: 1px solid #E7E5E4; border-radius: 4px; padding: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #78716C; padding-bottom: 6px; width: 40%;">Order Identifier:</td>
                  <td style="font-size: 12px; color: #1C1917; font-family: monospace; font-weight: 600; padding-bottom: 6px;">${orderId}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #78716C; padding-bottom: 6px;">Payment Method:</td>
                  <td style="font-size: 12px; color: #1C1917; font-weight: 500; padding-bottom: 6px;">${paymentMethodLabel}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #78716C; padding-bottom: 6px;">Shipping Address:</td>
                  <td style="font-size: 12px; color: #1C1917; line-height: 1.5; padding-bottom: 6px;">${safeAddress}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #78716C;">Contact Phone:</td>
                  <td style="font-size: 12px; color: #1C1917;">${safePhone}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Optional B2B Invoice Block -->
          ${invoiceHtml}

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid #E7E5E4;">
                    <th align="left" colspan="2" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #78716C; padding-bottom: 12px; font-weight: 600;">Items Ordered</th>
                    <th align="right" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #78716C; padding-bottom: 12px; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown -->
          <tr>
            <td style="padding: 24px 40px 36px 40px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #57534E;">
                <tr>
                  <td style="padding: 4px 0;">Subtotal</td>
                  <td align="right" style="padding: 4px 0; color: #1C1917; font-weight: 500;">€${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Shipping</td>
                  <td align="right" style="padding: 4px 0; color: #16A34A; font-weight: 500;">Complimentary</td>
                </tr>
                ${codFee > 0 ? `
                <tr>
                  <td style="padding: 4px 0;">COD Service Fee</td>
                  <td align="right" style="padding: 4px 0; color: #1C1917; font-weight: 500;">€${codFee.toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 16px 0 0 0; border-top: 1px solid #E7E5E4; font-size: 16px; font-weight: 600; color: #1C1917;">Total Amount</td>
                  <td align="right" style="padding: 16px 0 0 0; border-top: 1px solid #E7E5E4; font-size: 20px; font-family: 'Playfair Display', Georgia, serif; font-weight: 600; color: #1C1917;">€${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Service Note & Footer -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background-color: #FAFAFA; border: 1px solid #F5F5F4; border-radius: 4px; padding: 20px; font-size: 13px; color: #78716C; line-height: 1.7; text-align: center; margin-bottom: 28px;">
                Have questions regarding your delivery or assembly? Simply reply directly to this confirmation email or contact our concierges at <a href="mailto:info@sqysystemsdev.org" style="color: #1C1917; font-weight: 500; text-decoration: underline;">info@sqysystemsdev.org</a>.
              </div>
              <div style="border-top: 1px solid #F5F5F4; padding-top: 24px; font-size: 11px; color: #A8A29E; line-height: 1.6; text-align: center;">
                &copy; ${new Date().getFullYear()} AURA Interior Design. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('[send-email] RESEND_API_KEY is not configured in server environment.');
            return res.status(500).json({ error: 'Server email misconfiguration. Please contact support.' });
        }

        const { type, email, name, orderData } = req.body || {};

        let recipientEmail = '';
        let subject = '';
        let htmlContent = '';

        if (type === 'welcome') {
            if (!email || typeof email !== 'string' || !email.includes('@')) {
                return res.status(400).json({ error: 'A valid email address is required for welcome notifications.' });
            }
            recipientEmail = email.trim();
            subject = 'Welcome to AURA | Elevate Your Space';
            htmlContent = buildWelcomeTemplate(name);

        } else if (type === 'order_confirmation') {
            if (!orderData || typeof orderData !== 'object') {
                return res.status(400).json({ error: 'Missing or invalid order data.' });
            }

            recipientEmail = (orderData.customer && orderData.customer.email) ? String(orderData.customer.email).trim() : '';
            if (!recipientEmail || !recipientEmail.includes('@')) {
                return res.status(400).json({ error: 'Valid customer email is required in orderData.' });
            }

            const shortId = orderData.orderId ? String(orderData.orderId).slice(0, 8).toUpperCase() : 'ORDER';
            subject = `Order Confirmation #${shortId} | AURA`;
            htmlContent = buildOrderConfirmationTemplate(orderData);

        } else {
            return res.status(400).json({ error: 'Invalid or unsupported email type.' });
        }

        const resendPayload = {
            from: 'AURA Orders <orders@sqysystemsdev.org>',
            reply_to: 'info@sqysystemsdev.org',
            to: [recipientEmail],
            subject: subject,
            html: htmlContent
        };

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resendPayload)
        });

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('[send-email] Resend API rejected request:', resendData);
            return res.status(resendResponse.status || 500).json({
                error: resendData.message || 'Failed to dispatch email via Resend.'
            });
        }

        return res.status(200).json({ success: true, id: resendData.id });

    } catch (error) {
        console.error('[send-email] Unexpected error during email dispatch:', error);
        return res.status(500).json({ error: 'An unexpected internal server error occurred.' });
    }
}
