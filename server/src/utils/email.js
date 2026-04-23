import { Resend } from "resend";

console.log("RESEND KEY:", process.env.RESEND_API_KEY);
console.log("EMAIL FROM:", process.env.EMAIL_FROM);

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("Sending email to:", to);

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email error:", error);
  }
};

export default sendEmail;