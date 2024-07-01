import {Category, Menu} from "./Menu.ts";

export default class Game {
  menu: Menu;
  category?: Category;

  public constructor(menu: Menu) {
    this.menu = menu;
  }

  public getCategories() {
    return Object.keys(this.menu.categories);
  }

  public startGame(categoryName: string) {
    this.category = this.menu.categories[categoryName]
  }
}