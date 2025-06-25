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
    ReactGA4.event('font_preference_change', {
      source: 'settings_dialog',
      action: 'toggle_font',
      value: isShowLcdFontSelected ? 'hd44780' : 'press_start_2p',
    });
  };

  return (
    <>
      <h2>Setting</h2>
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
