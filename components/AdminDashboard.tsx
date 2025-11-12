import React, { useMemo, useState } from 'react';
import { Booking, Performer, BookingStatus, DoNotServeEntry, DoNotServeStatus, Communication, Service } from '../types';
import { allServices } from '../data/mockData';
import { ShieldCheck, ShieldAlert, Check, X, MessageSquare, Download, Filter, FileText, DollarSign, CreditCard, BarChart, Inbox, Users as UsersIcon, UserCog, RefreshCcw, ChevronDown, Clock, LoaderCircle, LineChart, TrendingUp, CheckCircle, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { calculateBookingCost } from '../utils/bookingUtils';

interface AdminDashboardProps {
  bookings: Booking[];
  performers: Performer[];
  doNotServeList: DoNotServeEntry[];
  communications: Communication[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  onUpdateDoNotServeStatus: (entryId: string, status: DoNotServeStatus) => Promise<void>;
  onViewDoNotServe: () => void;
  onAdminDecisionForPerformer: (bookingId: string, decision: 'accepted' | 'declined') => Promise<void>;
  onAdminChangePerformer: (bookingId: string, newPerformerId: number) => Promise<void>;
}

const statusClasses: Record<BookingStatus, string> = {
    pending_performer_acceptance: 'border-purple-500/50 bg-purple-900/30 text-purple-300',
    pending_vetting: 'border-yellow-500/50 bg-yellow-900/30 text-yellow-300',
    deposit_pending: 'border-orange-500/50 bg-orange-900/30 text-orange-300',
    pending_deposit_confirmation: 'border-blue-500/50 bg-blue-900/30 text-blue-300',
    confirmed: 'border-green-500/50 bg-green-900/30 text-green-300',
    rejected: 'border-red-500/50 bg-red-900/30 text-red-300',
};

const bookingStatusOptions: { value: BookingStatus; label: string }[] = [
    { value: 'pending_performer_acceptance', label: 'Pending Performer Acceptance' },
    { value: 'pending_vetting', label: 'Pending Vetting' },
    { value: 'deposit_pending', label: 'Deposit Pending' },
    { value: 'pending_deposit_confirmation', label: 'Pending Deposit Confirmation' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'rejected', label: 'Rejected' },
];

type AdminTab = 'management' | 'payments' | 'reporting';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ bookings, performers, doNotServeList, communications, onUpdateBookingStatus, onUpdateDoNotServeStatus, onViewDoNotServe, onAdminDecisionForPerformer, onAdminChangePerformer }) => {
  
  const [activeTab, setActiveTab] = useState<AdminTab>('management');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [sortField, setSortField] = useState<'event_date' | 'client_name' | 'performer_name' | 'status'>('event_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loadingState, setLoadingState] = useState<{ type: string, id: string } | null>(null);

  const handleAction = async (type: string, id: string, action: () => Promise<void>) => {
    setLoadingState({ type, id });
    try {
      await action();
    } catch (error) {
      console.error(`Action ${type} for id ${id} failed:`, error);
    } finally {
      setLoadingState(null);
    }
  };


  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (statusFilter) {
        result = result.filter(b => b.status === statusFilter);
    }

    return result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';
        
        switch (sortField) {
            case 'event_date':
                valA = new Date(a.event_date).getTime();
                valB = new Date(b.event_date).getTime();
                break;
            case 'client_name':
                valA = a.client_name.toLowerCase();
                valB = b.client_name.toLowerCase();
                break;
            case 'performer_name':
                valA = (a.performer?.name || '').toLowerCase();
                valB = (b.performer?.name || '').toLowerCase();
                break;
            case 'status':
                valA = a.status;
                valB = b.status;
                break;
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
  }, [bookings, statusFilter, sortField, sortDirection]);
  
  const paymentRelatedBookings = useMemo(() => {
    return bookings.filter(b => ['deposit_pending', 'pending_deposit_confirmation', 'confirmed'].includes(b.status));
  }, [bookings]);
  
  const reportingMetrics = useMemo(() => {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    
    let totalRevenue = 0;
    let totalDeposits = 0;
    const performerBookings: Record<string, number> = {};
    const serviceCategoryCounts: Record<Service['category'], number> = {
      'Waitressing': 0,
      'Strip Show': 0,
      'Promotional & Hosting': 0,
    };
    
    performers.forEach(p => performerBookings[p.name] = 0);

    confirmedBookings.forEach(booking => {
      const { totalCost, depositAmount } = calculateBookingCost(booking.duration_hours, booking.services_requested, 1);
      totalRevenue += totalCost;
      totalDeposits += depositAmount;
      
      if (booking.performer?.name && performerBookings.hasOwnProperty(booking.performer.name)) {
        performerBookings[booking.performer.name]++;
      }
      
      booking.services_requested.forEach(serviceId => {
        const service = allServices.find(s => s.id === serviceId);
        if (service) {
           serviceCategoryCounts[service.category]++;
        }
      });
    });

    const sortedPerformers = Object.entries(performerBookings)
      .sort(([, a], [, b]) => b - a);

    const sortedCategories = Object.entries(serviceCategoryCounts)
      .sort(([, a], [, b]) => b - a);

    return {
      totalRevenue,
      totalDeposits,
      confirmedCount: confirmedBookings.length,
      performerBookings: sortedPerformers,
      serviceCategoryCounts: sortedCategories,
    };

  }, [bookings, performers]);


  const pendingDnsEntries = doNotServeList.filter(entry => entry.status === 'pending');
  const adminComms = communications.filter(c => c.recipient === 'admin');
  
  const totalBookings = bookings.length;
  const confirmedBookingsCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = totalBookings - confirmedBookingsCount - bookings.filter(b => b.status === 'rejected').length;


  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-xl text-zinc-400 mt-1">Manage bookings and monitor performers.</p>
        </div>
        <button 
          onClick={onViewDoNotServe}
          className="bg-red-600/90 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
        >
          <ShieldAlert className="h-5 w-5" />
          Manage 'Do Not Serve' List
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-base !p-6 flex items-center gap-4"><BarChart className="w-10 h-10 text-orange-500" /><div><p className="text-zinc-400 text-sm">Total Bookings</p><p className="text-3xl font-bold text-white">{totalBookings}</p></div></div>
        <div className="card-base !p-6 flex items-center gap-4"><ShieldCheck className="w-10 h-10 text-green-500" /><div><p className="text-zinc-400 text-sm">Confirmed</p><p className="text-3xl font-bold text-white">{confirmedBookingsCount}</p></div></div>
        <div className="card-base !p-6 flex items-center gap-4"><ShieldAlert className="w-10 h-10 text-yellow-500" /><div><p className="text-zinc-400 text-sm">Pending Actions</p><p className="text-3xl font-bold text-white">{pendingDnsEntries.length + pendingBookings}</p></div></div>
      </div>


      {pendingDnsEntries.length > 0 && (
         <div className="card-base !p-6 !border-yellow-500/50 !bg-yellow-900/20">
           <h2 className="text-2xl font-semibold text-white mb-4">Pending 'Do Not Serve' Submissions</h2>
           <div className="space-y-4">
              {pendingDnsEntries.map(entry => (
                <div key={entry.id} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <p className="font-bold text-lg text-white">{entry.client_name}</p>
                        <p className="text-sm text-zinc-400">Submitted by: <span className="font-semibold text-orange-400">{entry.performer?.name || 'N/A'}</span></p>
                        <p className="text-sm text-zinc-300 mt-1 italic">Reason: "{entry.reason}"</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <button onClick={() => handleAction('dns-approve', entry.id, () => onUpdateDoNotServeStatus(entry.id, 'approved'))} disabled={loadingState?.id === entry.id} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded flex items-center gap-1 text-xs w-24 justify-center">
                          {loadingState?.type === 'dns-approve' && loadingState.id === entry.id ? <LoaderCircle size={14} className="animate-spin" /> : <><Check size={14}/> Approve</>}
                        </button>
                        <button onClick={() => handleAction('dns-reject', entry.id, () => onUpdateDoNotServeStatus(entry.id, 'rejected'))} disabled={loadingState?.id === entry.id} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded flex items-center gap-1 text-xs w-24 justify-center">
                          {loadingState?.type === 'dns-reject' && loadingState.id === entry.id ? <LoaderCircle size={14} className="animate-spin" /> : <><X size={14}/> Reject</>}
                        </button>
                    </div>
                </div>
              ))}
           </div>
         </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('management')}
            className={`${activeTab === 'management' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
          >
            <CreditCard size={16}/> Booking Management
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`${activeTab === 'payments' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
          >
            <DollarSign size={16}/> Payment Tracking
          </button>
           <button
            onClick={() => setActiveTab('reporting')}
            className={`${activeTab === 'reporting' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
          >
            <LineChart size={16}/> Reporting
          </button>
        </nav>
      </div>
      
      {activeTab === 'reporting' && (
        <div className="card-base !p-6 animate-fade-in">
           <h2 className="text-2xl font-semibold text-white mb-6">Reporting & Analytics</h2>
           {reportingMetrics.confirmedCount > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card-base !p-6 flex items-center gap-4 !bg-zinc-950/50"><DollarSign className="w-10 h-10 text-green-500" /><div><p className="text-zinc-400 text-sm">Total Revenue</p><p className="text-3xl font-bold text-white">${reportingMetrics.totalRevenue.toFixed(2)}</p></div></div>
                  <div className="card-base !p-6 flex items-center gap-4 !bg-zinc-950/50"><CreditCard className="w-10 h-10 text-orange-500" /><div><p className="text-zinc-400 text-sm">Total Deposits Paid</p><p className="text-3xl font-bold text-white">${reportingMetrics.totalDeposits.toFixed(2)}</p></div></div>
                  <div className="card-base !p-6 flex items-center gap-4 !bg-zinc-950/50"><CheckCircle className="w-10 h-10 text-blue-500" /><div><p className="text-zinc-400 text-sm">Confirmed Bookings</p><p className="text-3xl font-bold text-white">{reportingMetrics.confirmedCount}</p></div></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-base !p-6 !bg-zinc-950/50">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><UsersIcon/> Performer Utilization</h3>
                  <div className="space-y-3">
                    {reportingMetrics.performerBookings.map(([name, count]) => (
                      <div key={name}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="font-medium text-zinc-200">{name}</span>
                          <span className="text-zinc-400">{count} booking{count !== 1 ? 's' : ''}</span>
                        </div>
                         <div className="w-full bg-zinc-700/50 rounded-full h-2.5">
                            <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${(count / (reportingMetrics.performerBookings[0][1] || 1)) * 100}%` }}></div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-base !p-6 !bg-zinc-950/50">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp/> Popular Service Categories</h3>
                   <div className="space-y-3">
                    {reportingMetrics.serviceCategoryCounts.map(([category, count]) => (
                      <div key={category}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="font-medium text-zinc-200">{category}</span>
                          <span className="text-zinc-400">{count} time{count !== 1 ? 's' : ''} booked</span>
                        </div>
                         <div className="w-full bg-zinc-700/50 rounded-full h-2.5">
                            <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(count / (reportingMetrics.serviceCategoryCounts[0][1] || 1)) * 100}%` }}></div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
           ) : (
             <p className="text-zinc-500 text-center py-10">No confirmed bookings yet to generate a report.</p>
           )}
        </div>
      )}


      {activeTab === 'management' && (
      <div className="card-base !p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-white">All Booking Applications</h2>
          <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Sort Controls */}
              <div className="relative flex items-center">
                 <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                 <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as any)}
                    className="input-base !py-2 !pl-9 !pr-8 !text-sm !w-auto"
                 >
                    <option value="event_date">Sort by Date</option>
                    <option value="client_name">Sort by Client</option>
                    <option value="performer_name">Sort by Performer</option>
                    <option value="status">Sort by Status</option>
                 </select>
                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                 
                 <button 
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="ml-2 p-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    title={sortDirection === 'asc' ? "Ascending" : "Descending"}
                 >
                    {sortDirection === 'asc' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                 </button>
              </div>

              <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                 <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
                    className="input-base !py-2 !pl-9 !pr-8 !text-sm !w-auto"
                 >
                    <option value="">All Statuses</option>
                    {bookingStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                 </select>
                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
              <button onClick={() => alert('CSV export functionality would be implemented here.')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-md transition-colors duration-300 flex items-center gap-2 text-sm">
                  <Download size={16}/> Export CSV
              </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBookings.length > 0 ? filteredBookings.map(booking => {
            const isLoading = loadingState?.id === booking.id;
            return (
            <div key={booking.id} className={`p-4 rounded-lg border ${statusClasses[booking.status]}`}>
              <div className="flex flex-col md:flex-row justify-between md:items-start">
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <p className="font-bold text-lg text-white">{booking.event_type}</p>
                      <span className="hidden sm:inline text-zinc-500">&bull;</span>
                      <p className="text-zinc-200">{booking.client_name}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-orange-400"/> 
                        <span>{new Date(booking.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-orange-400"/> 
                        <span>{booking.event_time}</span>
                      </div>
                  </div>

                  <div className="text-sm text-zinc-400 flex flex-wrap gap-x-4 mb-2">
                    <span>Assigned to: <span className="font-semibold text-orange-400">{booking.performer?.name || 'N/A'}</span></span>
                    <span className="flex items-center gap-1.5"><UsersIcon size={14}/> Guests: <span className="font-semibold text-white">{booking.number_of_guests}</span></span>
                    {booking.performer_eta_minutes && booking.performer_eta_minutes > 0 && (
                        <span className="flex items-center gap-1.5"><Clock size={14}/> ETA: <span className="font-semibold text-white">{booking.performer_eta_minutes} mins</span></span>
                    )}
                  </div>
                  {booking.client_message && (
                    <p className="text-sm text-zinc-300 mt-1 italic">Note: "{booking.client_message}"</p>
                  )}
                  <p className={`font-semibold capitalize text-sm mt-1`}>{booking.status.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-sm text-zinc-400 mt-4 md:mt-0 md:text-right flex-shrink-0">
                    <p className="text-white font-medium">Contact Info</p>
                    <p>{booking.client_email}</p>
                    <p>{booking.client_phone}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-600/50 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                    {booking.status === 'pending_vetting' && (
                        <button onClick={() => handleAction('approve-vetting', booking.id, () => onUpdateBookingStatus(booking.id, 'deposit_pending'))} disabled={isLoading} className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 w-32">
                           {isLoading && loadingState?.type === 'approve-vetting' ? <LoaderCircle size={14} className="animate-spin"/> : <><Check size={14}/> Approve Vetting</>}
                        </button>
                    )}
                    {booking.status === 'pending_deposit_confirmation' && (
                        <button onClick={() => handleAction('confirm-deposit', booking.id, () => onUpdateBookingStatus(booking.id, 'confirmed'))} disabled={isLoading} className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 w-32">
                          {isLoading && loadingState?.type === 'confirm-deposit' ? <LoaderCircle size={14} className="animate-spin"/> : <><Check size={14}/> Confirm Deposit</>}
                        </button>
                    )}
                     {(booking.status === 'pending_vetting' || booking.status === 'deposit_pending' || booking.status === 'pending_performer_acceptance') && (
                        <button onClick={() => handleAction('reject', booking.id, () => onUpdateBookingStatus(booking.id, 'rejected'))} disabled={isLoading} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 w-20">
                           {isLoading && loadingState?.type === 'reject' ? <LoaderCircle size={14} className="animate-spin"/> : <><X size={14}/> Reject</>}
                        </button>
                     )}
                     {booking.status === 'pending_performer_acceptance' && (
                        <div className="flex items-center gap-2 pl-2 border-l border-zinc-600">
                           <p className="text-xs font-semibold text-zinc-300">Admin Override:</p>
                           <button onClick={() => handleAction('override-accept', booking.id, () => onAdminDecisionForPerformer(booking.id, 'accepted'))} disabled={isLoading} className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 w-36">
                             {isLoading && loadingState?.type === 'override-accept' ? <LoaderCircle size={14} className="animate-spin"/> : <><Check size={14}/> Accept for Performer</>}
                           </button>
                           <button onClick={() => handleAction('override-decline', booking.id, () => onAdminDecisionForPerformer(booking.id, 'declined'))} disabled={isLoading} className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 w-36">
                             {isLoading && loadingState?.type === 'override-decline' ? <LoaderCircle size={14} className="animate-spin"/> : <><X size={14}/> Decline for Performer</>}
                           </button>
                        </div>
                     )}
                </div>
                 <div className="flex flex-wrap gap-2 items-center">
                    {booking.status !== 'confirmed' && booking.status !== 'rejected' && (
                       <div className="relative group">
                          <RefreshCcw className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <select 
                            value={booking.performer_id}
                            onChange={(e) => onAdminChangePerformer(booking.id, Number(e.target.value))}
                            className="input-base !py-1.5 !pl-9 !pr-8 !text-xs !w-auto appearance-none bg-zinc-700 hover:bg-zinc-600"
                            title="Reassign Performer"
                           >
                            <option value={booking.performer_id} disabled>Reassign</option>
                            {performers.filter(p => p.id !== booking.performer_id).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                       </div>
                    )}
                    {booking.status === 'confirmed' && booking.verified_at && (
                        <div className="text-xs text-green-300/80">
                            Verified by <strong>{booking.verified_by_admin_name}</strong> on {new Date(booking.verified_at).toLocaleDateString()}
                        </div>
                    )}
                 </div>
              </div>
            </div>
          )}) : <p className="text-zinc-400 text-center py-4">No bookings match the current filter.</p>}
        </div>
      </div>
      )}

      {activeTab === 'payments' && (
        <div className="card-base !p-0">
            <h2 className="text-2xl font-semibold text-white mb-4 p-6">Payment Tracking</h2>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50">
                        <tr>
                            <th scope="col" className="px-3 py-3 sm:px-6">Client</th>
                            <th scope="col" className="px-3 py-3 sm:px-6">Performer</th>
                            <th scope="col" className="px-3 py-3 sm:px-6">Total Cost</th>
                            <th scope="col" className="px-3 py-3 sm:px-6">Deposit Due</th>
                            <th scope="col" className="px-3 py-3 sm:px-6">Payment Status</th>
                            <th scope="col" className="px-3 py-3 sm:px-6">Action / Verified By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentRelatedBookings.length > 0 ? paymentRelatedBookings.map(booking => {
                            const { totalCost, depositAmount } = calculateBookingCost(booking.duration_hours, booking.services_requested, 1);
                            
                            let paymentStatusText = 'Unknown';
                            if (booking.status === 'deposit_pending') paymentStatusText = 'Awaiting Payment';
                            if (booking.status === 'pending_deposit_confirmation') paymentStatusText = 'Verification Needed';
                            if (booking.status === 'confirmed') paymentStatusText = 'Verified';

                            return (
                                <tr key={booking.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                    <td className="px-3 py-4 sm:px-6 font-medium text-white whitespace-nowrap">{booking.client_name}</td>
                                    <td className="px-3 py-4 sm:px-6">{booking.performer?.name}</td>
                                    <td className="px-3 py-4 sm:px-6">${totalCost.toFixed(2)}</td>
                                    <td className="px-3 py-4 sm:px-6 font-bold text-orange-400">${depositAmount.toFixed(2)}</td>
                                    <td className={`px-3 py-4 sm:px-6 font-semibold ${statusClasses[booking.status]}`}>{paymentStatusText}</td>
                                    <td className="px-3 py-4 sm:px-6">
                                        {booking.status === 'pending_deposit_confirmation' && (
                                            <button onClick={() => {
                                                if (booking.deposit_receipt_path?.startsWith('simulated/')) {
                                                    alert(`This is a simulated receipt for a successful payment.\n\nFile: ${booking.deposit_receipt_path}\nBooking ID: ${booking.id}`);
                                                } else if (booking.deposit_receipt_path) {
                                                    alert(`This would open the uploaded file: ${booking.deposit_receipt_path}`);
                                                } else {
                                                    alert('No receipt was uploaded for this booking.');
                                                }
                                            }} className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded flex items-center gap-1">
                                                <FileText size={14}/> View Receipt
                                            </button>
                                        )}
                                        {booking.status === 'confirmed' && booking.verified_at && (
                                            <div className="text-xs text-green-300/80">
                                                <p><strong>{booking.verified_by_admin_name}</strong></p>
                                                <p className="text-zinc-500">{new Date(booking.verified_at).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        }) : (
                             <tr>
                                <td colSpan={6} className="text-center py-8 text-zinc-500">No bookings are currently in a payment stage.</td>
                             </tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
      )}
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-base !p-6">
             <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3"><UserCog />Performer Status</h2>
             <ul className="space-y-2 max-h-60 overflow-y-auto">
                {performers.map(p => (
                    <li key={p.id} className="flex justify-between items-center bg-zinc-900/70 p-3 rounded-md border border-zinc-700/50">
                        <span className="text-white font-medium">{p.name}</span>
                        <span className={`capitalize px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'available' ? 'bg-green-500/20 text-green-300' : p.status === 'busy' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-zinc-500/20 text-zinc-300'}`}>{p.status}</span>
                    </li>
                ))}
             </ul>
          </div>
            <div className="card-base !p-6">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3"><MessageSquare /> Communications</h2>
                 {adminComms.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 -mr-2">
                      {adminComms.map(comm => (
                        <div key={comm.id} className="bg-zinc-900/70 p-3 rounded-md text-sm border border-zinc-700/50">
                            <p className="text-zinc-200">{comm.message}</p>
                            <p className="text-xs text-zinc-500 mt-1">From: <span className="text-orange-400 font-semibold">{comm.sender}</span> &bull; {new Date(comm.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-zinc-500">
                      <Inbox className="h-12 w-12 mx-auto mb-2 text-zinc-600" />
                      <p>No new system messages.</p>
                    </div>
                 )}
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;