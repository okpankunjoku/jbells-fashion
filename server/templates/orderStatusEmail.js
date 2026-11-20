
const escapeHtml = (value = "") => {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
};

const statusMessages = {
  pending: {
    title: "Order Received",
    message: "We have received your order and it is awaiting confirmation.",
  },
  confirmed: {
    title: "Order Confirmed",
    message: "Your order has been confirmed and is being prepared.",
  },
  processing: {
    title: "Order Processing",
    message: "Your order is currently being prepared for shipment.",
  },
  shipped: {
    title: "Order Shipped",
    message: "Your order has been shipped and is on its way to you.",
  },
  delivered: {
    title: "Order Delivered",
    message: "Your order has been marked as delivered. We hope you enjoy your purchase.",
  },
  cancelled: {
    title: "Order Cancelled",
    message: "Your order has been cancelled. Please contact our support team if you need assistance.",
  },
};

const orderStatusEmail = (order, customer) => {
  const status = String(order.orderStatus || "").toLowerCase();
  const statusInfo = statusMessages[status];

  if (!statusInfo) {
    throw new Error("Invalid order status for email notification.");
  }

  const safeName = escapeHtml(customer?.firstName || "Customer");
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeStatus = escapeHtml(statusInfo.title);
  const safeMessage = escapeHtml(statusInfo.message);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeStatus}</title>
      </head>

      <body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 10px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="max-width:600px; width:100%; background:#ffffff; border-radius:8px;">

                <tr>
                  <td align="center" style="background:#111827; padding:35px 20px;">
                    <h1 style="margin:0; color:#ffffff; font-size:25px;">
                      Fashion E-Commerce
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:35px 30px; color:#333333;">
                    <h2 style="color:#111827;">${safeStatus}</h2>

                    <p style="font-size:16px; line-height:1.7;">
                      Hello ${safeName},
                    </p>

                    <p style="font-size:16px; line-height:1.7;">
                      ${safeMessage}
                    </p>

                    <p style="background:#f9fafb; padding:15px; line-height:1.7;">
                      <strong>Order Number:</strong> ${safeOrderNumber}<br />
                      <strong>Current Status:</strong> ${safeStatus}
                    </p>

                    <p style="font-size:16px; line-height:1.7;">
                      Thank you for shopping with us.
                    </p>

                    <p style="font-size:16px; line-height:1.7;">
                      Best regards,<br />
                      <strong>Fashion E-Commerce Team</strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center"
                    style="background:#f9fafb; padding:20px; color:#777777; font-size:12px;">
                    &copy; ${new Date().getFullYear()} Fashion E-Commerce.
                    All rights reserved.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const textContent = `
${statusInfo.title}

Hello ${customer?.firstName || "Customer"},

${statusInfo.message}

Order Number: ${order.orderNumber}
Current Status: ${statusInfo.title}

Thank you for shopping with us.

Best regards,
Fashion E-Commerce Team
  `;

  return {
    subject: `${statusInfo.title} - Order ${order.orderNumber}`,
    htmlContent,
    textContent,
  };
};

module.exports = orderStatusEmail;
