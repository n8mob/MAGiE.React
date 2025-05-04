import axios from 'axios';
import { PuzzleForDate, Menu, Puzzle } from "./Menu.ts";

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

function checkPuzzleForDate(data: unknown): data is PuzzleForDate {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.date === "string" &&
    isPuzzle(data.puzzle) &&
    typeof data.encoding === "object" &&
    data.encoding !== null
  );
}

function isPuzzle(data: unknown): data is Puzzle {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.slug === "string" &&
    Array.isArray(data.clue) &&
    typeof data.winText === "string" &&
    typeof data.encoding_name === "string"
  );
}


export const getDailyPuzzleForYearMonthDay = async (year: number, month: number, day: number): Promise<PuzzleForDate> => {
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  const dateKey = `daily-puzzle-${year}-${paddedMonth}-${paddedDay}`;

  const storedPuzzleForDate = localStorage.getItem(dateKey);
  let puzzleData: PuzzleForDate;

  if (storedPuzzleForDate) {
    try {
      puzzleData = JSON.parse(storedPuzzleForDate);
      return puzzleData;
    } catch (error) {
      console.error('Failed to parse puzzle data from local storage:', error);
      localStorage.removeItem(dateKey);
    }
  }

  const datePuzzleUrl = `${API_BASE_URL}/puzzles/daily/${year}/${paddedMonth}/${paddedDay}/`;
  const response = await axios.get(datePuzzleUrl);
  if (!checkPuzzleForDate(response.data)) {
    console.error('Invalid puzzle data format:', response.data);
    throw new Error('Invalid puzzle data format');
  }
  puzzleData = response.data;


  localStorage.setItem(dateKey, JSON.stringify(puzzleData));
  return puzzleData;
};
