import axios from 'axios';

const API_BASE_URL = 'http://puzzleeditor2020.local:62443/menus';

export const getMenu = async (menuName: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${menuName}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch menu data:', error);
    throw error;
  }
};