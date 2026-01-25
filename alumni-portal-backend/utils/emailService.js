/**
 * Email Notification Service
 * Handles sending emails for various notifications
 */

const nodemailer = require('nodemailer');

// Create transporter (configure based on environment or explicit SMTP vars)
const createTransporter = () => {
  // If SMTP credentials are provided, prefer them regardless of NODE_ENV
  if (process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For production fallback (no SMTP_USER configured)
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development, use Ethereal (fake SMTP service)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'test@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'testpass',
    },
  });
};

const transporter = createTransporter();

// Email templates
const templates = {
  welcome: (user) => ({
    subject: '🎓 Welcome to LegacyLink Alumni Portal!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0077b5 0%, #005885 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #0077b5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to LegacyLink!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name}! 👋</h2>
            <p>Thank you for joining the LegacyLink Alumni Portal. We're excited to have you as part of our community!</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>🤝 Connect with fellow alumni and students</li>
              <li>💼 Explore job opportunities</li>
              <li>🎓 Find or become a mentor</li>
              <li>📅 Attend exclusive events</li>
            </ul>
            <p>Your account is pending verification by an administrator. You'll receive another email once verified.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} LegacyLink Alumni Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  accountVerified: (user) => ({
    subject: '✅ Your LegacyLink Account is Verified!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Account Verified!</h1>
          </div>
          <div class="content">
            <h2>Congratulations, ${user.name}! 🎉</h2>
            <p>Your LegacyLink account has been verified by an administrator. You now have full access to all features!</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Start Exploring</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (user, resetUrl) => ({
    subject: '🔐 Password Reset Request - LegacyLink',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  mentorshipRequest: (alumni, student, message) => ({
    subject: '🤝 New Mentorship Request - LegacyLink',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0077b5 0%, #005885 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; border-left: 4px solid #0077b5; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #0077b5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .button.secondary { background: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 New Mentorship Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${alumni.name},</h2>
            <p><strong>${student.name}</strong> would like you to be their mentor!</p>
            <div class="message-box">
              <p><em>"${message}"</em></p>
              <p style="color: #666; font-size: 12px;">— ${student.name}</p>
            </div>
            <p>Review their profile and respond to this request:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentorship" class="button">View Request</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  mentorshipAccepted: (student, alumni) => ({
    subject: '🎉 Mentorship Request Accepted! - LegacyLink',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Great News!</h1>
          </div>
          <div class="content">
            <h2>Hi ${student.name},</h2>
            <p><strong>${alumni.name}</strong> has accepted your mentorship request!</p>
            <p>You can now connect directly and start your mentorship journey together.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentorship" class="button">Start Chatting</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  newEvent: (user, event) => ({
    subject: `📅 New Event: ${event.title} - LegacyLink`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .event-card { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Event</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>A new event has been announced that you might be interested in!</p>
            <div class="event-card">
              <h3>${event.title}</h3>
              <p>${event.description}</p>
              <p><strong>📍 Location:</strong> ${event.location}</p>
              <p><strong>📆 Date:</strong> ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/events" class="button">RSVP Now</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} templateName - Name of the template to use
 * @param {Object} data - Data to pass to the template
 */
const sendEmail = async (to, templateName, data) => {
  try {
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(data);

    const mailOptions = {
      from: `"LegacyLink" <${process.env.SMTP_FROM || 'noreply@legacylink.com'}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`📧 Email sent: ${info.messageId}`);
    
    // For Ethereal, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send bulk emails (for announcements)
 */
const sendBulkEmail = async (recipients, templateName, data) => {
  const results = await Promise.allSettled(
    recipients.map(recipient => 
      sendEmail(recipient.email, templateName, { ...data, user: recipient })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  return { successful, failed, total: results.length };
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  templates,
};
