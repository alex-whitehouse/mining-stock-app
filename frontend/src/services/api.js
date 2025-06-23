import axios from 'axios';

// Create API instance with enhanced logging
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Log API base URL for debugging
console.log(`[API] Using base URL: ${process.env.REACT_APP_API_URL || 'not set'}`);

// Add request interceptor for logging
api.interceptors.request.use(config => {
  console.log(`[API] Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Enhanced response interceptor with error detail preservation
api.interceptors.response.use(
  response => {
    console.log(`[API] Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    let errorDetails = 'Network Error';
    let serverMessage = '';
    let errorDetailCode = '';
    
    if (error.response) {
      // Server responded with non-2xx status
      errorDetails = `Server Error: ${error.response.status}`;
      console.error(`[API] Response Error: ${error.response.status} ${error.config.url}`, error.response.data);
      
      // Extract server error message and detail code
      if (error.response.data) {
        serverMessage = error.response.data.error || '';
        errorDetailCode = error.response.data.error_detail || '';
      }
    } else if (error.request) {
      // Request was made but no response received
      errorDetails = 'No Response from Server';
      console.error('[API] Network Error: No response received', error.request);
      errorDetailCode = 'NetworkError';
    } else {
      // Something happened in setting up the request
      errorDetails = `Request Error: ${error.message}`;
      console.error('[API] Request Setup Error:', error.message);
      errorDetailCode = 'RequestSetupError';
    }
    
    // Enhance error object with custom details
    const enhancedError = new Error(
      serverMessage || errorDetails
    );
    enhancedError.details = errorDetails;
    enhancedError.serverMessage = serverMessage;
    enhancedError.detailCode = errorDetailCode;
    enhancedError.config = error.config;
    enhancedError.response = error.response;
    
    throw enhancedError;
  }
);

// Helper to handle API requests
const apiRequest = async (url) => {
  try {
    const response = await api.get(url);
    return response.data || null;
  } catch (error) {
    console.error(`[API] Request failed: ${url}`, error);
    throw error; // Re-throw for caller to handle
  }
};


export const searchSymbols = async (query) => {
  console.log(`[API] Searching symbols: ${query}`);
  try {
    const response = await api.get('/symbols', { params: { query } });
    // Handle both array response and object with results property
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  } catch (error) {
    console.error('[API] Symbol search failed:', error);
    return [];
  }
};

export const getCompanyOverview = async (symbol) => {
  try {
    return await apiRequest(`/overview?symbol=${symbol}`);
  } catch (error) {
    console.error(`[API] Failed to get overview for ${symbol}`, error);
    throw error; // Propagate to caller for UI handling
  }
};
export const getFinancials = async (symbol) => {
  try {
    const data = await apiRequest(`/financials?symbol=${symbol}`);
    return {
      incomeStatement: data.incomeStatement,
      balanceSheet: data.balanceSheet
    };
  } catch (error) {
    console.error(`[API] Failed to get financials for ${symbol}`, error);
    return null;
  }
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
