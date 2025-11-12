import { useState } from 'react';
import type { ServiceArea } from '../types';

export const useFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceIdFilter, setServiceIdFilter] = useState<string | null>(null);
  const [serviceAreaFilter, setServiceAreaFilter] = useState<ServiceArea | ''>('');

  const clearFilters = () => {
    setSearchQuery('');
    setServiceIdFilter(null);
    setServiceAreaFilter('');
  };

  return {
    searchQuery,
    setSearchQuery,
    serviceIdFilter,
    setServiceIdFilter,
    serviceAreaFilter,
    setServiceAreaFilter,
    clearFilters,
  };
};
