import {useEffect, useState} from 'react';
import './FirstTimeOverlay.css'; // Optional: add styling here

const FirstTimeOverlay = ({onClose}: { onClose: () => void }) => {
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
        <button className="help-display" onClick={handleManualOpen} title="How to Play">?</button>
      )}

      {isVisible && (
        <div className="first-time-overlay">
          <div className="first-time-modal">
            <h2>Welcome to <span className="magie-case">MAGiE</span></h2>
            <p><em>A retro-future puzzle game with bits and a totally rad mall!</em></p>

            <h3>🔍 How it works</h3>
            <ul>
              <li>Each puzzle hides a secret message—your job is to figure it out.</li>
              <li>Decoding puzzles will show you the bits, and you de-codie those bits, and type the message into the
                text box.
              </li>
            </ul>

            <h3>🕹️ Tips</h3>
            <ul>
              <li>Guess as many times as you like—no penalty for wrong guesses.</li>
              <li>New puzzles appear daily—you can also revisit previous days.</li>
            </ul>

            <div className="first-time-overlay-inputs">
              <button className="help-dismiss" onClick={handleClose}>Got it — Start Playing</button>
            </div>
            <div className="coming-soon">
              <h3>🛍️ Coming Soon: more puzzle types!</h3>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FirstTimeOverlay;
