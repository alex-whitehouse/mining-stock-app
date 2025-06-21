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
    const response = await api.get('/symbols');
    const data = response.data || [];
    
    if (!query) return data;
    
    return data.filter(item => 
      item.symbol.includes(query.toUpperCase()) || 
      (item.name && item.name.toLowerCase().includes(query.toLowerCase()))
    );
  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
};

export const getStockMetrics = async (symbol) => {
  return apiRequest(`/metrics/${symbol}`);
};

export const getFinancials = async (symbol) => {
  // In a real app, this would call your financials endpoint
  return {
    quarterly: [
      { period: 'Q1 2023', revenue: 45.2, costs: 32.1, net: 8.7 },
      { period: 'Q2 2023', revenue: 48.7, costs: 33.8, net: 9.2 },
      { period: 'Q3 2023', revenue: 52.1, costs: 35.4, net: 10.5 },
      { period: 'Q4 2023', revenue: 55.6, costs: 37.2, net: 11.8 },
    ],
    annual: [
      { year: 2020, revenue: 162.4, net: 28.5 },
      { year: 2021, revenue: 178.9, net: 32.1 },
      { year: 2022, revenue: 195.3, net: 38.7 },
      { year: 2023, revenue: 217.6, net: 46.3 },
    ]
  };
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