import React, { createContext, useContext, ReactNode } from 'react';

interface GameManagerContextType {
  getResourceSystem: () => any;
  getPartySystem: () => any;
  getCombatSystem: () => any;
  getInventorySystem: () => any;
  openMenu: (menu: string) => void;
}

export const GameManagerContext = createContext<GameManagerContextType | null>(null);

export const GameManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // This is a placeholder - in a real implementation, this would connect to the actual GameManager
  const value: GameManagerContextType = {
    getResourceSystem: () => null,
    getPartySystem: () => null,
    getCombatSystem: () => null,
    getInventorySystem: () => null,
    openMenu: (menu: string) => console.log(`Opening menu: ${menu}`),
  };

  return (
    <GameManagerContext.Provider value={value}>
      {children}
    </GameManagerContext.Provider>
  );
};

export const useGameManager = () => {
  const context = useContext(GameManagerContext);
  if (!context) {
    throw new Error('useGameManager must be used within a GameManagerProvider');
  }
  return context;
};
