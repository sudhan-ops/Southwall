import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Task {
  id: string;
  name: string;
  due_date: string | null;
  status: string;
  escalation_status: string;
  escalation_level1_user_id: string | null;
  escalation_level1_duration_days: number | null;
  escalation_level2_user_id: string | null;
  escalation_level2_duration_days: number | null;
  escalation_email: string | null;
  escalation_email_duration_days: number | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
}

interface Notification {
  user_id: string;
  message: string;
  type: string;
  link_to: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all tasks that are not done and have a due date
    const { data: tasks, error: fetchError } = await supabaseClient
      .from("tasks")
      .select("*")
      .neq("status", "Done")
      .not("due_date", "is", null);

    if (fetchError) throw fetchError;

    const updatedTasks: Task[] = [];
    const newNotifications: Notification[] = [];

    for (const task of tasks || []) {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const daysSinceDue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      let newEscalationStatus = task.escalation_status || "None";
      let shouldUpdate = false;
      let notificationUserId: string | null = null;
      let notificationMessage: string | null = null;

      // Level 1 escalation check
      if (
        task.escalation_status === "None" &&
        task.escalation_level1_user_id &&
        task.escalation_level1_duration_days !== null &&
        daysSinceDue >= task.escalation_level1_duration_days
      ) {
        newEscalationStatus = "Level 1";
        shouldUpdate = true;
        notificationUserId = task.escalation_level1_user_id;
        notificationMessage =
          `Task "${task.name}" has been escalated to you (Level 1).`;
      }

      // Level 2 escalation check
      if (
        task.escalation_status === "Level 1" &&
        task.escalation_level2_user_id &&
        task.escalation_level2_duration_days !== null
      ) {
        const level1StartDay = task.escalation_level1_duration_days || 0;
        const level2TriggerDay = level1StartDay +
          task.escalation_level2_duration_days;
        if (daysSinceDue >= level2TriggerDay) {
          newEscalationStatus = "Level 2";
          shouldUpdate = true;
          notificationUserId = task.escalation_level2_user_id;
          notificationMessage =
            `Task "${task.name}" has been escalated to you (Level 2).`;
        }
      }

      // Email escalation check (final step)
      if (
        task.escalation_status === "Level 2" &&
        task.escalation_email &&
        task.escalation_email_duration_days !== null
      ) {
        const level1Days = task.escalation_level1_duration_days || 0;
        const level2Days = task.escalation_level2_duration_days || 0;
        const emailTriggerDay = level1Days + level2Days +
          task.escalation_email_duration_days;
        if (daysSinceDue >= emailTriggerDay) {
          newEscalationStatus = "Email Sent";
          shouldUpdate = true;
          // TODO: Implement actual email sending here if needed
          console.log(
            `Would send email to ${task.escalation_email} for task ${task.name}`,
          );
        }
      }

      if (shouldUpdate) {
        const { data: updatedTask, error: updateError } = await supabaseClient
          .from("tasks")
          .update({ escalation_status: newEscalationStatus })
          .eq("id", task.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Failed to update task ${task.id}:`, updateError);
        } else {
          updatedTasks.push(updatedTask);
        }

        // Create notification for the escalation recipient
        if (notificationUserId && notificationMessage) {
          newNotifications.push({
            user_id: notificationUserId,
            message: notificationMessage,
            type: "task_escalated",
            link_to: "/tasks",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        updated_tasks: updatedTasks,
        new_notifications: newNotifications,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error running escalations:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: message,
        updated_tasks: [],
        new_notifications: [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
