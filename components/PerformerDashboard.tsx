import React, { useState, useMemo } from 'react';
import { Performer, PerformerStatus, Booking, Communication } from '../types';
import { ToggleLeft, ToggleRight, Radio, Calendar, User, Clock, ShieldAlert, MessageSquare, Inbox, Check, X, Users, Timer, LoaderCircle, MessageCircle } from 'lucide-react';
import ChatDialog from './ChatDialog';

interface PerformerDashboardProps {
  performer: Performer;
  bookings: Booking[];
  communications: Communication[];
  onToggleStatus: (status: PerformerStatus) => Promise<void>;
  onViewDoNotServe: () => void;
  onBookingDecision: (bookingId: string, decision: 'accepted' | 'declined', eta?: number) => Promise<void>;
  onSendMessage: (booking: Booking, sender: { name: string; role: 'performer' }, message: string) => Promise<void>;
  onMarkMessagesAsRead: (bookingId: string, recipient: number) => Promise<void>;
}

const statusConfig: Record<PerformerStatus, { color: string; label: string; icon: React.ReactNode; bgColor: string; }> = {
    available: { color: 'text-green-400', label: 'Available', icon: <ToggleRight size={20}/>, bgColor: 'bg-green-500/20' },
    busy: { color: 'text-yellow-400', label: 'Busy', icon: <ToggleLeft size={20}/>, bgColor: 'bg-yellow-500/20' },
    offline: { color: 'text-zinc-400', label: 'Offline', icon: <Radio size={20}/>, bgColor: 'bg-zinc-500/20' },
};

const bookingStatusClasses: Record<Booking['status'], string> = {
  confirmed: 'text-green-400',
  pending_deposit_confirmation: 'text-blue-400',
  deposit_pending: 'text-orange-400',
  pending_vetting: 'text-yellow-400',
  pending_performer_acceptance: 'text-purple-400',
  rejected: 'text-red-400'
}

