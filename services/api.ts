// services/api.ts
import { supabase } from './supabaseClient';
import { mockPerformers, mockBookings, mockDoNotServeList, mockCommunications } from '../data/mockData';
import type { Performer, Booking, BookingStatus, DoNotServeEntry, DoNotServeStatus, Communication, PerformerStatus, ApiError, ApiResponse } from '../types';
import { BookingFormState } from '../components/BookingProcess';

const isDemoMode = !supabase;

// Helper to simulate network delay for a better demo experience
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// In-memory "database" for demo mode to simulate state changes
let demoPerformers = JSON.parse(JSON.stringify(mockPerformers));
let demoBookings = JSON.parse(JSON.stringify(mockBookings));
let demoDoNotServeList = JSON.parse(JSON.stringify(mockDoNotServeList));
let demoCommunications = JSON.parse(JSON.stringify(mockCommunications));

export const resetDemoData = () => {
  demoPerformers = JSON.parse(JSON.stringify(mockPerformers));
  demoBookings = JSON.parse(JSON.stringify(mockBookings));
  demoDoNotServeList = JSON.parse(JSON.stringify(mockDoNotServeList));
  demoCommunications = JSON.parse(JSON.stringify(mockCommunications));
};

export const api = {
  // --- GETTERS ---
  async getInitialData() {
    if (isDemoMode) {
      await delay(500);
      return {
        performers: { data: demoPerformers, error: null },
        bookings: { data: demoBookings, error: null },
        doNotServeList: { data: demoDoNotServeList, error: null },
        communications: { data: demoCommunications, error: null },
      };
    }

    const [performers, bookings, doNotServeList, communications] = await Promise.all([
      supabase!.from('performers').select('*').order('id'),
      supabase!.from('bookings').select('*, performer:performer_id(id, name)').order('created_at', { ascending: false }),
      supabase!.from('do_not_serve').select('*, performer:submitted_by_performer_id(name)').order('created_at', { ascending: false }),
      supabase!.from('communications').select('*').order('created_at', { ascending: false }),
    ]);

    return { performers, bookings, doNotServeList, communications };
  },

  // --- MUTATIONS ---

  async addCommunication(comm: Omit<Communication, 'id' | 'created_at' | 'read'>): Promise<ApiResponse<Communication[]>> {
    if (isDemoMode) {
      await delay(200);
      const newComm: Communication = {
        ...comm,
        id: `comm-demo-${Date.now()}`,
        created_at: new Date().toISOString(),
        read: false,
      };
      demoCommunications.unshift(newComm);
      return { data: [newComm], error: null };
    }
    
    return supabase!.from('communications').insert({ ...comm, read: false }).select();
  },

  async markMessagesAsRead(bookingId: string, recipient: string | number): Promise<ApiResponse<{ success: boolean }>> {
    if (isDemoMode) {
        await delay(100);
        demoCommunications.forEach((c: Communication) => {
            if (c.booking_id === bookingId && c.recipient === recipient && c.type === 'direct_message' && !c.read) {
                c.read = true;
            }
        });
        return { data: { success: true }, error: null };
    }
    return supabase!
        .from('communications')
        .update({ read: true })
        .eq('booking_id', bookingId)
        .eq('recipient', recipient)
        .eq('read', false);
  },
  
  async updatePerformerStatus(performerId: number, status: PerformerStatus): Promise<ApiResponse<Performer[]>> {
    if (isDemoMode) {
        await delay(800);
        const performer = demoPerformers.find((p: Performer) => p.id === performerId);
        if (performer) {
            performer.status = status;
            return { data: [performer], error: null };
        }
        return { data: null, error: { message: 'Performer not found' } };
    }
    return supabase!.from('performers').update({ status }).eq('id', performerId).select();
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus, updates: Partial<Booking> = {}): Promise<ApiResponse<Booking[]>> {
    if (isDemoMode) {
      await delay(1000);
      const bookingIndex = demoBookings.findIndex((b: Booking) => b.id === bookingId);
      if (bookingIndex !== -1) {
        demoBookings[bookingIndex] = { ...demoBookings[bookingIndex], status, ...updates };
        return { data: [demoBookings[bookingIndex]], error: null };
      }
      return { data: null, error: { message: 'Booking not found' } };
    }
    return supabase!.from('bookings').update({ status, ...updates }).eq('id', bookingId).select('*, performer:performer_id(id, name)');
  },

  async updateDoNotServeStatus(entryId: string, status: DoNotServeStatus): Promise<ApiResponse<DoNotServeEntry[]>> {
    if (isDemoMode) {
      await delay(1000);
      const entry = demoDoNotServeList.find((e: DoNotServeEntry) => e.id === entryId);
      if(entry) {
        entry.status = status;
        return { data: [entry], error: null };
      }
      return { data: null, error: { message: 'Entry not found' } };
    }
    return supabase!.from('do_not_serve').update({ status }).eq('id', entryId).select('*, performer:submitted_by_performer_id(name)');
  },

  async createDoNotServeEntry(newEntry: Omit<DoNotServeEntry, 'id' | 'created_at' | 'status' | 'performer'>): Promise<ApiResponse<DoNotServeEntry[]>> {
     if (isDemoMode) {
          await delay(1200);
          const performer = demoPerformers.find((p: Performer) => p.id === newEntry.submitted_by_performer_id);
          const entry: DoNotServeEntry = {
              ...newEntry,
              id: `dns-demo-${Date.now()}`,
              created_at: new Date().toISOString(),
              status: 'pending',
              performer: { name: performer?.name || 'Unknown' }
          };
          demoDoNotServeList.unshift(entry);
          return { data: [entry], error: null };
      }
      return supabase!.from('do_not_serve').insert(newEntry).select('*, performer:submitted_by_performer_id(name)');
  },

  async createBookingRequest(formState: BookingFormState, requestedPerformers: Performer[]): Promise<ApiResponse<Booking[]>> {
     if (isDemoMode) {
        await delay(1500);
        const approvedDNS = demoDoNotServeList.filter((e: DoNotServeEntry) => e.status === 'approved');
        const isBlocked = approvedDNS.some((entry: DoNotServeEntry) => {
            const nameMatch = entry.client_name.trim().toLowerCase() === formState.fullName.trim().toLowerCase();
            const emailMatch = formState.email && entry.client_email && entry.client_email.trim().toLowerCase() === formState.email.trim().toLowerCase();
            const phoneMatch = formState.mobile && entry.client_phone && entry.client_phone.replace(/\s+/g, '') === formState.mobile.replace(/\s+/g, '');
            return nameMatch || emailMatch || phoneMatch;
        });

        if (isBlocked) {
             // In real app this communication would be handled by the caller or a trigger
            return { data: null, error: { message: "This client is on the 'Do Not Serve' list." }};
        }
        
        const newBookings: Booking[] = requestedPerformers.map((p, i) => ({
            id: `demo-${Date.now()}-${i}`,
            performer_id: p.id,
            client_name: formState.fullName,
            client_email: formState.email,
            client_phone: formState.mobile,
            event_date: formState.eventDate,
            event_time: formState.eventTime,
            event_address: formState.eventAddress,
            event_type: formState.eventType,
            number_of_guests: Number(formState.numberOfGuests),
            client_message: formState.client_message,
            status: 'pending_performer_acceptance',
            duration_hours: Number(formState.duration),
            services_requested: formState.selectedServices,
            id_document_path: `demo/id-${Date.now()}.pdf`,
            deposit_receipt_path: null,
            created_at: new Date().toISOString(),
            verified_by_admin_name: null,
            verified_at: null,
            performer: { id: p.id, name: p.name },
            performer_eta_minutes: null,
        }));
        
        demoBookings.unshift(...newBookings);
        return { data: newBookings, error: null };
    }

    // Real Supabase Implementation
    let idDocumentPath = null;
    if (formState.idDocument) {
        const fileExt = formState.idDocument.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase!.storage
            .from('documents')
            .upload(fileName, formState.idDocument);

        if (uploadError) {
             return { data: null, error: { message: `ID Upload failed: ${uploadError.message}` } };
        }
        idDocumentPath = uploadData.path;
    }

    const bookingsToInsert = requestedPerformers.map(p => ({
        performer_id: p.id,
        client_name: formState.fullName,
        client_email: formState.email,
        client_phone: formState.mobile,
        event_date: formState.eventDate,
        event_time: formState.eventTime,
        event_address: formState.eventAddress,
        event_type: formState.eventType,
        number_of_guests: Number(formState.numberOfGuests),
        client_message: formState.client_message,
        status: 'pending_performer_acceptance',
        duration_hours: Number(formState.duration),
        services_requested: formState.selectedServices,
        id_document_path: idDocumentPath,
        // created_at handled by DB default
    }));

    const { data, error } = await supabase!
        .from('bookings')
        .insert(bookingsToInsert)
        .select('*, performer:performer_id(id, name)');
    
    return { data: data as Booking[], error };
  }
};