import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sendResendEmail(apiKey: string, payload: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  reply_to?: string;
  attachments?: Array<{ filename: string; content: string }>;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

// Send via Gmail API using app password — requires a pre-obtained OAuth2 token.
// Since we only have GMAIL_USER + GMAIL_APP_PASSWORD (SMTP credentials), and raw
// SMTP ports are blocked in Deno edge functions, we use nodemailer via npm: specifier
// which handles SMTP over port 465 (SSL) — this port IS allowed in Supabase edge.
async function sendViaGmail(user: string, appPassword: string, to: string, subject: string, html: string, replyTo?: string) {
  const { default: nodemailer } = await import("npm:nodemailer@6.9.14");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: appPassword },
  });

  await transporter.sendMail({
    from: `"Attic Adult Family Home" <${user}>`,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";

    let type = "", name = "", email = "", phone = "", message = "", date = "", time = "";
    let resumeBase64 = "", resumeFilename = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      type = String(formData.get("type") ?? "");
      name = String(formData.get("name") ?? "");
      email = String(formData.get("email") ?? "");
      phone = String(formData.get("phone") ?? "");
      message = String(formData.get("message") ?? "");
      date = String(formData.get("date") ?? "");
      time = String(formData.get("time") ?? "");

      const resumeFile = formData.get("resume");
      if (resumeFile instanceof File && resumeFile.size > 0) {
        const buf = await resumeFile.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        resumeBase64 = btoa(binary);
        resumeFilename = resumeFile.name;
      }
    } else {
      const body = await req.json();
      type = body.type ?? "";
      name = body.name ?? "";
      email = body.email ?? "";
      phone = body.phone ?? "";
      message = body.message ?? "";
      date = body.date ?? "";
      time = body.time ?? "";
    }

    // ── CAREERS APPLICATION ──────────────────────────────────────────
    if (type === "careers") {
      const ownerHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a3a3a">New Job Application — Caregiver Position</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:600;color:#555;width:140px">Name</td><td style="padding:8px 0">${name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#555">Phone</td><td style="padding:8px 0"><a href="tel:${phone}">${phone}</a></td></tr>
            ${message ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;vertical-align:top">About</td><td style="padding:8px 0">${message}</td></tr>` : ""}
          </table>
          ${resumeFilename ? `<p style="color:#555;margin-top:16px">Resume attached: <strong>${resumeFilename}</strong></p>` : "<p style='color:#999;margin-top:16px'>No resume attached.</p>"}
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
          <p style="color:#999;font-size:12px">Sent via Attic Adult Family Home website</p>
        </div>`;

      const confirmHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#2e9090;padding:32px 24px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px">Application Received!</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
            <p style="font-size:16px;color:#333">Hi <strong>${name}</strong>,</p>
            <p style="color:#555;line-height:1.6">Thank you for your interest in joining Attic Adult Family Home as a <strong>Caregiver / Home Care Aide</strong>.</p>
            <p style="color:#555;line-height:1.6">We've received your application and will review it shortly. We'll reach out to you at a <strong>convenient time</strong> to discuss next steps.</p>
            <p style="color:#555;line-height:1.6">Questions in the meantime? Call us:</p>
            <p style="margin:0"><a href="tel:+12537375302" style="color:#2e9090;font-weight:600">+1 (253) 737-5302</a></p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
            <p style="color:#999;font-size:12px;margin:0">Attic Adult Family Home LLC &middot; Auburn, WA &middot; <a href="mailto:atticafh25@gmail.com" style="color:#999">atticafh25@gmail.com</a></p>
          </div>
        </div>`;

      // Owner notification via Resend (always goes to atticafh25@gmail.com)
      const ownerPayload: Parameters<typeof sendResendEmail>[1] = {
        from: "Attic AFH Careers <onboarding@resend.dev>",
        to: ["atticafh25@gmail.com"],
        reply_to: email,
        subject: `New Caregiver Application from ${name}`,
        html: ownerHtml,
      };
      if (resumeBase64 && resumeFilename) {
        ownerPayload.attachments = [{ filename: resumeFilename, content: resumeBase64 }];
      }
      await sendResendEmail(RESEND_API_KEY, ownerPayload);

      // Confirmation to applicant via Gmail
      if (GMAIL_USER && GMAIL_APP_PASSWORD) {
        await sendViaGmail(GMAIL_USER, GMAIL_APP_PASSWORD, email,
          "Your Application to Attic Adult Family Home", confirmHtml);
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── TOUR / CONTACT ───────────────────────────────────────────────
    const isTour = type === "tour";

    const ownerSubject = isTour
      ? `Tour Request from ${name} — ${date} at ${time}`
      : `New Contact Message from ${name}`;

    const ownerHtml = isTour
      ? `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
           <h2 style="color:#1a3a3a">New Tour Scheduling Request</h2>
           <table style="width:100%;border-collapse:collapse">
             <tr><td style="padding:8px 0;font-weight:600;color:#555;width:140px">Name</td><td style="padding:8px 0">${name}</td></tr>
             <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
             <tr><td style="padding:8px 0;font-weight:600;color:#555">Phone</td><td style="padding:8px 0"><a href="tel:${phone}">${phone}</a></td></tr>
             <tr><td style="padding:8px 0;font-weight:600;color:#555">Preferred Date</td><td style="padding:8px 0">${date}</td></tr>
             <tr><td style="padding:8px 0;font-weight:600;color:#555">Preferred Time</td><td style="padding:8px 0">${time}</td></tr>
             ${message ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;vertical-align:top">Notes</td><td style="padding:8px 0">${message}</td></tr>` : ""}
           </table>
           <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
           <p style="color:#999;font-size:12px">Sent via Attic Adult Family Home website</p>
         </div>`
      : `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
           <h2 style="color:#1a3a3a">New Contact Form Submission</h2>
           <table style="width:100%;border-collapse:collapse">
             <tr><td style="padding:8px 0;font-weight:600;color:#555;width:140px">Name</td><td style="padding:8px 0">${name}</td></tr>
             <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
             ${phone ? `<tr><td style="padding:8px 0;font-weight:600;color:#555">Phone</td><td style="padding:8px 0">${phone}</td></tr>` : ""}
             <tr><td style="padding:8px 0;font-weight:600;color:#555;vertical-align:top">Message</td><td style="padding:8px 0">${message}</td></tr>
           </table>
           <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
           <p style="color:#999;font-size:12px">Sent via Attic Adult Family Home website</p>
         </div>`;

    const replySubject = isTour
      ? `We received your tour request — Attic Adult Family Home`
      : `We received your message — Attic Adult Family Home`;

    const replyHtml = isTour
      ? `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
           <div style="background:#2e9090;padding:32px 24px;border-radius:8px 8px 0 0;text-align:center">
             <h1 style="color:white;margin:0;font-size:22px">Tour Request Received!</h1>
           </div>
           <div style="background:#fff;padding:32px 24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
             <p style="font-size:16px;color:#333">Hi <strong>${name}</strong>,</p>
             <p style="color:#555;line-height:1.6">Thank you for reaching out to Attic Adult Family Home. We've received your request to tour our home on <strong>${date}</strong> at <strong>${time}</strong>.</p>
             <p style="color:#555;line-height:1.6">One of our team members will <strong>get back to you within 24 hours</strong> at <strong>${phone}</strong> to confirm your visit.</p>
             <div style="background:#f8fafa;border-left:4px solid #2e9090;padding:16px;margin:24px 0;border-radius:4px">
               <p style="margin:0;font-weight:600;color:#1a3a3a">Your Tour Details</p>
               <p style="margin:8px 0 0;color:#555">Date: ${date}<br/>Time: ${time}</p>
             </div>
             <p style="color:#555;line-height:1.6">Questions? Call us anytime:</p>
             <p style="margin:0"><a href="tel:+12537375302" style="color:#2e9090;font-weight:600">+1 (253) 737-5302</a></p>
             <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
             <p style="color:#999;font-size:12px;margin:0">Attic Adult Family Home LLC &middot; Auburn, WA &middot; <a href="mailto:atticafh25@gmail.com" style="color:#999">atticafh25@gmail.com</a></p>
           </div>
         </div>`
      : `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
           <div style="background:#2e9090;padding:32px 24px;border-radius:8px 8px 0 0;text-align:center">
             <h1 style="color:white;margin:0;font-size:22px">Message Received!</h1>
           </div>
           <div style="background:#fff;padding:32px 24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
             <p style="font-size:16px;color:#333">Hi <strong>${name}</strong>,</p>
             <p style="color:#555;line-height:1.6">Thank you for contacting Attic Adult Family Home. We've received your message and will get back to you <strong>within 24 hours</strong>.</p>
             <p style="color:#555;line-height:1.6">Urgent? Call us directly:</p>
             <p style="margin:0"><a href="tel:+12537375302" style="color:#2e9090;font-weight:600">+1 (253) 737-5302</a></p>
             <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
             <p style="color:#999;font-size:12px;margin:0">Attic Adult Family Home LLC &middot; Auburn, WA &middot; <a href="mailto:atticafh25@gmail.com" style="color:#999">atticafh25@gmail.com</a></p>
           </div>
         </div>`;

    // Owner notification via Resend
    await sendResendEmail(RESEND_API_KEY, {
      from: "Attic Adult Family Home <onboarding@resend.dev>",
      to: ["atticafh25@gmail.com"],
      reply_to: email,
      subject: ownerSubject,
      html: ownerHtml,
    });

    // Confirmation to submitter via Gmail
    if (GMAIL_USER && GMAIL_APP_PASSWORD) {
      await sendViaGmail(GMAIL_USER, GMAIL_APP_PASSWORD, email, replySubject, replyHtml);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
