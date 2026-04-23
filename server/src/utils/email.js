import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("Sending email to:", to);

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: to, // keep this same
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email error:", error);
  }
};

export default sendEmail;