interface BookingCardProps {
  booking: Booking;
  onDecision: (bookingId: string, decision: 'accepted' | 'declined', eta?: number) => Promise<void>;
  etaValue: string;
  onEtaChange: (bookingId: string, value: string) => void;
  onOpenChat: (booking: Booking) => void;
  hasUnreadMessages: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onDecision, etaValue, onEtaChange, onOpenChat, hasUnreadMessages }) => {
  const [isLoading, setIsLoading] = useState<'accept' | 'decline' | null>(null);

  const handleDecision = async (decision: 'accepted' | 'declined') => {
    setIsLoading(decision === 'accepted' ? 'accept' : 'decline');
    try {
      await onDecision(booking.id, decision, Number(etaValue) || undefined);
    } catch (error) {
      console.error("Failed to process booking decision", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="bg-zinc-900/70 p-4 rounded-lg border border-zinc-700/50">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
            <div>
                <p className="font-bold text-lg text-white">{booking.event_type}</p>
                <p className={`text-sm font-semibold capitalize ${bookingStatusClasses[booking.status]}`}>{booking.status.replace(/_/g, ' ')}</p>
            </div>
            <div className="text-left sm:text-right text-sm">
               <div className="flex items-center gap-2 text-zinc-300"><Calendar className="h-4 w-4 text-orange-400"/> {new Date(booking.event_date).toLocaleDateString()}</div>
               <div className="flex items-center gap-2 text-zinc-300 mt-1"><Clock className="h-4 w-4 text-orange-400"/> {booking.event_time}</div>
            </div>
        </div>
         <div className="mt-3 pt-3 border-t border-zinc-700 flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-400 text-sm">
           <span className="flex items-center gap-2"><User className="h-4 w-4 text-orange-400" /> Client: {booking.client_name}</span>
           <span className="flex items-center gap-2"><Users className="h-4 w-4 text-orange-400" /> Guests: {booking.number_of_guests}</span>
        </div>
        
        <div className="mt-4 flex justify-end">
             <button 
                onClick={() => onOpenChat(booking)}
                className="relative text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 hover:border-zinc-500 font-semibold py-1.5 px-3 rounded flex items-center gap-2 transition-colors"
             >
                <MessageCircle size={14} />
                Message Client
                {hasUnreadMessages && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                )}
             </button>
        </div>

         {booking.status === 'pending_performer_acceptance' && (
            <div className="mt-4 pt-4 border-t border-zinc-700/50 flex flex-col sm:flex-row items-center gap-3">
                <p className="text-xs font-semibold text-zinc-300 mr-2 flex-shrink-0">Action Required:</p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <div className="relative flex-grow">
                      <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                      <input
                        type="number"
                        placeholder="ETA (mins)"
                        value={etaValue}
                        onChange={(e) => onEtaChange(booking.id, e.target.value)}
                        className="bg-zinc-800 border border-zinc-600 text-white text-xs rounded-md focus:ring-orange-500 focus:border-orange-500 block w-full pl-8 pr-2 py-1.5 transition-colors"
                        disabled={!!isLoading}
                      />
                   </div>
                   <button onClick={() => handleDecision('accepted')} disabled={!!isLoading} className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-md flex-shrink-0 w-24">
                      {isLoading === 'accept' ? <LoaderCircle size={14} className="animate-spin" /> : <><Check size={14}/> Accept</>}
                   </button>
                   <button onClick={() => handleDecision('declined')} disabled={!!isLoading} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-md flex-shrink-0 w-24">
                      {isLoading === 'decline' ? <LoaderCircle size={14} className="animate-spin" /> : <><X size={14}/> Decline</>}
                   </button>
                </div>
            </div>
        )}
    </div>
  );
};


const PerformerDashboard: React.FC<PerformerDashboardProps> = ({ performer, bookings, communications, onToggleStatus, onViewDoNotServe, onBookingDecision, onSendMessage, onMarkMessagesAsRead }) => {
  const [etas, setEtas] = useState<Record<string, string>>({});
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);

  const systemCommunications = communications.filter(c => c.type !== 'direct_message');

  const handleEtaChange = (bookingId: string, value: string) => {
    setEtas(prev => ({ ...prev, [bookingId]: value }));
  };
  
  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    try {
      await onToggleStatus(nextStatus[performer.status]);
    } finally {
      setIsTogglingStatus(false);
    }
  };
  
  const handleOpenChat = (booking: Booking) => {
      setActiveChatBooking(booking);
      onMarkMessagesAsRead(booking.id, performer.id);
  };
  
  const handleSendMessageInChat = (messageText: string) => {
      if (!activeChatBooking) return Promise.resolve();
      return onSendMessage(activeChatBooking, { name: performer.name, role: 'performer' }, messageText);
  };

  const nextStatus: Record<PerformerStatus, PerformerStatus> = {
    available: 'busy',
    busy: 'offline',
    offline: 'available',
  };

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const pendingBookings = bookings.filter(b => b.status !== 'confirmed' && b.status !== 'rejected');

  const unreadMessagesByBooking = useMemo(() => {
    const counts: Record<string, boolean> = {};
    communications.forEach(comm => {
        if (comm.booking_id && comm.recipient === performer.id && comm.type === 'direct_message' && !comm.read) {
            counts[comm.booking_id] = true;
        }
    });
    return counts;
  }, [communications, performer.id]);

  const activeChatMessages = useMemo(() => {
    if (!activeChatBooking) return [];
    return communications
        .filter(c => c.booking_id === activeChatBooking.id && c.type === 'direct_message')
        .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [activeChatBooking, communications]);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Performer Dashboard</h1>
          <p className="text-xl text-orange-400 mt-1">Welcome, {performer.name}</p>
        </div>
        <button 
          onClick={onViewDoNotServe}
          className="bg-red-600/90 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
        >
          <ShieldAlert className="h-5 w-5" />
          'Do Not Serve' List
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card-base !p-6 lg:col-span-1">
          <h2 className="text-2xl font-semibold text-white mb-4">Your Availability</h2>
          <div className="flex items-center gap-4">
            <p className="text-zinc-300">Current Status:</p>
            <span className={`font-bold py-1 px-3 rounded-full text-sm ${statusConfig[performer.status].bgColor} ${statusConfig[performer.status].color}`}>{statusConfig[performer.status].label}</span>
          </div>
          <button 
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className="btn-primary mt-6 w-full flex items-center justify-center gap-2"
          >
            {isTogglingStatus ? <LoaderCircle size={20} className="animate-spin" /> : statusConfig[nextStatus[performer.status]].icon}
            {isTogglingStatus ? 'Updating...' : `Switch to ${statusConfig[nextStatus[performer.status]].label}`}
          </button>
        </div>
         <div className="card-base !p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3"><MessageSquare /> Communications</h2>
             {systemCommunications.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 -mr-2">
                  {systemCommunications.map(comm => (
                    <div key={comm.id} className="bg-zinc-900/70 p-3 rounded-md text-sm border border-zinc-700/50">
                        <p className="text-zinc-200">{comm.message}</p>
                        <p className="text-xs text-zinc-500 mt-1">From: <span className="text-orange-400 font-semibold">{comm.sender}</span> &bull; {new Date(comm.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="text-center py-8 text-zinc-500">
                   <Inbox className="h-12 w-12 mx-auto mb-2 text-zinc-600" />
                   <p>No new system notifications.</p>
                </div>
             )}
        </div>
      </div>

      <div className="card-base !p-6">
         <h2 className="text-2xl font-semibold text-white mb-4">Your Bookings</h2>
         
         <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-orange-400 mb-3">Pending Actions ({pendingBookings.length})</h3>
              {pendingBookings.length > 0 ? (
                  <div className="space-y-4">
                      {pendingBookings.map(booking => <BookingCard key={booking.id} booking={booking} onDecision={onBookingDecision} etaValue={etas[booking.id] || ''} onEtaChange={handleEtaChange} onOpenChat={handleOpenChat} hasUnreadMessages={!!unreadMessagesByBooking[booking.id]} />)}
                  </div>
              ) : (
                  <p className="text-zinc-400 text-sm">No bookings require your attention.</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Confirmed Bookings ({confirmedBookings.length})</h3>
              {confirmedBookings.length > 0 ? (
                  <div className="space-y-4">
                     {confirmedBookings.map(booking => <BookingCard key={booking.id} booking={booking} onDecision={onBookingDecision} etaValue={''} onEtaChange={() => {}} onOpenChat={handleOpenChat} hasUnreadMessages={!!unreadMessagesByBooking[booking.id]} />)}
                  </div>
              ) : (
                  <p className="text-zinc-400 text-sm">You have no confirmed bookings yet.</p>
              )}
            </div>
         </div>
         
         {bookings.length === 0 && (
            <p className="text-zinc-400">You have no bookings assigned yet.</p>
         )}
      </div>
      
      {activeChatBooking && (
          <ChatDialog
              isOpen={!!activeChatBooking}
              onClose={() => setActiveChatBooking(null)}
              booking={activeChatBooking}
              currentUser={performer}
              messages={activeChatMessages}
              onSendMessage={handleSendMessageInChat}
          />
      )}
    </div>
  );
};

export default PerformerDashboard;