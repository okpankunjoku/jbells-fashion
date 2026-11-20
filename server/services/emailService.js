
const { brevo, emailSender } = require("../config/email");

/**
 * Sends a transactional email through Brevo.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.htmlContent - HTML email content.
 * @param {string} [options.textContent] - Plain-text email content.
 * @param {string} [options.toName] - Recipient's name.
 */
const sendEmail = async ({
  to,
  subject,
  htmlContent,
  textContent,
  toName,
}) => {
  try {
    if (!to || !subject || !htmlContent) {
      throw new Error(
        "Recipient, subject, and HTML content are required."
      );
    }

    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: emailSender,
      to: [
        {
          email: to,
          ...(toName ? { name: toName } : {}),
        },
      ],
      subject,
      htmlContent,
      ...(textContent ? { textContent } : {}),
    });

    console.log(`Email sent successfully to ${to}`);

    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error) {
    console.error(
      "Email sending failed:",
      error.response?.body || error.message
    );

    throw new Error("Unable to send email. Please try again later.");
  }
};

module.exports = {
  sendEmail,
};
