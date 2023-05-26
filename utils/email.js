const nodemailer = require("nodemailer");

const sendEmail = async options => {
  // 1. Create a transporter

  // const transporter = nodemailer.createTransport({
  //   host: process.env.MAILTRAP_HOST,
  //   port: process.env.MAILTRAP_PORT,
  //   auth: {
  //     user: process.env.MAILTRAP_USERNAME,
  //     pass: process.env.MAILTRAP_PASSWORD,
  //   },
  // });

  const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
      user: process.env.SENDGRID_USERNAME,
      pass: process.env.SENDGRID_PASSWORD,
    },
  });

  // 2. Define email options
  const mailOptions = {
    from: `Social App Service <${process.env.EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: `
    <p>Forgot your password? Click the button below to reset your password.</p>
    <a href="${options.resetUrl}">
      <button style="box-sizing:border-box;border-color:#348eda;font-weight:400;text-decoration:none;display:inline-block;margin:0;color:#ffffff;background-color:#348eda;border:solid 1px #348eda;border-radius:2px;font-size:14px;padding:12px 45px;cursor:pointer">RESET YOUR PASSWORD</button>
    </a>
    <p>If you didn't forget your password, please ignore this email!</p>
    <p>Best regards,</p>
    <p><b>Social App Service</b></p>
    `,
  };

  // 3. Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
