import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const { enrollment_id } = await req.json();

    if (!enrollment_id) {
      return new Response(
        JSON.stringify({ error: "Missing enrollment_id in request body" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    // 1. Compose invoice record (mock data for now)
    const invoiceData = {
      enrollment_id: enrollment_id,
      amount: Math.floor(Math.random() * 10000) / 100, // Random amount
      currency: "USD",
      status: "generated",
      generated_at: new Date().toISOString(),
    };

    // 2. Write invoice metadata to invoices table
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([invoiceData])
      .select()
      .single();

    if (invoiceError) {
      console.error("Supabase invoice insert error:", invoiceError);
      return new Response(JSON.stringify({ error: invoiceError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 3. Optionally upload a placeholder PDF to invoices bucket
    const placeholderPdfContent = `Invoice for Enrollment ID: ${enrollment_id}`;
    const fileName = `invoice_${invoice.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("invoices") // Assuming an 'invoices' bucket exists
      .upload(fileName, placeholderPdfContent, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.warn(
        "Could not upload placeholder PDF (this is optional):",
        uploadError.message,
      );
      // Do not return an error, as PDF upload is optional
    }

    // 4. Return a signed URL that expires (e.g., 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from("invoices")
      .createSignedUrl(fileName, 3600); // 1 hour expiration

    if (signedUrlError) {
      console.error("Supabase create signed URL error:", signedUrlError);
      return new Response(JSON.stringify({ error: signedUrlError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { invoice, signedUrl: signedUrlData.signedUrl },
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Edge Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
