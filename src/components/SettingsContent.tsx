import { ChangeEvent } from 'react';
import ReactGA4 from "react-ga4";

interface SettingsContentProps {
  useLcdFont: boolean;
  setUseLcdFont: (value: boolean) => void;
}

export default function SettingsContent({ useLcdFont, setUseLcdFont }: SettingsContentProps) {

  const handleFontToggle = (e: ChangeEvent<HTMLInputElement>) => {
    const isShowLcdFontSelected = e.target.checked;
    setUseLcdFont(isShowLcdFontSelected);
    localStorage.setItem('useLcdFont', isShowLcdFontSelected.toString());
    ReactGA4.event('FontPreferenceChange', {
      label: useLcdFont ? 'HD44780' : 'Press Start 2P'
    });
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
