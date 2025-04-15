import './MagieScreen.css';
import React from "react";

export default function MagieDisplay({ children }: { children: React.ReactNode }) {
  return (
    <div className="bezel-grid">
      <div className="corner tl">
        <div className="corner-img tl-img" />
      </div>
      <div className="edge top" />
      <div className="corner tr">
        <div className="corner-img tr-img" />
      </div>

      <div className="edge left" />
      <div className="center-content">{children}</div>
      <div className="edge right" />

      <div className="corner bl">
        <div className="corner-img bl-img" />
      </div>
      <div className="edge bottom" />
      <div className="corner br">
        <div className="corner-img br-img" />
      </div>
    </div>
  );
}
