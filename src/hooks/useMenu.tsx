import { useEffect, useState } from "react";
import { Menu } from "../Menu.ts";
import { getMenu } from "../PuzzleApi.ts";
import { MENU_NAME_MAP, MenuNameInfo } from "../MenuNames.tsx";

export function useMenu(menuName: string | undefined) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [menuInfo] = useState<MenuNameInfo>(
    menuName
      ? MENU_NAME_MAP[menuName]
      : {fullName: "AbandonedMall-March2025",
        shortName: "mall",
        titleNode: <div className={'menu-title'}>
          <p>-= Proti and Hepi =-</p>
          <p>in</p>
          <h3>The Abandoned Mall</h3>
        </div>
      });

  useEffect(() => {
    if (!menuName) {
      setError(new Error("There's no menu name: we need that to get all the puzzles."));
      setLoading(false);
      return;
    }

    setLoading(true);
    getMenu(menuInfo.fullName)
      .then(m => {
        setMenu(m);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      })
  }, [menuName, menuInfo]);

  return { menu, loading, error };
}
