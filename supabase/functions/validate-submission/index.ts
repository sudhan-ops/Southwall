import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Ajv from "npm:ajv@8.12.0";

const ajv = new Ajv();

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const { submission_type, submission_data } = await req.json();

    if (!submission_type || !submission_data) {
      return new Response(
        JSON.stringify({
          error: "Missing submission_type or submission_data in request body",
        }),
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

    // 1. Fetch validation rule (JSON schema)
    const { data: ruleData, error: ruleError } = await supabase
      .from("validation_rules")
      .select("schema")
      .eq("submission_type", submission_type)
      .single();

    if (ruleError) {
      console.error("Supabase error fetching rule:", ruleError);
      return new Response(
        JSON.stringify({
          error:
            `Failed to fetch validation rule for type ${submission_type}: ${ruleError.message}`,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    if (!ruleData) {
      return new Response(
        JSON.stringify({
          error:
            `No validation rule found for submission type: ${submission_type}`,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    const schema = ruleData.schema;

    // 2. Validate submission data using AJV
    const validate = ajv.compile(schema);
    const isValid = validate(submission_data);

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validate.errors,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 3. Validation successful
    return new Response(
      JSON.stringify({ success: true, message: "Submission data is valid" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "An unknown error occurred";
    console.error("Edge Function error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
