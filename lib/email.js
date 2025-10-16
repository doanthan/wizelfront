import { Resend } from 'resend';

// Lazy initialization - only create Resend client when needed (not at build time)
let resend = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Send email verification email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.token - Verification token
 * @returns {Promise<Object>} - Resend response
 */
export async function sendVerificationEmail({ to, name, token }) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  try {
    const resendClient = getResendClient();
    const data = await resendClient.emails.send({
      from: 'Wizel.ai <onboarding@wizel.ai>',
      to: [to],
      subject: 'Verify your Wizel.ai email address',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - Wizel.ai</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- Header with gradient -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(to right, #60A5FA, #8B5CF6); border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                          Welcome to Wizel.ai!
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #1e293b;">
                          Hi ${name},
                        </p>

                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #1e293b;">
                          Thank you for signing up for Wizel.ai! To complete your registration and start creating AI-powered email campaigns, please verify your email address.
                        </p>

                        <!-- CTA Button -->
                        <table role="presentation" style="margin: 30px 0; width: 100%;">
                          <tr>
                            <td align="center">
                              <a href="${verificationUrl}"
                                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #60A5FA, #8B5CF6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(96, 165, 250, 0.3);">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 20px 0 0; font-size: 14px; line-height: 20px; color: #64748b;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 8px 0 0; font-size: 14px; line-height: 20px; color: #8B5CF6; word-break: break-all;">
                          ${verificationUrl}
                        </p>

                        <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 12px; font-size: 14px; line-height: 20px; color: #64748b;">
                            <strong>What's next?</strong>
                          </p>
                          <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 22px;">
                            <li>Connect your Klaviyo account</li>
                            <li>Create your first AI-powered campaign</li>
                            <li>Start your 14-day free trial</li>
                          </ul>
                        </div>

                        <p style="margin: 30px 0 0; font-size: 13px; line-height: 18px; color: #94a3b8;">
                          This verification link will expire in 24 hours. If you didn't create a Wizel.ai account, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; text-align: center;">
                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                          © ${new Date().getFullYear()} Wizel.ai. All rights reserved.
                        </p>
                        <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">
                          Need help? Contact us at support@wizel.ai
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log('✅ Verification email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email after verification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @returns {Promise<Object>} - Resend response
 */
export async function sendWelcomeEmail({ to, name }) {
  try {
    const resendClient = getResendClient();
    const data = await resendClient.emails.send({
      from: 'Wizel.ai <hello@wizel.ai>',
      to: [to],
      subject: 'Welcome to Wizel.ai - Let\'s Get Started!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Wizel.ai</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(to right, #60A5FA, #8B5CF6); border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                          You're All Set! 🎉
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #1e293b;">
                          Hi ${name},
                        </p>

                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #1e293b;">
                          Your email has been verified successfully! You're now ready to unlock the full power of AI-driven email marketing with Wizel.ai.
                        </p>

                        <!-- CTA Button -->
                        <table role="presentation" style="margin: 30px 0; width: 100%;">
                          <tr>
                            <td align="center">
                              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #60A5FA, #8B5CF6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(96, 165, 250, 0.3);">
                                Go to Dashboard
                              </a>
                            </td>
                          </tr>
                        </table>

                        <div style="margin-top: 30px;">
                          <p style="margin: 0 0 12px; font-size: 14px; line-height: 20px; color: #1e293b; font-weight: 600;">
                            Ready to get started? Here's what you can do:
                          </p>
                          <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 22px;">
                            <li style="margin-bottom: 8px;">Connect your Klaviyo account to sync your customer data</li>
                            <li style="margin-bottom: 8px;">Create your first AI-powered email campaign</li>
                            <li style="margin-bottom: 8px;">Explore our analytics dashboard</li>
                            <li style="margin-bottom: 8px;">Set up automated flows and segments</li>
                          </ul>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; text-align: center;">
                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                          © ${new Date().getFullYear()} Wizel.ai. All rights reserved.
                        </p>
                        <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">
                          Need help? Contact us at support@wizel.ai
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log('✅ Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate email domain (checks if domain exists)
 * @param {string} email - Email to validate
 * @returns {Promise<boolean>} - True if domain is valid
 */
export async function isValidEmailDomain(email) {
  if (!isValidEmail(email)) {
    console.log('❌ Invalid email format:', email);
    return false;
  }

  const domain = email.split('@')[1];
  console.log('🔍 Checking email domain:', domain);

  // List of common typo domains to block
  const typosDomains = [
    'gmial.com', 'gmai.com', 'gmil.com', 'gnail.com',
    'yhoo.com', 'yaho.com', 'yahooo.com',
    'hotmial.com', 'hotmil.com', 'hotmai.com'
  ];

  if (typosDomains.includes(domain.toLowerCase())) {
    console.log('❌ Blocked typo domain:', domain);
    return false;
  }

  // List of disposable/temporary email domains to block
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com',
    'guerrillamail.com', 'mailinator.com', 'trashmail.com'
  ];

  if (disposableDomains.includes(domain.toLowerCase())) {
    console.log('❌ Blocked disposable domain:', domain);
    return false;
  }

  console.log('✅ Email domain is valid:', domain);
  return true;
}
