import axios from 'axios';
import { PuzzleForDate, Menu } from "./Menu.ts";

const API_BASE_URL = import.meta.env.VITE_MAGIE_PUZZLE_API;

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

export const getDailyPuzzle = async (): Promise<PuzzleForDate> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/puzzles/today/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch daily puzzle:', error);
    throw error;
  }
}

export const getDailyPuzzleForDate = async (puzzleDate: Date): Promise<PuzzleForDate> => {
  return getDailyPuzzleForYearMonthDay(puzzleDate.getFullYear(), puzzleDate.getMonth() + 1, puzzleDate.getDate());
}

export const getDailyPuzzleForYearMonthDay = async (year: number, month: number, day: number): Promise<PuzzleForDate> => {
  const puzzleForDate = localStorage.getItem(`daily-puzzle-${year}-${month}-${day}`);
  if (puzzleForDate) {
    return JSON.parse(puzzleForDate);
  }

  const response = await axios.get(`${API_BASE_URL}/puzzles/daily/${year}/${month}/${day}/`);
  localStorage.setItem(`daily-puzzle-${year}-${month}-${day}`, JSON.stringify(response.data));
  return response.data;
};
