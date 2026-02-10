const nodemailer = require('nodemailer');

/**
 * Email service for sending budget alert notifications
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter with credentials from environment variables
   */
  initialize() {
    try {
      // Check if email credentials are configured
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Email service not configured. Email alerts will be disabled.');
        this.initialized = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      this.initialized = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.initialized = false;
    }
  }

  /**
   * Send budget alert email
   * @param {string} recipientEmail - User's email address
   * @param {string} recipientName - User's name
   * @param {number} percentageUsed - Percentage of budget used
   * @param {number} totalSpent - Total amount spent this month
   * @param {number} budget - Monthly budget
   */
  async sendBudgetAlert(recipientEmail, recipientName, percentageUsed, totalSpent, budget) {
    if (!this.initialized) {
      console.log('Email service not initialized. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const thresholdType = percentageUsed >= 100 ? '100%' : '80%';
      const subject = `⚠️ Budget Alert: ${thresholdType} of Monthly Budget Reached`;
      
      const htmlContent = this.generateEmailHTML(
        recipientName,
        percentageUsed,
        totalSpent,
        budget,
        thresholdType
      );

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Expense Tracker'}" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Budget alert email sent to ${recipientEmail}: ${info.messageId}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending budget alert email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HTML content for budget alert email
   * @private
   */
  generateEmailHTML(name, percentageUsed, totalSpent, budget, thresholdType) {
    const remaining = budget - totalSpent;
    const isOverBudget = percentageUsed >= 100;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Budget Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: ${isOverBudget ? '#dc3545' : '#ff9800'}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">⚠️ Budget Alert</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #ddd;">
        <p style="font-size: 16px; margin-top: 0;">Hi ${name},</p>
        
        <p style="font-size: 16px;">
            You have reached <strong>${thresholdType}</strong> of your monthly budget!
        </p>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${isOverBudget ? '#dc3545' : '#ff9800'};">
            <h2 style="margin-top: 0; color: ${isOverBudget ? '#dc3545' : '#ff9800'}; font-size: 20px;">Budget Summary</h2>
            <table style="width: 100%; font-size: 15px;">
                <tr>
                    <td style="padding: 8px 0;"><strong>Monthly Budget:</strong></td>
                    <td style="text-align: right; padding: 8px 0;">₹${budget.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Total Spent:</strong></td>
                    <td style="text-align: right; padding: 8px 0; color: ${isOverBudget ? '#dc3545' : '#333'};">
                        ₹${totalSpent.toFixed(2)}
                    </td>
                </tr>
                <tr style="border-top: 2px solid #ddd;">
                    <td style="padding: 8px 0;"><strong>${isOverBudget ? 'Over Budget:' : 'Remaining:'}</strong></td>
                    <td style="text-align: right; padding: 8px 0; font-size: 18px; color: ${isOverBudget ? '#dc3545' : '#28a745'};">
                        <strong>${isOverBudget ? '-' : ''}₹${Math.abs(remaining).toFixed(2)}</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Percentage Used:</strong></td>
                    <td style="text-align: right; padding: 8px 0;">
                        <strong style="color: ${isOverBudget ? '#dc3545' : '#ff9800'};">${percentageUsed.toFixed(1)}%</strong>
                    </td>
                </tr>
            </table>
        </div>
        
        ${isOverBudget ? 
            '<p style="font-size: 15px; color: #dc3545;"><strong>⚠️ Warning:</strong> You have exceeded your monthly budget. Consider reviewing your expenses.</p>' :
            '<p style="font-size: 15px; color: #ff9800;"><strong>💡 Tip:</strong> You\'re approaching your budget limit. Be mindful of your remaining expenses this month.</p>'
        }
        
        <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            This is an automated alert from your Expense Tracker. You will receive this notification only once per threshold per month.
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Verify email configuration
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    if (!this.initialized) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
