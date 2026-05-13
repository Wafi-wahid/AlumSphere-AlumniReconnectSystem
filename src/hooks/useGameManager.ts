import { useContext } from 'react';
import { GameManagerContext } from '../contexts/GameManagerContext';

export const useGameManager = () => {
  const context = useContext(GameManagerContext);
  if (!context) {
    throw new Error('useGameManager must be used within a GameManagerProvider');
  }
  return context;
};
