import axios from 'axios';
import { PuzzleForDate, Menu, Puzzle } from "./Menu.ts";

const API_BASE_URL = import.meta.env.VITE_MAGIE_PUZZLE_API;

export const getMenu = async (menuName: string): Promise<Menu> => {
  const rawMenuData = localStorage.getItem(menuName);
  if (rawMenuData) {
    try {
      const menuData = JSON.parse(rawMenuData);
      return new Menu(menuData);
    } catch (e) {
      // If parsing fails, remove the bad cache and continue to fetch
      localStorage.removeItem(menuName);
    }
  }

  let response;
  try {
    const menuUrl = `${API_BASE_URL}/menus/${menuName}`;
    console.log(`Fetching menu data from ${menuUrl}`);
    response = await axios.get(menuUrl, {responseType: 'json'});
  } catch (webError) {
    console.error('Failed to fetch or parse menu data:', webError);
    throw webError;
  }

  const data = response.data;
  // Validate that data is a valid Menu
  if (!data || typeof data !== 'object' || !('categories' in data)) {
    throw new Error('Invalid menu data received from API');
  }

  // Try to construct a Menu instance to further validate
  let menuInstance;
  try {
    menuInstance = new Menu(data);
  } catch (parsingError) {
    throw new Error('Menu data could not be parsed into a Menu instance');
  }
  localStorage.setItem(menuName, JSON.stringify(data));
  return menuInstance;
}

export const getDailyPuzzleForDate = async (puzzleDate: Date): Promise<PuzzleForDate> => {
  return getDailyPuzzleForYearMonthDay(puzzleDate.getFullYear(), puzzleDate.getMonth() + 1, puzzleDate.getDate());
}

function checkPuzzleForDate(data: unknown): data is PuzzleForDate {
  return (
    typeof data === "object"
    && data !== null
    && "date" in data
    && typeof (data as { date: unknown }).date === "string"
    && "puzzle" in data
    && isPuzzle((data as { puzzle: unknown }).puzzle)
    && "encoding" in data
    && typeof (data as { encoding: unknown }).encoding === "object"
    && (data as { encoding: unknown }).encoding !== null
  );
}

function isPuzzle(data: unknown): data is Puzzle {
  return (
    typeof data === "object" &&
    data !== null &&
    "slug" in data &&
    typeof (data as { slug: unknown }).slug === "string" &&
    "clue" in data &&
    Array.isArray((data as { clue: unknown }).clue) &&
    "winText" in data &&
    typeof (data as { winText: unknown }).winText === "string" &&
    "encoding_name" in data &&
    typeof (data as { encoding_name: unknown }).encoding_name === "string"
  );
}

export const getDailyPuzzleForYearMonthDay = async (
  year: number,
  month: number,
  day: number
): Promise<PuzzleForDate> => {
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
