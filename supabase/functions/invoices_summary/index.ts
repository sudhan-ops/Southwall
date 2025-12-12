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
    if (req.method !== "GET") {
      return errorResponse("Method Not Allowed", 405);
    }

    // 2. Auth Check and Supabase Client Initialization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Authorization header missing", 401);
    }

    const token = authHeader.replace("Bearer ", "");

    // Initialize Supabase client with the user's token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    );

    // Get the authenticated user's ID
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser();

    if (userError || !user) {
      return errorResponse("Invalid or expired token", 401);
    }

    // 3. Core Logic: Fetch and aggregate invoice data for the user
    // Fixed: 'id' is uuid (string), not number, in the database schema.
    type Invoice = {
      id: string;
      period_start: string;
      period_end: string;
      amount: number;
      status: string;
    };

    const { data, error: dbError } = await supabaseClient
      .from("invoices")
      .select("id, period_start, period_end, amount, status")
      .eq("user_id", user.id)
      .order("period_end", { ascending: false });

    if (dbError) {
      console.error("Supabase DB error:", dbError);
      return errorResponse(
        `Database operation failed: ${dbError.message}`,
        500,
      );
    }

    const invoices: Invoice[] = (data as Invoice[] | null) ?? [];

    // Calculate summary (e.g., total amount, number of invoices)
    const total_invoices = invoices.length;
    const total_amount_billed = invoices.reduce(
      (sum: number, invoice: Invoice) => sum + invoice.amount,
      0,
    );

    // 4. Success Response
    return new Response(
      JSON.stringify({
        user_id: user.id,
        summary: {
          total_invoices,
          total_amount_billed,
        },
        invoices: invoices,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error("Edge function error:", error);
    return errorResponse(
      (error as Error).message || "Internal Server Error",
      500,
    );
  }
});
