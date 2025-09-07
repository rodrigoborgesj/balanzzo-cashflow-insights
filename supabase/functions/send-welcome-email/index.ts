import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId?: string;
  email?: string;
  companyName?: string;
  sendToExisting?: boolean;
  processPending?: boolean;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const body: WelcomeEmailRequest = await req.json();
    const { userId, email, companyName, sendToExisting, processPending } = body;

    console.log("Welcome email request:", { userId, email, companyName, sendToExisting, processPending });

    // If sendToExisting is true, process all users who haven't received welcome emails
    if (sendToExisting) {
      return await sendToExistingUsers();
    }

    // If processPending is true, process all pending welcome emails
    if (processPending) {
      return await processPendingWelcomeEmails();
    }

    // Single user email sending
    if (!userId && !email) {
      return new Response(
        JSON.stringify({ error: "userId or email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let targetEmail = email;
    let targetCompanyName = companyName;

    // If we have userId but no email/company, fetch from database
    if (userId && !email) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser.user) {
        targetEmail = authUser.user.email;
      }

      // Get company name from profiles/companies
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const { data: company } = await supabase
        .from('companies')
        .select('company_name')
        .eq('user_id', userId)
        .single();

      targetCompanyName = company?.company_name || profile?.full_name || 'Empresa';
    }

    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: "Could not determine email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if welcome email was already sent
    if (userId) {
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('email_type', 'welcome')
        .eq('success', true)
        .single();

      if (existingLog) {
        console.log(`Welcome email already sent to user ${userId}`);
        return new Response(
          JSON.stringify({ message: "Welcome email already sent" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Send the welcome email
    const result = await sendWelcomeEmail(targetEmail, targetCompanyName || 'Empresa');

    // Log the email sending result
    if (userId) {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_type: 'welcome',
          email_address: targetEmail,
          success: result.success,
          error_message: result.error || null
        });
    }

    console.log("Welcome email result:", result);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendWelcomeEmail(email: string, companyName: string) {
  try {
    const emailResult = await resend.emails.send({
      from: 'Rodrigo Borges - Balanzzo <onboarding@resend.dev>',
      to: [email],
      subject: 'Bem-vindo ao sistema financeiro da Balanzzo 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Olá, ${companyName}!</h2>
          
          <p>Seja muito bem-vindo ao sistema financeiro da Balanzzo 🚀</p>
          
          <p>Preparamos um ambiente prático e intuitivo para ajudar você a cuidar das finanças do seu negócio sem burocracia.</p>
          
          <p>A gente sabe que, quando a empresa ainda é pequena, olhar para os números pode ser um desafio. Por isso, nossa missão é tirar você das planilhas e trazer mais organização, praticidade e tempo livre.</p>
          
          <p>Assim, cada minuto dedicado ao sistema vai entregar dados valiosos e uma experiência financeira muito mais leve.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://www.balanzzo.com.br" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              👉 Acesse o sistema agora
            </a>
          </div>
          
          <p>E, se precisar de ajuda, fale com o nosso time de atendimento pelo WhatsApp <strong>(51) 99487-6689</strong>. Estamos prontos para atender você!</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0;"><strong>Atenciosamente,</strong></p>
            <p style="margin: 5px 0;"><strong>Rodrigo Borges</strong></p>
            <p style="margin: 0; color: #666;">Fundador da Balanzzo</p>
          </div>
        </div>
      `,
    });

    return {
      success: true,
      messageId: emailResult.data?.id,
      message: "Welcome email sent successfully"
    };

  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to send welcome email"
    };
  }
}

async function sendToExistingUsers() {
  try {
    console.log("Processing existing users for welcome emails...");

    // Get all users who don't have a successful welcome email log
    const { data: usersWithoutWelcome, error: queryError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        companies!inner(company_name)
      `)
      .not('id', 'in', `(
        SELECT user_id 
        FROM email_logs 
        WHERE email_type = 'welcome' AND success = true
      )`);

    if (queryError) {
      console.error("Error querying users:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to query users", details: queryError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!usersWithoutWelcome || usersWithoutWelcome.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found without welcome emails", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${usersWithoutWelcome.length} users without welcome emails`);

    let sentCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of usersWithoutWelcome) {
      try {
        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
        
        if (!authUser.user?.email) {
          console.error(`No email found for user ${user.id}`);
          errorCount++;
          continue;
        }

        const companyName = user.companies?.company_name || user.full_name || 'Empresa';
        const result = await sendWelcomeEmail(authUser.user.email, companyName);

        // Log the result
        await supabase
          .from('email_logs')
          .insert({
            user_id: user.id,
            email_type: 'welcome',
            email_address: authUser.user.email,
            success: result.success,
            error_message: result.error || null
          });

        if (result.success) {
          sentCount++;
          console.log(`Welcome email sent to ${authUser.user.email}`);
        } else {
          errorCount++;
          console.error(`Failed to send email to ${authUser.user.email}:`, result.error);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Batch welcome email sending completed",
        totalUsers: usersWithoutWelcome.length,
        sentCount,
        errorCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in sendToExistingUsers:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process existing users", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

async function processPendingWelcomeEmails() {
  try {
    console.log("Processing pending welcome emails...");

    // Get all pending welcome emails
    const { data: pendingEmails, error: queryError } = await supabase
      .from('email_logs')
      .select('id, user_id, email_address')
      .eq('email_type', 'welcome_pending')
      .eq('success', false);

    if (queryError) {
      console.error("Error querying pending emails:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to query pending emails", details: queryError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending welcome emails found", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${pendingEmails.length} pending welcome emails`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each pending email
    for (const pendingEmail of pendingEmails) {
      try {
        // Get company name from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', pendingEmail.user_id)
          .single();

        const { data: company } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', pendingEmail.user_id)
          .single();

        const companyName = company?.company_name || profile?.full_name || 'Empresa';
        const result = await sendWelcomeEmail(pendingEmail.email_address, companyName);

        if (result.success) {
          // Remove the pending entry and add successful log
          await supabase
            .from('email_logs')
            .delete()
            .eq('id', pendingEmail.id);

          await supabase
            .from('email_logs')
            .insert({
              user_id: pendingEmail.user_id,
              email_type: 'welcome',
              email_address: pendingEmail.email_address,
              success: true,
              error_message: null
            });

          processedCount++;
          console.log(`Processed pending email for user ${pendingEmail.user_id}`);
        } else {
          // Update the pending entry with error
          await supabase
            .from('email_logs')
            .update({ error_message: result.error })
            .eq('id', pendingEmail.id);

          errorCount++;
          console.error(`Failed to process pending email for user ${pendingEmail.user_id}:`, result.error);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing pending email ${pendingEmail.id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Pending welcome emails processing completed",
        totalPending: pendingEmails.length,
        processedCount,
        errorCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in processPendingWelcomeEmails:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process pending welcome emails", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

serve(handler);