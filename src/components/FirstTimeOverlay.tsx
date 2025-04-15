import React, { useState, useEffect } from 'react';
import './FirstTimeOverlay.css'; // Optional: add styling here

const FirstTimeOverlay = ({ onClose }: { onClose: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const isFirstVisit = localStorage.getItem('isFirstVisit') !== 'false';

    if (isFirstVisit) {
      setIsVisible(true);
      localStorage.setItem('isFirstVisit', 'false');
    }

    setHasMounted(true);
  }, []);

  const handleManualOpen = () => {
    setIsVisible(true);
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  return (
    <>
      {hasMounted && !isVisible && (
        <button className="help-button" onClick={handleManualOpen} title="How to Play">?</button>
      )}

      {isVisible && (
        <div className="first-time-overlay">
          <div className="first-time-modal">
            <h2>Welcome to MAGiE</h2>
            <p><em>A retro-future puzzle game set in a decaying AI-run mall.</em></p>

            <h3>🔍 How it works</h3>
            <ul>
              <li>Each puzzle hides a secret message encoded in binary.</li>
              <li>Your job: <strong>decode</strong> it, one letter at a time.</li>
              <li>Letters are translated into numbers (e.g. A = 1, B = 2), then to bits.</li>
            </ul>

            <h3>🕹️ Tips</h3>
            <ul>
              <li>Click a bit to flip it (0 ↔ 1).</li>
              <li>Each guess is checked against the secret and gives you visual feedback.</li>
              <li>You can try as many guesses as you like.</li>
              <li>New puzzles appear daily—you can also revisit previous days.</li>
            </ul>

            <button onClick={handleClose}>Got it — Start Playing</button>
          </div>
        </div>
      )}
    </>
  );
};

export default FirstTimeOverlay;
