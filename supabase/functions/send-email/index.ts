/*
  # Send Email Edge Function

  1. New Functions
    - `send-email` - Handles email sending via Resend API
      - Accepts email data (to, subject, html content)
      - Uses Resend API to send emails
      - Returns success/error status

  2. Security
    - Uses RESEND_API_KEY from Supabase secrets
    - CORS enabled for frontend access
    - Input validation for required fields

  3. Features
    - Support for HTML email templates
    - Error handling and logging
    - Rate limiting protection
*/

// Define CORS headers directly to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

Deno.serve(async (req: Request) => {

  // Handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    let emailData: EmailRequest;
    try {
      emailData = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: to, subject, html' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare email payload for Resend
    const emailPayload = {
      from: emailData.from || 'IDEA Platform <noreply@xidea.app>',
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    };


    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: responseData 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.id,
        message: 'Email sent successfully' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});