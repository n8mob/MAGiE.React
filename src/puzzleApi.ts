import axios from 'axios';
import {Menu} from "./Menu.ts";

const API_BASE_URL = 'http://puzzleeditor2020.local:62443/menus';

export const getMenu = async (menuName: string): Promise<Menu> => {
  const cachedMenu = localStorage.getItem(menuName);
  if (!cachedMenu) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${menuName}`);
      localStorage.setItem(menuName, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
      throw error;
    }
  } else {
    return JSON.parse(cachedMenu);
  }
};