import axios from 'axios';
import {Menu} from "./Menu.ts";

const API_BASE_URL = '/puzzle-api';

export const getMenu = async (menuName: string): Promise<Menu> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${menuName}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch menu data:', error);
    throw error;
  }
};