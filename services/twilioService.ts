// services/twilioService.ts
import { TWILIO_SMS_NUMBER, TWILIO_WHATSAPP_NUMBER } from '../constants';
import type { Booking, Performer } from '../types';

// --- SIMULATION HELPERS ---
// In a real app, these would call the Twilio Node.js library on a secure backend.
const sendSms = (to: string, body: string) => {
  console.log(`%c[Twilio SMS Simulation]
%cTo: %c${to}
%cFrom: %c${TWILIO_SMS_NUMBER}
%cBody: %c${body}`,
"font-weight: bold; color: #6366f1;", // purple-500
"", "font-weight: bold;",
"", "font-weight: bold;",
"", "font-weight: bold;"
  );
};

const sendWhatsApp = (to: string, body: string) => {
   console.log(`%c[Twilio WhatsApp Simulation]
%cTo: %c${to}
%cFrom: %c${TWILIO_WHATSAPP_NUMBER}
%cBody: %c${body}`,
"font-weight: bold; color: #22c55e;", // green-500
"", "font-weight: bold;",
"", "font-weight: bold;",
"", "font-weight: bold;"
  );
};

// --- EXPORTED SERVICE METHODS ---
export const twilioService = {
  // Notification for a new booking request
  notifyClientOfBookingRequest(booking: Booking): void {
    const message = `Flavor Entertainers: Your booking request for ${booking.event_type} with ${booking.performer?.name} has been sent! We'll notify you of updates.`;
    sendSms(booking.client_phone, message);
  },
  
  notifyPerformerOfBookingRequest(booking: Booking, performer: Performer): void {
    const message = `Flavor Entertainers: New booking request!\nClient: ${booking.client_name}\nEvent: ${booking.event_type}\nDate: ${new Date(booking.event_date).toLocaleDateString()}\nPlease log in to accept or decline.`;
    if (performer.phone) {
        sendWhatsApp(performer.phone, message);
    }
  },

  // Generic status updates
  notifyClientOfBookingUpdate(booking: Booking, updateMessage: string): void {
    const message = `Flavor Entertainers Update: ${updateMessage}`;
    sendSms(booking.client_phone, message);
  },

  notifyPerformerOfBookingUpdate(booking: Booking, performer: Performer, updateMessage: string): void {
    const message = `Flavor Entertainers Update: ${updateMessage}`;
     if (performer.phone) {
        sendWhatsApp(performer.phone, message);
    }
  },
  
  // Specific, sensitive update after confirmation
  notifyPerformerOfConfirmedBookingDetails(booking: Booking, performer: Performer): void {
      const message = `🔥 BOOKING CONFIRMED! 🔥\nYour event with ${booking.client_name} is locked in.\n\nEvent Details:\nDate: ${new Date(booking.event_date).toLocaleDateString()}, ${booking.event_time}\nAddress: ${booking.event_address}\n\nClient Contact:\nPhone: ${booking.client_phone}\n\nThis information is confidential. Please contact the client closer to the event date to confirm arrival details.`;
      if (performer.phone) {
          sendWhatsApp(performer.phone, message);
      }
  },

  // Notifications for new direct messages
  notifyClientOfNewMessage(booking: Booking): void {
    const message = `You have a new message from ${booking.performer?.name} regarding your booking for ${booking.event_type}. Please log in to your dashboard to view and reply.`;
    sendSms(booking.client_phone, message);
  },
  
  notifyPerformerOfNewMessage(booking: Booking, performer: Performer): void {
    const message = `You have a new message from ${booking.client_name} regarding your booking on ${new Date(booking.event_date).toLocaleDateString()}. Please log in to your dashboard to view and reply.`;
    if (performer.phone) {
        sendWhatsApp(performer.phone, message);
    }
  }
};
