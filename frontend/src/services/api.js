import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    throw error;
  }
);

// Helper to handle API requests
const apiRequest = async (url) => {
  try {
    const response = await api.get(url);
    return response.data || null;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    return null;
  }
};


export const searchSymbols = async (query) => {
  console.log(`[DEBUG] Searching symbols with query: ${query}`);
  try {
    const url = '/symbols';
    console.log(`[DEBUG] Sending GET request to ${url} with query:`, query);
    
    const response = await api.get(url, {
      params: { query }
    });
    
    console.log('[DEBUG] Received response:', response.data);
    // Handle both array response and object with results property
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  } catch (error) {
    console.error('[DEBUG] Error searching symbols:', error);
    if (error.response) {
      console.error('[DEBUG] Response data:', error.response.data);
      console.error('[DEBUG] Response status:', error.response.status);
    }
    return [];
  }
};

export const getStockMetrics = async (symbol) => {
  return apiRequest(`/metrics/${symbol}`);
};

export const getCompanyOverview = async (symbol) => {
  return apiRequest(`/overview/${symbol}`);
};

export const getFinancials = async (symbol) => {
  return apiRequest(`/financials/${symbol}`);
};

export const getNews = async (symbol) => {
  // In a real app, this would call your news endpoint
  return [
    { 
      id: 1, 
      title: `${symbol} Announces Major Gold Discovery at Northern Site`, 
      summary: 'Initial assays show high-grade mineralization across multiple drill holes',
      date: '2023-05-15',
      source: 'Mining Journal'
    },
    { 
      id: 2, 
      title: `${symbol} Reports Record Quarterly Production`, 
      summary: 'Company exceeds guidance with 15% production increase year-over-year',
      date: '2023-04-28',
      source: 'Resource World'
    },
    { 
      id: 3, 
      title: `${symbol} Secures $50M Financing for Mine Expansion`, 
      summary: 'Funds will be used to increase processing capacity by 40%',
      date: '2023-04-10',
      source: 'Finance Metals'
    }
  ];
};
