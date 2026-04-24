import { Resend } from "resend";

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("📨 Sending email to:", to);
    console.log("RESEND KEY:", process.env.RESEND_API_KEY); // debug

    const resend = new Resend(process.env.RESEND_API_KEY); // ✅ moved inside

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", response);

  } catch (error) {
    console.error("❌ Email error:", JSON.stringify(error, null, 2));
  }
};

export default sendEmail;