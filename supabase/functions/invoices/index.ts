import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Helper function for error response
const errorResponse = (message: string, status: number = 400) => {
  return new Response(JSON.stringify({ error: message, code: status }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

serve(async (req: Request) => {
  try {
    // 1. Method Check
    if (req.method !== "POST") {
      return errorResponse("Method Not Allowed", 405);
    }

    // 2. Supabase Client Initialization
    // Changed SERVICE_ROLE_KEY to SUPABASE_SERVICE_ROLE_KEY (standard platform env var)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 3. Input Validation
    const { user_id, period_start, period_end } = await req.json();
    if (!user_id || !period_start || !period_end) {
      return errorResponse(
        "Missing required fields: user_id, period_start, period_end.",
        400,
      );
    }

    // 4. Core Logic
    console.log(
      `Generating invoice for user ${user_id} from ${period_start} to ${period_end}`,
    );

    // Fetch user data
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("email, name") // Changed 'full_name' to 'name' based on known schema
      .eq("id", user_id)
      .single();

    // Proceeding even if user fetch fails? No, return 404.
    if (userError) {
      console.error("Supabase user fetch error:", userError);
      return errorResponse(
        `Could not find user data: ${userError.message}`,
        404,
      );
    }

    // Placeholder: Calculate total amount
    const total_amount = Math.floor(Math.random() * 10000) + 1000;

    // Insert invoice record
    const { data: invoiceData, error: invoiceError } = await supabaseClient
      .from("invoices")
      .insert([{
        user_id,
        period_start,
        period_end,
        amount: total_amount,
        status: "generated",
      }])
      .select()
      .single();

    if (invoiceError) {
      console.error("Supabase invoice insert error:", invoiceError);
      return errorResponse(
        `Database operation failed: ${invoiceError.message}`,
        500,
      );
    }

    // 5. Success Response
    return new Response(
      JSON.stringify({
        message: "Invoice generation triggered successfully",
        invoice: invoiceData,
        user: userData,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Edge function error:", error);
    return errorResponse(error.message || "Internal Server Error", 500);
  }
});
