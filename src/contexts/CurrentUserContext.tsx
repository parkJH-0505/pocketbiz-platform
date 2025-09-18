import React, { createContext, useContext, useState } from 'react';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: 'startup' | 'admin' | 'internal-builder' | 'partner';
}

interface CurrentUserContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser) => void;
  logout: () => void;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return context;
};

export const CurrentUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 개발용 더미 사용자 데이터
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: 'user-001',
    name: '김대표',
    email: 'ceo@pocketbiz.com',
    company: '포켓전자',
    role: 'startup'
  });

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser, logout }}>
      {children}
    </CurrentUserContext.Provider>
  );
};