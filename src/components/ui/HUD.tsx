import React, { useEffect, useState } from 'react';
import { useGameManager } from '../../hooks/useGameManager';

interface HUDProps {
  className?: string;
}

export const HUD: React.FC<HUDProps> = ({ className = '' }) => {
  const gameManager = useGameManager();
  const [resources, setResources] = useState({
    gold: 0,
    wood: 0,
    stone: 0,
    crystals: 0,
    energy: 0,
  });
  const [partyHealth, setPartyHealth] = useState<{ [heroId: string]: number }>({});

  useEffect(() => {
    if (!gameManager) return;

    const updateResources = () => {
      const resourceSystem = gameManager.getResourceSystem();
      if (resourceSystem) {
        setResources({
          gold: resourceSystem.getResource('gold'),
          wood: resourceSystem.getResource('wood'),
          stone: resourceSystem.getResource('stone'),
          crystals: resourceSystem.getResource('crystals'),
          energy: resourceSystem.getResource('energy'),
        });
      }
    };

    const updatePartyHealth = () => {
      const partySystem = gameManager.getPartySystem();
      const combatSystem = gameManager.getCombatSystem();
      if (partySystem && combatSystem) {
        const party = partySystem.getParty();
        const healthData: { [heroId: string]: number } = {};
        
        party.heroes.forEach(hero => {
          const health = combatSystem.getEntityHealth(hero.id);
          if (health) {
            healthData[hero.id] = health.percentage;
          }
        });
        
        setPartyHealth(healthData);
      }
    };

    const interval = setInterval(() => {
      updateResources();
      updatePartyHealth();
    }, 1000);

    updateResources();
    updatePartyHealth();

    return () => clearInterval(interval);
  }, [gameManager]);

  return (
    <div className={`hud ${className}`}>
      {/* Resource Bar */}
      <div className="resource-bar">
        <ResourceIcon type="gold" value={resources.gold} />
        <ResourceIcon type="wood" value={resources.wood} />
        <ResourceIcon type="stone" value={resources.stone} />
        <ResourceIcon type="crystals" value={resources.crystals} />
        <ResourceIcon type="energy" value={resources.energy} />
      </div>

      {/* Party Health Bars */}
      <div className="party-health">
        {Object.entries(partyHealth).map(([heroId, health]) => (
          <HealthBar key={heroId} health={health} />
        ))}
      </div>

      {/* Menu Buttons */}
      <div className="menu-buttons">
        <button onClick={() => gameManager?.openMenu('inventory')}>Inventory</button>
        <button onClick={() => gameManager?.openMenu('party')}>Party</button>
        <button onClick={() => gameManager?.openMenu('settings')}>Settings</button>
      </div>
    </div>
  );
};

interface ResourceIconProps {
  type: string;
  value: number;
}

const ResourceIcon: React.FC<ResourceIconProps> = ({ type, value }) => {
  const icons: { [key: string]: string } = {
    gold: '💰',
    wood: '🪵',
    stone: '🪨',
    crystals: '💎',
    energy: '⚡',
  };

  return (
    <div className="resource-icon">
      <span className="icon">{icons[type] || '📦'}</span>
      <span className="value">{value}</span>
    </div>
  );
};

interface HealthBarProps {
  health: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ health }) => {
  return (
    <div className="health-bar">
      <div className="health-fill" style={{ width: `${health}%` }} />
    </div>
  );
};
