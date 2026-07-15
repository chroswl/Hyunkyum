import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: "Invalid JSON body" });
        }
    }

    const { name, email, message } = body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields: name, email, message" });
    }

    // 2. Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'contact@hyunkyumkim.com', // Use a verified domain if possible
      to: 'contact@hyunkyumkim.com',
      subject: `[Hyunkyum Kim Website] New Inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email", details: error });
    }

    return res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error("Contact API error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || String(error),
    });
  }
}
