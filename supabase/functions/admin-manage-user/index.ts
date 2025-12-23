// declare const Deno: any;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, userId, password, email } = await req.json();

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: action, userId" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    if (action === "change-password") {
      if (!password) {
        return new Response(
          JSON.stringify({
            error: "Password is required for change-password action",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          },
        );
      }
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
      });
      if (error) throw error;
      return new Response(
        JSON.stringify({ message: "Password updated successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    if (action === "reset-password") {
      if (!email) {
        return new Response(
          JSON.stringify({
            error: "Email is required for reset-password action",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          },
        );
      }
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
      });
      // Alternatively, we could use resetPasswordForEmail but admin.generateLink gives more control/certainty for admin actions.
      // However, simplified:
      const { error: resetError } = await supabaseAdmin.auth.admin
        .resetPasswordForEmail(email);
      if (resetError) throw resetError;

      return new Response(
        JSON.stringify({ message: "Reset link sent successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error: any) {
    console.error("Error in admin-manage-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
