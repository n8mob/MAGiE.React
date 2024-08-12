import axios from 'axios';
import {DailyPuzzle, Menu} from "./Menu.ts";

const API_BASE_URL = 'https://puzzles.magiegame.com';

export const getMenu = async (menuName: string): Promise<Menu> => {
  const menuData = localStorage.getItem(menuName);
  if (menuData) {
    return JSON.parse(menuData);
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/menus/${menuName}`);
    localStorage.setItem(menuName, JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Failed to fetch menu data:', error);
    throw error;
  }
};

export const getDailyPuzzle = async (): Promise<DailyPuzzle> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/puzzles/today/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch daily puzzle:', error);
    throw error;
  }
}

export const getDailyPuzzleForDate = async (year: number, month: number, day: number): Promise<DailyPuzzle> => {
  const puzzleForDate = localStorage.getItem(`daily-puzzle-${year}-${month}-${day}`);
  if (puzzleForDate) {
    return JSON.parse(puzzleForDate);
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/puzzles/daily/${year}/${month}/${day}/`);
    localStorage.setItem(`daily-puzzle-${year}-${month}-${day}`, JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily puzzle: for ${year}-${month}-${day}`, error);
    throw error;
  }
};
