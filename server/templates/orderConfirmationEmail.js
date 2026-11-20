
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

const formatCurrency = (amount) => {
  return `NGN ${Number(amount || 0).toLocaleString("en-NG")}`;
};

const orderConfirmationEmail = (order, customer) => {
  const customerName = customer?.firstName || "Customer";
  const safeName = escapeHtml(customerName);
  const safeOrderNumber = escapeHtml(order.orderNumber);

  const address = order.shippingAddress || {};

  const safeAddress = escapeHtml(
    [
      address.address,
      address.city,
      address.state,
      address.postalCode,
      address.country || "Nigeria",
    ]
      .filter(Boolean)
      .join(", ")
  );

  const safeFullName = escapeHtml(address.fullName || customerName);
  const safePhone = escapeHtml(address.phone || "Not provided");
  const safeEmail = escapeHtml(address.email || "");

  const items = (order.items || []).map((item) => {
    const name = escapeHtml(item.productName || "Product");
    const sku = escapeHtml(item.variantSku || "N/A");
    const size = escapeHtml(item.size || "N/A");
    const color = escapeHtml(item.color || "N/A");

    const quantity = Number(item.quantity || 0);
    const price = Number(item.unitPrice || 0);
    const subtotal = Number(
      item.subtotal || quantity * price
    );

    return {
      name,
      sku,
      size,
      color,
      quantity,
      price,
      subtotal,
    };
  });

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 8px; border-bottom:1px solid #eeeeee; color:#333333;">
            <strong>${item.name}</strong><br />
            <span style="font-size:12px; color:#777777;">
              SKU: ${item.sku}<br />
              Size: ${item.size}<br />
              Colour: ${item.color}
            </span>
          </td>

          <td style="padding:14px 8px; border-bottom:1px solid #eeeeee; text-align:center; color:#333333;">
            ${item.quantity}
          </td>

          <td style="padding:14px 8px; border-bottom:1px solid #eeeeee; text-align:right; color:#333333;">
            ${formatCurrency(item.price)}
          </td>

          <td style="padding:14px 8px; border-bottom:1px solid #eeeeee; text-align:right; color:#333333;">
            <strong>${formatCurrency(item.subtotal)}</strong>
          </td>
        </tr>
      `
    )
    .join("");

  const subtotal = Number(order.subtotal || 0);
  const shippingFee = Number(order.shippingFee || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.totalAmount || 0);

  const paymentMethod = "Pay on Delivery";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>JBELLS Order Confirmation</title>
      </head>

      <body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial,Helvetica,sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0"
          style="padding:30px 10px; background:#f3f4f6;">

          <tr>
            <td align="center">

              <table width="600" cellpadding="0" cellspacing="0"
                style="max-width:600px; width:100%; background:#ffffff; border-radius:8px; overflow:hidden;">

                <!-- HEADER -->

                <tr>
                  <td align="center"
                    style="background:#101d35; padding:35px 20px; border-bottom:4px solid #c9a44c;">

                    <h1 style="margin:0; color:#ffffff; font-size:30px; letter-spacing:3px;">
                      JBELLS
                    </h1>

                    <p style="margin:8px 0 0; color:#d6b86a; font-size:12px; letter-spacing:2px;">
                      FASHION &amp; STYLE
                    </p>

                  </td>
                </tr>

                <!-- MAIN CONTENT -->

                <tr>
                  <td style="padding:30px; color:#333333;">

                    <h2 style="margin-top:0; color:#101d35; font-size:24px;">
                      Thank You for Your Order!
                    </h2>

                    <p style="font-size:15px; line-height:1.8;">
                      Hello <strong>${safeName}</strong>,
                    </p>

                    <p style="font-size:15px; line-height:1.8;">
                      Thank you for shopping with JBELLS. We are pleased to confirm that your order has been received successfully.
                      Our team will process your order and keep you updated as it progresses.
                    </p>

                    <!-- ORDER NUMBER -->

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="margin:22px 0; background:#f8f6f0; border-left:4px solid #c9a44c;">

                      <tr>
                        <td style="padding:18px;">

                          <p style="margin:0 0 7px; color:#777777; font-size:12px;">
                            YOUR ORDER NUMBER
                          </p>

                          <h3 style="margin:0; color:#101d35; font-size:20px;">
                            ${safeOrderNumber}
                          </h3>

                        </td>
                      </tr>

                    </table>

                    <!-- ORDER ITEMS -->

                    <h3 style="color:#101d35; font-size:18px;">
                      Order Summary
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="border-collapse:collapse; font-size:12px;">

                      <tr style="background:#101d35; color:#ffffff;">

                        <th align="left" style="padding:12px 8px;">
                          Product
                        </th>

                        <th align="center" style="padding:12px 8px;">
                          Qty
                        </th>

                        <th align="right" style="padding:12px 8px;">
                          Price
                        </th>

                        <th align="right" style="padding:12px 8px;">
                          Amount
                        </th>

                      </tr>

                      ${itemRows}

                    </table>

                    <!-- PAYMENT SUMMARY -->

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="margin-top:20px; font-size:14px;">

                      <tr>
                        <td style="padding:9px 8px; color:#555555;">
                          Subtotal
                        </td>

                        <td align="right" style="padding:9px 8px;">
                          ${formatCurrency(subtotal)}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:9px 8px; color:#555555;">
                          Delivery Fee
                        </td>

                        <td align="right" style="padding:9px 8px;">
                          ${formatCurrency(shippingFee)}
                        </td>
                      </tr>

                      ${
                        discount > 0
                          ? `
                            <tr>
                              <td style="padding:9px 8px; color:#555555;">
                                Discount
                              </td>

                              <td align="right" style="padding:9px 8px;">
                                -${formatCurrency(discount)}
                              </td>
                            </tr>
                          `
                          : ""
                      }

                      <tr style="background:#f8f6f0;">

                        <td style="padding:15px 8px; color:#101d35;">
                          <strong>ORDER TOTAL</strong>
                        </td>

                        <td align="right"
                          style="padding:15px 8px; color:#101d35; font-size:17px;">

                          <strong>${formatCurrency(total)}</strong>

                        </td>

                      </tr>

                    </table>

                    <!-- PAYMENT METHOD -->

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="margin-top:25px; background:#f8f6f0; border:1px solid #e8dfc9;">

                      <tr>
                        <td style="padding:18px;">

                          <h3 style="margin:0 0 10px; color:#101d35;">
                            Payment Information
                          </h3>

                          <p style="margin:0; font-size:14px; line-height:1.8;">
                            <strong>Payment Method:</strong> ${paymentMethod}
                          </p>

                          <p style="margin:8px 0 0; font-size:13px; line-height:1.7; color:#666666;">
                            Payment will be made when your order is delivered.
                            Please prepare the required amount for payment upon delivery.
                          </p>

                        </td>
                      </tr>

                    </table>

                    <!-- DELIVERY INFORMATION -->

                    <h3 style="margin-top:28px; color:#101d35;">
                      Delivery Information
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fafafa; border:1px solid #eeeeee;">

                      <tr>
                        <td style="padding:16px; font-size:14px; line-height:1.8;">

                          <strong>${safeFullName}</strong><br />

                          ${safeAddress || "Address provided during checkout"}<br />

                          Phone: ${safePhone}<br />

                          ${safeEmail ? `Email: ${safeEmail}` : ""}

                        </td>
                      </tr>

                    </table>

                    <!-- CLOSING MESSAGE -->

                    <p style="margin-top:25px; font-size:15px; line-height:1.8;">
                      We appreciate your trust in JBELLS. Thank you for choosing us.
                      We look forward to serving you again.
                    </p>

                    <p style="font-size:15px; line-height:1.8;">
                      Best regards,<br />

                      <strong style="color:#101d35;">
                        The JBELLS Team
                      </strong>
                    </p>

                  </td>
                </tr>

                <!-- FOOTER -->

                <tr>
                  <td align="center"
                    style="background:#101d35; padding:25px 20px;">

                    <p style="margin:0 0 8px; color:#d6b86a; font-size:14px; font-weight:bold; letter-spacing:2px;">
                      JBELLS
                    </p>

                    <p style="margin:0; color:#ffffff; font-size:12px; line-height:1.7;">
                      Thank you for shopping with us.
                    </p>

                    <p style="margin:12px 0 0; color:#cccccc; font-size:11px;">
                      &copy; ${new Date().getFullYear()} JBELLS. All rights reserved.
                    </p>

                  </td>
                </tr>

              </table>

            </td>
          </tr>

        </table>

      </body>
    </html>
  `;

  // Plain-text email version.
  const textItems = items
    .map(
      (item) =>
        `${item.name} | SKU: ${item.sku} | Size: ${item.size} | Colour: ${item.color} | Quantity: ${item.quantity} | Unit Price: ${formatCurrency(item.price)} | Amount: ${formatCurrency(item.subtotal)}`
    )
    .join("\n");

  const textContent = `
JBELLS - ORDER CONFIRMATION

Hello ${customerName},

Thank you for shopping with JBELLS.

Your order has been received successfully.

ORDER NUMBER:
${order.orderNumber}

ORDER ITEMS:
${textItems}

PAYMENT SUMMARY:
Subtotal: ${formatCurrency(subtotal)}
Delivery Fee: ${formatCurrency(shippingFee)}
${discount > 0 ? `Discount: -${formatCurrency(discount)}` : ""}
TOTAL: ${formatCurrency(total)}

PAYMENT METHOD:
Pay on Delivery

Payment will be made when your order is delivered.

DELIVERY INFORMATION:
${address.fullName || customerName}
${safeAddress || "Address provided during checkout"}
Phone: ${address.phone || "Not provided"}
${address.email ? `Email: ${address.email}` : ""}

We appreciate your trust in JBELLS.

Thank you for choosing us.

Best regards,
The JBELLS Team

Copyright ${new Date().getFullYear()} JBELLS. All rights reserved.
  `;

  return {
    subject: `JBELLS Order Confirmation - ${order.orderNumber}`,
    htmlContent,
    textContent,
  };
};

module.exports = orderConfirmationEmail;
