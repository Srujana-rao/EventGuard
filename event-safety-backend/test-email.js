require('dotenv').config(); // Load .env variables
const nodemailer = require('nodemailer');

async function sendTestEmail() {
  // Create transporter using your SMTP config
  let transporter = nodemailer.createTransport({
    service: 'Gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER, // your email from .env
      pass: process.env.EMAIL_PASS, // your email password or app password from .env
    },
  });

  // Define email options
  const mailOptions = {
    from: `"Test Sender" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,  // send test email to yourself
    subject: 'Test Email from Nodemailer',
    text: 'This is a test email sent to verify SMTP configuration.',
    html: '<p>This is a <b>test email</b> sent to verify SMTP configuration.</p>',
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.response);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

sendTestEmail();
