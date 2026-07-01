const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isSimulated = true;
    this.init();
  }

  init() {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;

    // If real credentials are provided, setup real SMTP
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      this.isSimulated = false;
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      console.log('[EmailService] Configured with real SMTP credentials.');
    } else {
      console.log('[EmailService] No SMTP credentials found. Running in SIMULATED fallback mode.');
    }
  }

  async sendEmail({ to, subject, body }) {
    if (this.isSimulated) {
      console.log(`\n=== [SIMULATED EMAIL] ===\nTo: ${to}\nSubject: ${subject}\nBody: ${body}\n=========================\n`);
      return { status: 'simulated', message: 'Email simulated successfully' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Workflow Automation" <${process.env.SMTP_FROM || 'noreply@workflow.local'}>`,
        to: to,
        subject: subject,
        text: body,
      });

      console.log('[EmailService] Email sent:', info.messageId);
      return { status: 'sent', messageId: info.messageId };
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
