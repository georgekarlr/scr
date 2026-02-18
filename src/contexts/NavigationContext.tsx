import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isBottomNavVisible: boolean;
  isTopBarVisible: boolean;
  setBottomNavVisible: (visible: boolean) => void;
  setTopBarVisible: (visible: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBottomNavVisible, setBottomNavVisible] = useState(true);
  const [isTopBarVisible, setTopBarVisible] = useState(true);

  return (
    <NavigationContext.Provider value={{
      isBottomNavVisible,
      isTopBarVisible,
      setBottomNavVisible,
      setTopBarVisible
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
