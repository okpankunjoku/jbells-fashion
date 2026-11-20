
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

const welcomeEmail = (firstName, verificationUrl) => {
  if (!verificationUrl) {
    throw new Error("Email verification URL is required.");
  }

  const safeName = escapeHtml(firstName || "Customer");
  const safeUrl = escapeHtml(verificationUrl);
  const currentYear = new Date().getFullYear();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Verify Your Email Address | JBELLS</title>
</head>

<body style="margin:0;padding:0;background-color:#f3f5f8;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0"
    role="presentation"
    style="background-color:#f3f5f8;padding:35px 12px;">

    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0"
          role="presentation"
          style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td align="center"
              style="background:#101d35;padding:38px 20px;">

              <h1 style="margin:0;color:#ffffff;font-size:32px;letter-spacing:3px;font-weight:700;">
                JBELLS
              </h1>

              <p style="margin:12px 0 0;color:#d6b66b;font-size:12px;letter-spacing:3px;text-transform:uppercase;">
                Fashion &amp; Lifestyle
              </p>

              <div style="width:55px;height:2px;background:#d6b66b;margin:22px auto 0;"></div>

            </td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding:42px 32px;color:#374151;">

              <p style="margin:0 0 12px;color:#b18a3d;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                Welcome to JBELLS
              </p>

              <h2 style="margin:0 0 20px;color:#101d35;font-size:26px;line-height:1.4;">
                Hello, ${safeName}!
              </h2>

              <p style="font-size:15px;line-height:1.9;color:#4b5563;">
                Thank you for creating an account with
                <strong style="color:#101d35;">JBELLS</strong>.
                We're delighted to welcome you to our fashion community.
              </p>

              <p style="font-size:15px;line-height:1.9;color:#4b5563;">
                To complete your registration and activate your account,
                please confirm your email address by clicking the button below.
              </p>

              <!-- VERIFICATION BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0"
                role="presentation"
                style="margin:32px 0;">

                <tr>
                  <td align="center">

                    <a href="${safeUrl}"
                      target="_blank"
                      style="display:inline-block;background:#101d35;color:#ffffff;text-decoration:none;padding:17px 34px;border-radius:5px;font-size:13px;font-weight:bold;letter-spacing:1.5px;">

                      VERIFY MY EMAIL ADDRESS

                    </a>

                  </td>
                </tr>

              </table>

              <p style="font-size:13px;line-height:1.8;color:#6b7280;">
                If the button doesn't work, copy and paste the following
                link into your browser:
              </p>

              <p style="font-size:12px;line-height:1.8;word-break:break-all;background:#f8f9fb;padding:14px;border-radius:5px;">
                <a href="${safeUrl}" style="color:#a17a2e;text-decoration:underline;">
                  ${safeUrl}
                </a>
              </p>

              <p style="font-size:13px;line-height:1.8;color:#6b7280;margin-top:25px;">
                For your security, this verification link expires after
                24 hours.
              </p>

              <p style="font-size:14px;line-height:1.8;color:#4b5563;margin-top:25px;">
                If you did not create this account, you can safely ignore
                this email.
              </p>

              <p style="font-size:15px;line-height:1.8;color:#4b5563;margin-top:30px;">
                We look forward to serving you.<br />
                <strong style="color:#101d35;">The JBELLS Team</strong>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center"
              style="background:#101d35;padding:28px 20px;">

              <p style="margin:0 0 10px;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:3px;">
                JBELLS
              </p>

              <p style="margin:0;color:#d6b66b;font-size:11px;letter-spacing:2px;">
                FASHION &amp; LIFESTYLE
              </p>

              <p style="margin:18px 0 0;color:#cbd5e1;font-size:12px;line-height:1.8;">
                Thank you for choosing JBELLS.
              </p>

              <p style="margin:18px 0 0;color:#94a3b8;font-size:11px;">
                &copy; ${currentYear} JBELLS. All rights reserved.
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

  const textContent = `
WELCOME TO JBELLS

Hello ${firstName || "Customer"},

Thank you for creating an account with JBELLS.

We're delighted to welcome you to our fashion community.

Please verify your email address to activate your account.

VERIFY YOUR EMAIL:
${verificationUrl}

This verification link expires after 24 hours.

If you did not create this account, you can safely ignore this email.

We look forward to serving you.

The JBELLS Team

Copyright ${currentYear} JBELLS. All rights reserved.
`;

  return {
    subject: "Welcome to JBELLS | Verify Your Email Address",
    htmlContent,
    textContent,
  };
};

module.exports = welcomeEmail;
