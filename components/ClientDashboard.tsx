import React, { useState, useMemo } from 'react';
import { Booking, Communication, Role } from '../types';
import { Calendar, Clock, User, MessageCircle, MapPin, Wallet, Search, LogOut, Briefcase, LoaderCircle, AlertTriangle, CheckCircle, Archive, History, Info } from 'lucide-react';
import ChatDialog from './ChatDialog';
import { calculateBookingCost } from '../utils/bookingUtils';
import InputField from './InputField';

interface ClientDashboardProps {
  bookings: Booking[];
  communications: Communication[];
  onBrowsePerformers: () => void;
  onSendMessage: (booking: Booking, sender: { name: string; role: 'user' }, message: string) => Promise<void>;
  onMarkMessagesAsRead: (bookingId: string, recipientName: string) => Promise<void>;
}

const statusConfig: Record<Booking['status'], {
  color: string;
  borderColor: string;
  Icon: React.ElementType;
  title: string;
  description: string;
}> = {
  pending_performer_acceptance: { color: 'text-purple-400', borderColor: 'border-purple-500', Icon: LoaderCircle, title: "Awaiting Performer", description: "We're waiting for the performer to accept your request." },
  pending_vetting: { color: 'text-yellow-400', borderColor: 'border-yellow-500', Icon: LoaderCircle, title: "Pending Admin Review", description: "The performer accepted! Our admin team is now reviewing your application." },
  deposit_pending: { color: 'text-orange-400', borderColor: 'border-orange-500', Icon: Wallet, title: "Action Required: Pay Deposit", description: "Your booking is approved! Please pay the deposit to confirm your spot." },
  pending_deposit_confirmation: { color: 'text-blue-400', borderColor: 'border-blue-500', Icon: LoaderCircle, title: "Confirming Deposit", description: "We've received your payment confirmation and our team is verifying it." },
  confirmed: { color: 'text-green-400', borderColor: 'border-green-500', Icon: CheckCircle, title: "Booking Confirmed!", description: "You're all set! The performer is booked for your event." },
  rejected: { color: 'text-red-400', borderColor: 'border-red-500', Icon: AlertTriangle, title: "Booking Rejected", description: "Unfortunately, this booking could not be completed at this time." },
};

