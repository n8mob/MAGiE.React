import { ChangeEvent, useState } from 'react';

export default function SettingsContent() {
  const [useHdFont, setUseHdFont] = useState(() => {
    return localStorage.getItem('useHdFont') === 'true';
  });

  const handleFontToggle = (e: ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.checked;
    setUseHdFont(newVal);
    localStorage.setItem('useHdFont', newVal.toString());
    // Fire analytics event if needed
  };
p
  return (
    <>
      <h2>Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={useHdFont}
          onChange={handleFontToggle}
        />
        Use retro LCD font
      </label>
    </>
  );
}
