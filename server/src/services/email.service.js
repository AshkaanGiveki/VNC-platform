const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.env.emailHost,
  port: config.env.emailPort,
  auth: {
    user: config.env.emailUser,
    pass: config.env.emailPass,
  },
});

async function sendResetEmail(email, token) {
  const resetUrl = `${config.env.frontendUrl || 'http://localhost:3001'}/reset-password/${token}`;
  await transporter.sendMail({
    to: email,
    subject: 'تغییر رمز عبور',
    html: `<p>برای تعیین رمز عبور جدید <a href="${resetUrl}">اینجا</a> کلیک کنید. این لینک به مدت 1 ساعت معتبر است.</p>`,
  });
}

module.exports = { sendResetEmail };