import React, { useEffect, useState } from 'react';
import { Menu } from './Menu';
import { useGameManager } from '../../hooks/useGameManager';

interface PartyMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartyMenu: React.FC<PartyMenuProps> = ({ isOpen, onClose }) => {
  const gameManager = useGameManager();
  const [party, setParty] = useState<any>(null);

  useEffect(() => {
    if (!gameManager) return;

    const partySystem = gameManager.getPartySystem();
    if (partySystem) {
      setParty(partySystem.getParty());
    }
  }, [gameManager, isOpen]);

  if (!party) return null;

  return (
    <Menu title="Party" isOpen={isOpen} onClose={onClose}>
      <div className="party-list">
        {party.heroes.map((hero: any) => (
          <div key={hero.id} className="party-member">
            <div className="hero-avatar">{hero.avatar}</div>
            <div className="hero-info">
              <div className="hero-name">{hero.name}</div>
              <div className="hero-class">{hero.class}</div>
              <div className="hero-rarity">{hero.rarity}</div>
            </div>
            <div className="hero-stats">
              <div>ATK: {hero.stats.attack}</div>
              <div>DEF: {hero.stats.defense}</div>
              <div>HP: {hero.stats.health}</div>
            </div>
          </div>
        ))}
      </div>
    </Menu>
  );
};
