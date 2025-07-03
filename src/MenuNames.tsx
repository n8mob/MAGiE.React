// Central mapping for menu short names, full names, and display names
import { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface MenuNameInfo {
  shortName: string;
  fullName: string;
  titleNode: ReactNode;
}

export const MENU_NAME_MAP: Record<string, MenuNameInfo> = {
  mall: {
    shortName: "mall",
    fullName: "AbandonedMall-March2025",
    titleNode: (
      <div className={'menu-title'}>
        <p>-= Proti and Hepi =-</p>
        <p>in</p>
        <h3>The Abandoned Mall</h3>
      </div>
    )
  },
  tutorial: {
    shortName: "tutorial",
    fullName: "Tutorial-June2025",
    titleNode: (
      <div className={'menu-title'}>
        <h3>-= How to Play =-</h3>
        <p><Link to={'/tutorial/'}>TUTORIAL</Link></p>
      </div>
    )
  },
  bigGame: {
    shortName: "bigGame",
    fullName: "BigGame_fromJSON",
    titleNode: (
      <div className={'menu-title'}>
        <p>-= Proti and Hepi =-</p>
        <p>in</p>
        <h3>Big Game</h3>
      </div>
    )
  }
};
