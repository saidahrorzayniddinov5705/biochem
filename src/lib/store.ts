import { create } from 'zustand';

interface UserState {
  user: any | null;
  firebaseUser: any | null;
  setUser: (user: any | null, firebaseUser?: any | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  firebaseUser: null,
  setUser: (user, firebaseUser) => set({ user, firebaseUser }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
