import React, { useEffect } from 'react';
import './styles.css';

export default function ElementalNexus() {
  useEffect(() => {
    // Load the game script
    const script = document.createElement('script');
    script.src = '/src/elemental-nexus/game.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup when component unmounts
      document.body.removeChild(script);

      // Clean up any game-related elements
      const gameCanvas = document.getElementById('gameCanvas');
      if (gameCanvas) {
        gameCanvas.innerHTML = '';
      }
    };
  }, []);

  return (
    <div>
      <div id="gameCanvas"></div>
      <button id="upgradeBtn">Elements</button>

      <div className="modal-overlay" id="upgradeModal">
        <div className="modal-content">
          <button className="close-modal" id="closeModal">×</button>
          <div className="modal-title">Elemental Nexus</div>
          <div className="modal-subtitle">Choose Your Element</div>
          <div className="elements-grid">
            <div className="element-card fire" data-element="fire">
              <div className="element-icon">🔥</div>
              <div className="element-name">Fire</div>
              <div className="element-desc">Launch blazing projectiles that burn enemies over time</div>
            </div>
            <div className="element-card earth" data-element="earth">
              <div className="element-icon">🪨</div>
              <div className="element-name">Earth</div>
              <div className="element-desc">Deploy rotating shields and unleash earthquakes</div>
            </div>
            <div className="element-card water" data-element="water">
              <div className="element-icon">💧</div>
              <div className="element-name">Water</div>
              <div className="element-desc">Control waves that push enemies and heal yourself</div>
            </div>
            <div className="element-card air" data-element="air">
              <div className="element-icon">💨</div>
              <div className="element-name">Air</div>
              <div className="element-desc">Wield a sweeping sword that cuts through foes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="health-bar-container">
        <div className="health-bar-fill" id="healthBarFill"></div>
        <div className="health-bar-text" id="healthBarText">100 / 100</div>
      </div>

      <div className="kill-counter" id="killCounter">0</div>
    </div>
  );
}
