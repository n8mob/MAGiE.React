import axios from 'axios';
import { PuzzleForDate, Menu, Puzzle, MenuData } from "./Menu.ts";

const API_BASE_URL = import.meta.env.VITE_MAGIE_PUZZLE_API;

export const getMenu = async (menuName: string): Promise<Menu> => {
  const rawMenuData = localStorage.getItem(menuName);
  let updatedAt: string | undefined;
  let cachedMenuData: MenuData | null = null;

  if (rawMenuData) {
    try {
      cachedMenuData = JSON.parse(rawMenuData);
      updatedAt = cachedMenuData?.updated_at;
    } catch (e) {
      localStorage.removeItem(menuName);
    }
  }

  let response;
  try {
    const menuUrl = `${API_BASE_URL}/menus/${menuName}`;
    const headers: Record<string, string> = {};
    if (updatedAt) {
      headers['If-Modified-Since'] = new Date(updatedAt).toUTCString();
    }
    response = await axios.get(menuUrl, {
      responseType: 'json',
      headers,
      validateStatus: (status) => status >= 200 && status < 400,
    });
  } catch (webError) {
    console.error('Failed to fetch or parse menu data:', webError);
    throw webError;
  }

  if (response.status === 304 && cachedMenuData) {
    return new Menu(cachedMenuData);
  }

  const data = response.data;
  if (!data || typeof data !== 'object' || !('categories' in data)) {
    throw new Error('Invalid menu data received from API');
  }

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
  let puzzleData: PuzzleForDate | null = null;

  if (storedPuzzleForDate) {
    try {
      puzzleData = JSON.parse(storedPuzzleForDate);
    } catch (error) {
      console.error('Failed to parse puzzle data from local storage:', error);
      localStorage.removeItem(dateKey);
    }
  }

  const datePuzzleUrl = `${API_BASE_URL}/puzzles/daily/${year}/${paddedMonth}/${paddedDay}/`;
  let response;
  const headers: Record<string, string> = {};
  try {
    if (puzzleData && puzzleData.updated_at) {
      headers['If-Modified-Since'] = new Date(puzzleData.updated_at).toUTCString();
    }
    response = await axios.get(datePuzzleUrl, { responseType: 'json', headers });
  } catch (webError) {
    console.error(`Failed to fetch or parse puzzle data for ${year}-${paddedMonth}-${paddedDay}:`, webError);
    throw webError;
  }

  if (response.status == 304 && puzzleData) {
    return puzzleData;
  }

  if (!checkPuzzleForDate(response.data)) {
    console.error('Invalid puzzle data format:', response.data);
    throw new Error('Invalid puzzle data format');
  }

  puzzleData = response.data;

  localStorage.setItem(dateKey, JSON.stringify(puzzleData));
  return puzzleData;
};
