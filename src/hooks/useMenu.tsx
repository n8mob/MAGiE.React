import { useEffect, useState } from "react";
import { Menu } from "../Menu.ts";
import { getMenu } from "../PuzzleApi.ts";

export function useMenu(menuName: string | undefined) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!menuName) {
      setError(new Error("There's no menu name: we need that to get all the puzzles."));
      setLoading(false);
      return;
    }
    setLoading(true);
    getMenu(menuName)
      .then(m => {
        setMenu(m);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      })
  }, [menuName]);

  return { menu, loading, error };
}
