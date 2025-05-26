import { ChangeEvent } from 'react';

interface SettingsContentProps {
  useLcdFont: boolean;
  setUseLcdFont: (value: boolean) => void;
}

export default function SettingsContent({ useLcdFont, setUseLcdFont }: SettingsContentProps) {

  const handleFontToggle = (e: ChangeEvent<HTMLInputElement>) => {
    const isShowLcdFontSelected = e.target.checked;
    setUseLcdFont(isShowLcdFontSelected);
    localStorage.setItem('useLcdFont', isShowLcdFontSelected.toString());
    // TODO Fire analytics for font preference change
  };

  return (
    <>
      <h2>Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={useLcdFont}
          onChange={handleFontToggle}
        />
        Use LCD font
      </label>
    </>
  );
}
