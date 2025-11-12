import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Performer, Booking, DoNotServeEntry, Communication } from '../types';

export const useAppData = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doNotServeList, setDoNotServeList] = useState<DoNotServeEntry[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { performers: pData, bookings: bData, doNotServeList: dData, communications: cData } = await api.getInitialData();

      if (pData.error) throw new Error(`Performers: ${pData.error.message}`);
      setPerformers(pData.data as Performer[] || []);

      if (bData.error) throw new Error(`Bookings: ${bData.error.message}`);
      setBookings(bData.data as Booking[] || []);

      if (dData.error) throw new Error(`DNS List: ${dData.error.message}`);
      setDoNotServeList(dData.data as DoNotServeEntry[] || []);

      if (cData.error) throw new Error(`Communications: ${cData.error.message}`);
      setCommunications(cData.data as Communication[] || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch data: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    performers,
    setPerformers,
    bookings,
    setBookings,
    doNotServeList,
    setDoNotServeList,
    communications,
    setCommunications,
    isLoading,
    error,
    fetchData,
  };
};
