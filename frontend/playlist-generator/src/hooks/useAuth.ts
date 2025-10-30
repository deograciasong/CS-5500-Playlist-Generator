// Custom hook for authentication
import { useState, useEffect } from 'react';
import { User } from '../models/Auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // TODO: Validate token with backend
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  return { 
    user, 
    isAuthenticated: !!user,
    loading 
  };
};