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

    // 2. Supabase Client Initialization (for RLS-enabled operations)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 3. Authentication/Authorization Check
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return errorResponse("Unauthorized: User not found.", 401);
    }

    // 4. Input Validation
    const { employee_id, check_in_time } = await req.json();
    if (!employee_id || !check_in_time) {
      return errorResponse("Missing required fields: employee_id, check_in_time.", 400);
    }

    // 5. Core Logic
    // Adapted to 'attendance_events' schema
    const { data, error } = await supabaseClient
      .from("attendance_events")
      .insert([{ 
        user_id: user.id,
        timestamp: check_in_time,
        type: 'check_in' // Defaulting to check_in based on context
      }])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return errorResponse(`Database operation failed: ${error.message}`, 500);
    }

    // 6. Success Response
    return new Response(JSON.stringify({ message: "Attendance recorded successfully", data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Edge function error:", error);
    return errorResponse(error.message || "Internal Server Error", 500);
  }
});
