// Central mapping for menu short names, full names, and display names
import { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface MenuNameInfo {
  shortName: string;
  fullName: string;
  /** Human-readable area name, for page titles. Not a slug — see displayArea(). */
  displayName: string;
  titleNode: ReactNode;
}

export const MENU_NAME_MAP: Record<string, MenuNameInfo> = {
  chocolate2: {
    shortName: "chocolate2",
    fullName: "Chocolate_Testing_2026_July",
    displayName: "Chocolate Testing",
    titleNode: (
      <div className={'menu-title'}>
        <p>
          //// CAUTION ////<br />
          /// CHOCOLATE ///
        </p>
      </div>
    )
  },

  mall: {
    shortName: "mall",
    fullName: "AbandonedMall-March2025",
    displayName: "Mall",
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
    displayName: "Tutorial",
    titleNode: (
      <div className={'menu-title'}>
        <h3>-= How to Play =-</h3>
        <p><Link to={'/tutorial/'}>TUTORIAL</Link></p>
      </div>
    )
  },
  vintage: {
    shortName: "vintage",
    fullName: "VintagePuzzles",
    displayName: "Vintage",
    titleNode: (
      <div className={'menu-title'}>
        <h3>-= RETRO MAGiE =-</h3>
      </div>
    )
  },
  bigGame: {
    shortName: "bigGame",
    fullName: "BigGame_fromJSON",
    displayName: "Big Game",
    titleNode: (
      <div className={'menu-title'}>
        <p>-= Proti and Hepi =-</p>
        <p>in</p>
        <h3>Big Game</h3>
      </div>
    )
  },
  chocolate: {
    shortName: "chocolate",
    fullName: "AbandonedMall-March2025",
    displayName: "Chocolate",
    titleNode: (
      <div className={'menu-title'}>
        <p>-= Proti and Hepi =-</p>
        <p>in</p>
        <h3>The Abandoned Mall</h3>
      </div>
    )
  },
};

/** Area name for page titles. Falls back to the route segment for unmapped menus. */
export const displayArea = (menuName: string | undefined): string =>
  (menuName && MENU_NAME_MAP[menuName]?.displayName) || menuName || "MAGiE";
