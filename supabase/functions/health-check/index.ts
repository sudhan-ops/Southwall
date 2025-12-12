import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve((_req: Request) => {
  try {
    // A simple health check: just return a 200 OK response.
    // In a more complex scenario, you might check the database connection.
    return new Response(
      JSON.stringify({ status: "ok", message: "Function is healthy" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Health check failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ status: "error", message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
