
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

const formatCurrency = (amount = 0) => {
  return `NGN ${Number(amount || 0).toLocaleString("en-NG")}`;
};

const adminOrderNotificationEmail = (order) => {
  const address = order.shippingAddress || {};

  const orderNumber = escapeHtml(order.orderNumber || "N/A");

  const customerName = escapeHtml(
    address.fullName || "Customer"
  );

  const customerEmail = escapeHtml(
    address.email || "N/A"
  );

  const customerPhone = escapeHtml(
    address.phone || "N/A"
  );

  const paymentStatus = escapeHtml(
    order.paymentStatus || "pending"
  );

  const orderStatus = escapeHtml(
    order.orderStatus || "pending"
  );

  const paymentMethod = "Pay on Delivery";

  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHtml = items
    .map((item) => {
      const name = escapeHtml(item.productName || "Product");
      const sku = escapeHtml(item.variantSku || "N/A");
      const size = escapeHtml(item.size || "N/A");
      const color = escapeHtml(item.color || "N/A");

      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const itemSubtotal = Number(
        item.subtotal || quantity * unitPrice
      );

      return `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #eeeeee;color:#333333;">
            <strong>${name}</strong><br />

            <span style="font-size:12px;color:#777777;">
              SKU: ${sku}<br />
              Size: ${size}<br />
              Colour: ${color}
            </span>
          </td>

          <td style="padding:12px 8px;border-bottom:1px solid #eeeeee;text-align:center;">
            ${quantity}
          </td>

          <td style="padding:12px 8px;border-bottom:1px solid #eeeeee;text-align:right;">
            ${formatCurrency(unitPrice)}
          </td>

          <td style="padding:12px 8px;border-bottom:1px solid #eeeeee;text-align:right;">
            <strong>${formatCurrency(itemSubtotal)}</strong>
          </td>
        </tr>
      `;
    })
    .join("");

  const shippingAddress = [
    address.address,
    address.city,
    address.state,
    address.postalCode,
    address.country || "Nigeria",
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ");

  const deliveryInstructions = escapeHtml(
    address.deliveryInstructions || "No special instructions"
  );

  const subtotal = Number(order.subtotal || 0);
  const shippingFee = Number(order.shippingFee || 0);
  const discount = Number(order.discount || 0);
  const totalAmount = Number(order.totalAmount || 0);

  const subject = `JBELLS - New Order Received - ${order.orderNumber || "Order"}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>JBELLS New Order Notification</title>
      </head>

      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#333333;">

        <table width="100%" cellpadding="0" cellspacing="0"
          style="padding:30px 10px;background:#f3f4f6;">

          <tr>
            <td align="center">

              <table width="650" cellpadding="0" cellspacing="0"
                style="max-width:650px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

                <!-- HEADER -->

                <tr>
                  <td align="center"
                    style="background:#101d35;padding:30px 20px;border-bottom:4px solid #c9a44c;">

                    <h1 style="margin:0;color:#ffffff;font-size:29px;letter-spacing:3px;">
                      JBELLS
                    </h1>

                    <p style="margin:8px 0 0;color:#d6b86a;font-size:12px;letter-spacing:2px;">
                      ADMIN ORDER NOTIFICATION
                    </p>

                  </td>
                </tr>

                <!-- MAIN CONTENT -->

                <tr>
                  <td style="padding:30px;">

                    <h2 style="margin-top:0;color:#101d35;font-size:23px;">
                      New Order Received!
                    </h2>

                    <p style="font-size:15px;line-height:1.7;">
                      A new customer order has been successfully placed on the JBELLS online store.
                      Please review the order details below and proceed with processing.
                    </p>

                    <!-- ORDER REFERENCE -->

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="margin:20px 0;background:#f8f6f0;border-left:4px solid #c9a44c;">

                      <tr>
                        <td style="padding:18px;">

                          <p style="margin:0 0 7px;color:#777777;font-size:12px;">
                            ORDER NUMBER
                          </p>

                          <h2 style="margin:0;color:#101d35;font-size:20px;">
                            ${orderNumber}
                          </h2>

                        </td>
                      </tr>

                    </table>

                    <!-- ORDER STATUS -->

                    <h3 style="color:#101d35;">
                      Order Information
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="font-size:14px;border-collapse:collapse;">

                      <tr>
                        <td style="padding:9px 5px;border-bottom:1px solid #eeeeee;">
                          Order Status
                        </td>

                        <td align="right" style="padding:9px 5px;border-bottom:1px solid #eeeeee;">
                          <strong>${orderStatus.toUpperCase()}</strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:9px 5px;border-bottom:1px solid #eeeeee;">
                          Payment Status
                        </td>

                        <td align="right" style="padding:9px 5px;border-bottom:1px solid #eeeeee;">
                          <strong>${paymentStatus.toUpperCase()}</strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:9px 5px;">
                          Payment Method
                        </td>

                        <td align="right" style="padding:9px 5px;">
                          <strong>${paymentMethod}</strong>
                        </td>
                      </tr>

                    </table>

                    <!-- CUSTOMER INFORMATION -->

                    <h3 style="margin-top:25px;color:#101d35;">
                      Customer Information
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fafafa;border:1px solid #eeeeee;">

                      <tr>
                        <td style="padding:16px;font-size:14px;line-height:1.9;">

                          <strong>${customerName}</strong><br />

                          Email: ${customerEmail}<br />

                          Phone: ${customerPhone}

                        </td>
                      </tr>

                    </table>

                    <!-- DELIVERY INFORMATION -->

                    <h3 style="margin-top:25px;color:#101d35;">
                      Delivery Information
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fafafa;border:1px solid #eeeeee;">

                      <tr>
                        <td style="padding:16px;font-size:14px;line-height:1.8;">

                          <strong>Delivery Address</strong><br />

                          ${shippingAddress || "Address not provided"}

                          <br /><br />

                          <strong>Delivery Instructions</strong><br />

                          ${deliveryInstructions}

                        </td>
                      </tr>

                    </table>

                    <!-- ORDER ITEMS -->

                    <h3 style="margin-top:25px;color:#101d35;">
                      Ordered Products
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="width:100%;border-collapse:collapse;font-size:12px;">

                      <thead>
                        <tr style="background:#101d35;color:#ffffff;">

                          <th align="left" style="padding:12px 8px;">
                            Product
                          </th>

                          <th align="center" style="padding:12px 8px;">
                            Qty
                          </th>

                          <th align="right" style="padding:12px 8px;">
                            Unit Price
                          </th>

                          <th align="right" style="padding:12px 8px;">
                            Amount
                          </th>

                        </tr>
                      </thead>

                      <tbody>
                        ${itemsHtml}
                      </tbody>

                    </table>

                    <!-- ORDER TOTALS -->

                    <h3 style="margin-top:25px;color:#101d35;">
                      Financial Summary
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="font-size:14px;">

                      <tr>
                        <td style="padding:9px 8px;">
                          Subtotal
                        </td>

                        <td align="right" style="padding:9px 8px;">
                          ${formatCurrency(subtotal)}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:9px 8px;">
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
                              <td style="padding:9px 8px;">
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

                        <td style="padding:15px 8px;color:#101d35;">
                          <strong>TOTAL ORDER VALUE</strong>
                        </td>

                        <td align="right" style="padding:15px 8px;color:#101d35;font-size:17px;">
                          <strong>${formatCurrency(totalAmount)}</strong>
                        </td>

                      </tr>

                    </table>

                    <!-- ADMIN ACTION -->

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="margin-top:25px;background:#f8f6f0;border:1px solid #e8dfc9;">

                      <tr>
                        <td style="padding:18px;">

                          <h3 style="margin:0 0 10px;color:#101d35;">
                            Administrator Action Required
                          </h3>

                          <p style="margin:0;font-size:14px;line-height:1.7;">
                            Please sign in to the JBELLS admin dashboard to review this order,
                            confirm availability and begin the order processing procedure.
                          </p>

                          <p style="margin:12px 0 0;color:#777777;font-size:13px;">
                            Remember: This order uses Pay on Delivery.
                          </p>

                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>

                <!-- FOOTER -->

                <tr>
                  <td align="center"
                    style="background:#101d35;padding:22px;color:#ffffff;">

                    <p style="margin:0;color:#d6b86a;font-size:14px;font-weight:bold;letter-spacing:2px;">
                      JBELLS
                    </p>

                    <p style="margin:8px 0 0;color:#cccccc;font-size:12px;">
                      Automated New Order Notification
                    </p>

                    <p style="margin:12px 0 0;color:#cccccc;font-size:11px;">
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

  const textItems = items
    .map(
      (item) =>
        `${item.productName || "Product"} | SKU: ${item.variantSku || "N/A"} | Size: ${item.size || "N/A"} | Colour: ${item.color || "N/A"} | Quantity: ${item.quantity || 0} | Unit Price: ${formatCurrency(item.unitPrice)} | Subtotal: ${formatCurrency(item.subtotal)}`
    )
    .join("\n");

  const textContent = `
JBELLS - NEW ORDER RECEIVED

A new customer order has been placed.

ORDER INFORMATION
Order Number: ${order.orderNumber || "N/A"}
Order Status: ${order.orderStatus || "pending"}
Payment Status: ${order.paymentStatus || "pending"}
Payment Method: ${paymentMethod}

CUSTOMER INFORMATION
Name: ${address.fullName || "Customer"}
Email: ${address.email || "N/A"}
Phone: ${address.phone || "N/A"}

DELIVERY INFORMATION
${[
  address.address,
  address.city,
  address.state,
  address.postalCode,
  address.country || "Nigeria",
]
  .filter(Boolean)
  .join(", ") || "Address not provided"}

Delivery Instructions:
${address.deliveryInstructions || "No special instructions"}

ORDERED PRODUCTS
${textItems || "No order items found."}

FINANCIAL SUMMARY
Subtotal: ${formatCurrency(subtotal)}
Delivery Fee: ${formatCurrency(shippingFee)}
${discount > 0 ? `Discount: -${formatCurrency(discount)}` : ""}
TOTAL ORDER VALUE: ${formatCurrency(totalAmount)}

ADMINISTRATOR ACTION REQUIRED
Please sign in to the JBELLS admin dashboard to review and process this order.

Remember: This order uses Pay on Delivery.

JBELLS
Automated New Order Notification
Copyright ${new Date().getFullYear()} JBELLS.
  `;

  return {
    subject,
    htmlContent,
    textContent,
  };
};

module.exports = adminOrderNotificationEmail;
