import React, { useEffect, useState } from 'react';
import { Menu } from './Menu';
import { useGameManager } from '../../hooks/useGameManager';

interface InventoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryMenu: React.FC<InventoryMenuProps> = ({ isOpen, onClose }) => {
  const gameManager = useGameManager();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!gameManager) return;

    const inventorySystem = gameManager.getInventorySystem();
    if (inventorySystem) {
      setItems(inventorySystem.getAllItems());
    }
  }, [gameManager, isOpen]);

  return (
    <Menu title="Inventory" isOpen={isOpen} onClose={onClose}>
      <div className="inventory-grid">
        {items.map((item) => (
          <div key={item.id} className="inventory-item">
            <div className="item-icon">{item.icon}</div>
            <div className="item-name">{item.name}</div>
            <div className="item-quantity">×{item.quantity}</div>
          </div>
        ))}
      </div>
    </Menu>
  );
};
