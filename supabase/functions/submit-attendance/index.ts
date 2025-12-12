import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins for now, should be restricted in production
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { site_id } = await req.json();

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!site_id || typeof site_id !== "string" || !uuidRegex.test(site_id)) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid or missing site_id in request body. Must be a valid UUID.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // Changed to SUPABASE_SERVICE_ROLE_KEY for standardization
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
      );
    }

    // Use the service role client to verify the JWT and get the user ID
    const serviceRoleSupabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    const { data: userData, error: userError } = await serviceRoleSupabase.auth
      .getUser(jwt);

    if (userError || !userData.user) {
      console.error("JWT verification error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const authUserId = userData.user.id;

    // Map auth.users.id (authUserId) to public.profiles.id (profileId)
    const { data: profileData, error: profileError } = await serviceRoleSupabase
      .from("profiles")
      .select("id")
      .eq("auth_uid", authUserId)
      .single();

    if (profileError || !profileData) {
      console.error("Profile lookup error:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found for authenticated user." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    const profileId = profileData.id;
    const now = new Date().toISOString();

    // Simple INSERT for every submission as requested by the user
    // Corrected column names to match the public.attendance table schema
    const { data, error } = await serviceRoleSupabase.from("attendance").insert(
      [
        { site_id: site_id, profile_id: profileId, checkin_at: now },
      ],
    ).select();

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, data: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Edge Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
