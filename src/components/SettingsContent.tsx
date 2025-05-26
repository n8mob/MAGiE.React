import { ChangeEvent } from 'react';

interface SettingsContentProps {
  useHdFont: boolean;
  setUseHdFont: (value: boolean) => void;
}

export default function SettingsContent({ useHdFont, setUseHdFont }: SettingsContentProps) {

  const handleFontToggle = (e: ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.checked;
    setUseHdFont(newVal);
    localStorage.setItem('useHdFont', newVal.toString());
    // Fire analytics event if needed
  };

  return (
    <>
      <h2>Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={useHdFont}
          onChange={handleFontToggle}
        />
        Use LCD font
      </label>
    </>
  );
}
