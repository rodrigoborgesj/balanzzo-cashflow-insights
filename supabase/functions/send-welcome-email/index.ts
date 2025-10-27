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
      from: 'Balanzzo <contato@balanzzo.com.br>',
      to: [email],
      subject: 'Seja bem-vindo à Balanzzo 🚀',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Bem-vindo à Balanzzo</title>
          <style>
            body {
              font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background-color: #F5F5F5;
              margin: 0;
              padding: 0;
              color: #1A3423;
            }
            .container {
              max-width: 520px;
              margin: 40px auto;
              background-color: #FFFFFF;
              border-radius: 12px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.05);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              margin-bottom: 24px;
            }
            .logo img {
              max-width: 120px;
              height: auto;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 16px;
              color: #1A3423;
              font-weight: 600;
            }
            p {
              font-size: 15px;
              color: #333333;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background-color: #1A3423;
              color: #E4F8CA;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              transition: background-color 0.3s ease;
              font-size: 15px;
            }
            .button:hover {
              background-color: #A9C7A1;
              color: #1A3423;
            }
            .secondary-text {
              margin-top: 24px;
              font-size: 14px;
              color: #555;
            }
            .footer {
              font-size: 13px;
              color: #777;
              margin-top: 32px;
            }
            .footer a {
              color: #1A3423;
              text-decoration: none;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            
            /* Responsividade */
            @media only screen and (max-width: 600px) {
              .container {
                margin: 20px;
                padding: 30px 20px;
              }
              h1 {
                font-size: 22px;
              }
              p {
                font-size: 14px;
              }
              .button {
                padding: 10px 20px;
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://www.balanzzo.com.br/logo.png" alt="Balanzzo" />
            </div>
            <h1>Bem-vindo à Balanzzo!</h1>
            <p>
              Estamos muito felizes em ter você com a gente. 🎉<br><br>
              Agora você tem acesso a uma forma simples e inteligente de cuidar das finanças do seu negócio.<br><br>
              Acesse sua conta e comece a explorar as ferramentas que criamos para te ajudar a ter mais clareza e controle financeiro.
            </p>
            <a href="https://www.balanzzo.com.br/login" class="button">Acessar minha conta</a>
            <p class="secondary-text">
              Qualquer dúvida, é só responder este e-mail ou entrar em contato pelo nosso suporte.
            </p>
            <div class="footer">
              Balanzzo © Todos os direitos reservados — <a href="https://www.balanzzo.com.br">www.balanzzo.com.br</a>
            </div>
          </div>
        </body>
        </html>
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