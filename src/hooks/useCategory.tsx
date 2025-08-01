import { Menu } from "../model.ts";

export function useCategory(menu: Menu | null, categoryKeyOrIndex: string | number | undefined) {
  if (categoryKeyOrIndex === undefined || categoryKeyOrIndex === null) {
    console.debug("No category key or index provided.");
    return {category: null};
  } else if (!menu) {
    console.debug(`Asking for category[${categoryKeyOrIndex}], but no menu provided.`);
    return {category: null};
  } else if (!menu.categories) {
    console.debug(`Asking for category[${categoryKeyOrIndex}], but menu has no categories.`);
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
