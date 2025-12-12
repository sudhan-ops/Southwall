import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const { user_email, user_name } = await req.json();

    if (!user_email || !user_name) {
      return new Response(
        JSON.stringify({
          error: "Missing user_email or user_name in request body",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const USE_MOCK_EMAIL = Deno.env.get("USE_MOCK_EMAIL") === "true";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    });

    let emailSent = false;
    let emailServiceResponse = "Mock email sent";

    if (USE_MOCK_EMAIL) {
      console.log(
        `MOCK EMAIL: Sending welcome email to ${user_email} for ${user_name}`,
      );
      emailSent = true;
    } else {
      if (!SENDGRID_API_KEY) {
        throw new Error(
          "Missing SENDGRID_API_KEY environment variable for non-mock email sending.",
        );
      }

      // Mocking SendGrid API call
      const sendGridResponse = await fetch(
        "https://api.sendgrid.com/v3/mail/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: user_email }] }],
            from: { email: "welcome@example.com" },
            subject: "Welcome to Our Service!",
            content: [{
              type: "text/plain",
              value: `Hello ${user_name},\n\nWelcome to our service!`,
            }],
          }),
        },
      );

      if (!sendGridResponse.ok) {
        const errorBody = await sendGridResponse.text();
        throw new Error(
          `Failed to send email via SendGrid: ${sendGridResponse.status} - ${errorBody}`,
        );
      }

      emailSent = true;
      emailServiceResponse = "Email sent via SendGrid";
    }

    // Write a user_activity entry
    const { error: logError } = await supabase.from("user_activity").insert([
      {
        user_id: null, // User ID is not available in this context as per code
        event_type: "welcome_email_sent",
        details: { user_email, user_name, emailSent, emailServiceResponse },
      },
    ]);

    if (logError) {
      console.error("Supabase activity log error:", logError);
      // Do not return an error, as email might have been sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { emailSent, emailServiceResponse },
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Edge Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
