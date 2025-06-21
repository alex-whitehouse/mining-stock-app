import { API } from '@aws-amplify/api';

export const addToWatchlist = async (symbol, name) => {
  try {
    await API.post('miningApi', '/watchlist', {
      body: { symbol, name }
    });
    return true;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return false;
  }
};

export const removeFromWatchlist = async (symbol) => {
  try {
    await API.del('miningApi', '/watchlist', {
      body: { symbol }
    });
    return true;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return false;
  }
};

export const getWatchlist = async () => {
  try {
    const response = await API.get('miningApi', '/watchlist');
    return response;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
};