const nodemailer = require("nodemailer");
const sendMail = async options => {
    // creat reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        secure: false, // upgrade later with STARTTLS
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
    const message = {
        from: process.env.EMAIL, // sender address
        to: options.email, // list of receivers
        subject: options.subject, // Subject line
        text: options.text, // plain text body
        html: options.html     // html body
    };
    await transporter.sendMail(message);
}
module.exports = sendMail;