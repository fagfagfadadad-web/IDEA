import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
  type: 'order_created' | 'order_completed' | 'message_received' | 'proposal_accepted' | 'payment_released' | 'dispute_created';
  orderId?: string;
  proposalId?: string;
}

export const useSendEmailNotification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { error: showErrorToast } = useToast();

  const sendEmail = async (emailData: EmailNotificationData) => {
    setIsLoading(true);
    try {
      console.log('Sending email notification:', emailData);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        throw new Error(error.message || 'Failed to send email');
      }

      console.log('Email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Email sending failed:', error);
      showErrorToast('Failed to send email notification');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendEmail,
    isLoading
  };
};

export const useEmailTemplates = () => {
  const getOrderCreatedTemplate = (orderData: {
    clientName: string;
    gigTitle: string;
    amount: number;
    paymentToken: string;
    orderId: string;
  }) => {
    return {
      subject: `New Order Created - ${orderData.gigTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Created</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Order Created!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Order Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p><strong>Gig:</strong> ${orderData.gigTitle}</p>
              <p><strong>Client:</strong> ${orderData.clientName}</p>
              <p><strong>Amount:</strong> ${orderData.amount} ${orderData.paymentToken}</p>
              <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://xidea.app/orders/${orderData.orderId}" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
              This is an automated notification from IDEA Platform.<br>
              Visit <a href="https://xidea.app">xidea.app</a> to manage your orders.
            </p>
          </div>
        </body>
        </html>
      `
    };
  };

  const getMessageReceivedTemplate = (messageData: {
    senderName: string;
    gigTitle: string;
    messagePreview: string;
    orderId: string;
  }) => {
    return {
      subject: `New Message - ${messageData.gigTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Message</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💬 New Message</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Message Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
              <p><strong>From:</strong> ${messageData.senderName}</p>
              <p><strong>Order:</strong> ${messageData.gigTitle}</p>
              <p><strong>Message:</strong></p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; font-style: italic;">
                ${messageData.messagePreview}
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://xidea.app/orders/${messageData.orderId}" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reply to Message
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
              This is an automated notification from IDEA Platform.<br>
              Visit <a href="https://xidea.app">xidea.app</a> to manage your orders.
            </p>
          </div>
        </body>
        </html>
      `
    };
  };

  const getPaymentReleasedTemplate = (paymentData: {
    providerName: string;
    gigTitle: string;
    amount: number;
    paymentToken: string;
    orderId: string;
  }) => {
    return {
      subject: `Payment Released - ${paymentData.gigTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Released</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💰 Payment Released!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Payment Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p><strong>Gig:</strong> ${paymentData.gigTitle}</p>
              <p><strong>Provider:</strong> ${paymentData.providerName}</p>
              <p><strong>Amount:</strong> ${paymentData.amount} ${paymentData.paymentToken}</p>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Payment Released</span></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://xidea.app/orders/${paymentData.orderId}" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
              This is an automated notification from IDEA Platform.<br>
              Visit <a href="https://xidea.app">xidea.app</a> to manage your orders.
            </p>
          </div>
        </body>
        </html>
      `
    };
  };

  return {
    getOrderCreatedTemplate,
    getMessageReceivedTemplate,
    getPaymentReleasedTemplate
  };
};