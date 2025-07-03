import { Menu } from "../Menu.ts";

export function useCategory(menu: Menu | null, categoryKeyOrIndex: string | number | undefined) {
  if (!menu || !menu.categories || categoryKeyOrIndex == null) {
    return {category: null};
  }

  const categoryKeys = Object.keys(menu.categories);

  let categoryKey: string;
  if (typeof categoryKeyOrIndex === "number") {
    // It's a number, treat as index
    categoryKey = categoryKeys[categoryKeyOrIndex];
  } else if (/^\d+$/.test(categoryKeyOrIndex)) {
    // It's a string integer, treat as index
    categoryKey = categoryKeys[parseInt(categoryKeyOrIndex, 10)];
  } else {
    // It's a string key (category name)
    categoryKey = categoryKeyOrIndex;
  }

  const category = menu.categories[categoryKey] || null;
  if (category && (!category.name || category.name === '')) {
    category.name = categoryKey;
  }
  return { category };
}
