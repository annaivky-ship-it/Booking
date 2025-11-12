import { useState } from 'react';
import type { Role } from '../types';

export type AuthedUser = { name: string; role: Role; id?: number; } | null;

export const useAuth = () => {
  const [authedUser, setAuthedUser] = useState<AuthedUser>(null);
  const [showLogin, setShowLogin] = useState(false);

  const role = authedUser?.role || 'user';

  const handleLogin = (name: string, role: Role, id?: number) => {
    setAuthedUser({ name, role, id });
    setShowLogin(false);
  };

  const handleLogout = () => {
    setAuthedUser(null);
  };

  const openLogin = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  return {
    authedUser,
    showLogin,
    role,
    handleLogin,
    handleLogout,
    openLogin,
    closeLogin,
  };
};
