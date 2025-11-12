import { useState, useCallback } from 'react';
import type { PhoneMessage } from '../types';

export const useNotifications = () => {
  const [phoneMessage, setPhoneMessage] = useState<PhoneMessage>(null);

  const showPhoneMessage = useCallback((msg: PhoneMessage) => {
    setPhoneMessage(msg);
    setTimeout(() => {
      setPhoneMessage(null);
    }, 7000); // Message disappears after 7 seconds
  }, []);

  const clearPhoneMessage = useCallback(() => {
    setPhoneMessage(null);
  }, []);

  return {
    phoneMessage,
    showPhoneMessage,
    clearPhoneMessage,
  };
};
