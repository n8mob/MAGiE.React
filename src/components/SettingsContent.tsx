import { ChangeEvent } from 'react';
import ReactGA4 from "react-ga4";

interface SettingsContentProps {
  useLcdFont: boolean;
  setUseLcdFont: (value: boolean) => void;
  storyFontAdjust: number;
  setStoryFontAdjust: (value: number) => void;
}

export default function SettingsContent({ useLcdFont, setUseLcdFont, storyFontAdjust, setStoryFontAdjust }: SettingsContentProps) {

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

  const adjustStoryFont = (delta: number) => {
    const next = storyFontAdjust + delta;
    setStoryFontAdjust(next);
    localStorage.setItem('storyFontAdjust', String(next));
    window.dispatchEvent(new StorageEvent('storage', { key: 'storyFontAdjust', newValue: String(next) }));
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
      <div>
        <span>Story font size</span>
        <button type="button" onClick={() => adjustStoryFont(-1)}>-</button>
        <span>{storyFontAdjust > 0 ? `+${storyFontAdjust}` : storyFontAdjust}</span>
        <button type="button" onClick={() => adjustStoryFont(1)}>+</button>
      </div>
    </>
  );
}
