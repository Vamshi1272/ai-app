import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("📨 Sending email to:", to);

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: to,
      subject,
      html,
    });

    console.log("✅ Email sent:", response);

  } catch (error) {
    console.error("❌ Email error:", JSON.stringify(error, null, 2));
  }
};

export default sendEmail;