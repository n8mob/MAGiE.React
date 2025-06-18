import { useEffect, useState } from "react";
import { Menu } from "../Menu.ts";
import { getMenu } from "../PuzzleApi.ts";

export const MENU_NAME_MAP: Record<string, string> = {
  "mall": "AbandonedMall-March2025",
  "tutorial": "Tutorial-Feb2024",
  "bigGame": "BigGame_fromJSON"
};

export function useMenu(menuName: string | undefined) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fullMenuName] = useState<string>(menuName ? MENU_NAME_MAP[menuName] : "AbandonedMall-March2025");

  useEffect(() => {
    if (!fullMenuName) {
      setError(new Error("There's no menu name: we need that to get all the puzzles."));
      setLoading(false);
      return;
    }

    setLoading(true);
    getMenu(fullMenuName)
      .then(m => {
        setMenu(m);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      })
  }, [menuName, fullMenuName]);

  return { menu, loading, error };
}
