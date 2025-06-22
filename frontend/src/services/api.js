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
  try {
    // Send query to backend for server-side filtering
    const response = await api.get('/symbols', {
      params: { query }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error searching symbols:', error);
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