const ClientDashboard: React.FC<ClientDashboardProps> = ({ bookings, communications, onBrowsePerformers, onSendMessage, onMarkMessagesAsRead }) => {
  const [clientEmail, setClientEmail] = useState<string | null>(() => localStorage.getItem('clientEmail'));
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailInput) {
      setError('Please enter an email address.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => { // Simulate network delay for lookup
      const foundBookings = bookings.some(b => b.client_email.toLowerCase() === emailInput.toLowerCase());
      if (foundBookings) {
        localStorage.setItem('clientEmail', emailInput);
        setClientEmail(emailInput);
      } else {
        setError('No bookings found for this email address.');
      }
      setIsLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('clientEmail');
    setClientEmail(null);
    setEmailInput('');
  };

  const handleOpenChat = (booking: Booking) => {
      setActiveChatBooking(booking);
      onMarkMessagesAsRead(booking.id, booking.client_name);
  };

  const handleSendMessageInChat = (messageText: string) => {
      if (!activeChatBooking) return Promise.resolve();
      return onSendMessage(activeChatBooking, { name: activeChatBooking.client_name, role: 'user' }, messageText);
  };

  const bookingGroups = useMemo(() => {
      if (!clientEmail) return null;
      
      const clientBookings = bookings.filter(b => b.client_email.toLowerCase() === clientEmail.toLowerCase());
      const now = new Date();
      
      return clientBookings.reduce((groups, booking) => {
        const eventDate = new Date(booking.event_date);
        
        if (['pending_performer_acceptance', 'pending_vetting', 'deposit_pending', 'pending_deposit_confirmation'].includes(booking.status)) {
            groups.actionRequired.push(booking);
        } else if (booking.status === 'confirmed' && eventDate >= now) {
            groups.upcoming.push(booking);
        } else {
            groups.past.push(booking);
        }
        return groups;

      }, { actionRequired: [] as Booking[], upcoming: [] as Booking[], past: [] as Booking[] });
  }, [clientEmail, bookings]);

  const unreadMessagesByBooking = useMemo(() => {
    if (!clientEmail) return {};
    const clientBookings = bookings.filter(b => b.client_email.toLowerCase() === clientEmail.toLowerCase());
    const clientName = clientBookings.length > 0 ? clientBookings[0].client_name : '';
    if (!clientName) return {};

    const counts: Record<string, boolean> = {};
    communications.forEach(comm => {
        if (comm.booking_id && comm.recipient === clientName && comm.type === 'direct_message' && !comm.read) {
            counts[comm.booking_id] = true;
        }
    });
    return counts;
  }, [communications, clientEmail, bookings]);

  const activeChatMessages = useMemo(() => {
    if (!activeChatBooking) return [];
    return communications
        .filter(c => c.booking_id === activeChatBooking.id && c.type === 'direct_message')
        .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [activeChatBooking, communications]);
    
  if (!clientEmail) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="card-base !p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold text-white">My Bookings</h1>
            <p className="text-zinc-400 mt-2 mb-6">Enter your email to view your booking history and status.</p>
            <form onSubmit={handleLookup} className="space-y-4">
                <InputField icon={<User />} type="email" name="email" placeholder="Your booking email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required error={error} />
                <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin"/> : <Search className="h-5 w-5"/>}
                    Find My Bookings
                </button>
            </form>
            <div className="my-6 flex items-center text-zinc-500 text-sm">
                <span className="flex-grow border-t border-zinc-700"></span>
                <span className="flex-shrink mx-4">OR</span>
                <span className="flex-grow border-t border-zinc-700"></span>
            </div>
             <button onClick={onBrowsePerformers} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Briefcase className="h-5 w-5" />
                Browse Performers & Services
            </button>
        </div>
      </div>
    );
  }

  const BookingGroup: React.FC<{title: string; bookings: Booking[]; icon: React.ElementType;}> = ({title, bookings, icon: Icon}) => {
    if (bookings.length === 0) return null;
    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Icon className="text-orange-400" /> {title}</h2>
            <div className="grid gap-6">
                {bookings.map(booking => {
                    const { totalCost } = calculateBookingCost(booking.duration_hours, booking.services_requested, 1);
                    const config = statusConfig[booking.status];
                    const hasUnread = !!unreadMessagesByBooking[booking.id];
                    return (
                      <div key={booking.id} className={`card-base !p-0 overflow-hidden flex flex-col md:flex-row border-l-4 ${config.borderColor}`}>
                         <div className="p-6 flex-grow">
                             <h3 className="text-2xl font-bold text-white">{booking.event_type}</h3>
                             <p className="text-sm text-zinc-400 mb-4">with <strong className="text-orange-400">{booking.performer?.name}</strong></p>

                              <div className={`p-3 rounded-lg flex items-start gap-3 mb-4 bg-zinc-900/50`}>
                                <config.Icon className={`h-6 w-6 mt-1 flex-shrink-0 ${config.color} ${config.Icon === LoaderCircle ? 'animate-spin' : ''}`} />
                                <div>
                                    <p className={`font-semibold ${config.color}`}>{config.title}</p>
                                    <p className="text-sm text-zinc-400">{config.description}</p>
                                </div>
                              </div>

                             <div className="text-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mt-2 border-t border-zinc-800 pt-4">
                                <div className="flex items-center gap-2"><Calendar size={16} className="text-orange-500/80"/> {new Date(booking.event_date).toLocaleDateString()} at {booking.event_time}</div>
                                <div className="flex items-center gap-2"><Clock size={16} className="text-orange-500/80"/> {booking.duration_hours} hour{booking.duration_hours > 1 ? 's' : ''}</div>
                                <div className="flex items-center gap-2 col-span-full"><MapPin size={16} className="text-orange-500/80"/> {booking.event_address}</div>
                             </div>
                         </div>
                         <div className="bg-zinc-900/50 p-6 flex flex-col justify-between items-center md:items-end md:border-l border-zinc-800 md:min-w-[220px]">
                            <div className="text-center md:text-right mb-4 w-full">
                               <p className="text-zinc-400 text-sm flex items-center md:justify-end gap-1"><Wallet size={14}/> Total Cost</p>
                               <p className="text-3xl font-bold text-white">${totalCost.toFixed(2)}</p> 
                            </div>
                            {booking.status === 'confirmed' && (
                                <button onClick={() => handleOpenChat(booking)} className="relative btn-primary w-full flex items-center justify-center gap-2 text-sm px-4 py-2">
                                    <MessageCircle size={16} /> Message Performer
                                    {hasUnread && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                        </span>
                                    )}
                                </button>
                            )}
                         </div>
                      </div>
                    );
                })}
            </div>
        </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-12">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">My Bookings</h1>
          <p className="text-zinc-400">Viewing bookings for: <strong className="text-white">{clientEmail}</strong></p>
        </div>
        <button onClick={handleLogout} className="bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            Not you? Change email
        </button>
      </div>
      
      {bookingGroups && (bookingGroups.actionRequired.length > 0 || bookingGroups.upcoming.length > 0 || bookingGroups.past.length > 0) ? (
        <div className="space-y-12">
            <BookingGroup title="Action Required" bookings={bookingGroups.actionRequired} icon={AlertTriangle} />
            <BookingGroup title="Upcoming Confirmed" bookings={bookingGroups.upcoming} icon={CheckCircle} />
            <BookingGroup title="Past & Archived" bookings={bookingGroups.past} icon={History} />
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <h2 className="text-2xl font-semibold text-white">No Bookings Found</h2>
            <p className="text-zinc-500 my-4 max-w-md mx-auto">It looks like there are no bookings associated with this email address yet. Ready to find the perfect entertainment?</p>
             <button onClick={onBrowsePerformers} className="btn-primary flex items-center justify-center gap-2 mx-auto mt-6">
                <Briefcase className="h-5 w-5" />
                Book a Performer
            </button>
        </div>
      )}

      {activeChatBooking && (
          <ChatDialog
              isOpen={!!activeChatBooking}
              onClose={() => setActiveChatBooking(null)}
              booking={activeChatBooking}
              currentUser={{ name: activeChatBooking.client_name }}
              messages={activeChatMessages}
              onSendMessage={handleSendMessageInChat}
          />
      )}
    </div>
  );
};

export default ClientDashboard;