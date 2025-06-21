import React, { useState, useEffect } from 'react';
import { 
  searchSymbols, 
  getStockMetrics, 
  getFinancials, 
  getNews 
} from './services/api';
import { getCurrentUser, signOut } from './services/auth';
import { 
  getWatchlist, 
  addToWatchlist, 
  removeFromWatchlist 
} from './services/watchlist'; // Add this import
import Dashboard from './components/Dashboard';
import StockSearch from './components/StockSearch';
import AuthModal from './components/AuthModal';
import Watchlist from './components/Watchlist';
import './index.css';
import { Amplify } from '@aws-amplify/core';
import { API } from '@aws-amplify/api';
import { Auth } from '@aws-amplify/auth';
import awsConfig from './aws-exports';

// Initialize Amplify
Amplify.configure(awsConfig);
API.configure(awsConfig);
Auth.configure(awsConfig);

function App() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    checkAuth();
  }, []);

  // Load watchlist when user changes
  useEffect(() => {
    const loadWatchlist = async () => {
      if (user) {
        setLoadingWatchlist(true);
        try {
          const list = await getWatchlist();
          setWatchlist(list);
        } catch (err) {
          console.error('Error loading watchlist:', err);
        } finally {
          setLoadingWatchlist(false);
        }
      } else {
        setWatchlist([]);
      }
    };
    
    loadWatchlist();
  }, [user]);

  const handleStockSelect = async (stock) => {
    setLoading(true);
    setError(null);
    
    try {
      setSelectedStock({
        info: stock,
        metrics: null,
        financials: null,
        news: null
      });
      
      // Fetch all data in parallel
      const [metrics, financials, news] = await Promise.all([
        getStockMetrics(stock.symbol),
        getFinancials(stock.symbol),
        getNews(stock.symbol)
      ]);
      
      setSelectedStock({
        info: stock,
        metrics,
        financials,
        news
      });
    } catch (err) {
      setError('Failed to load stock data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user) => {
    setUser(user);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setWatchlist([]);
  };

  const handleAddToWatchlist = async (symbol, name) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    try {
      await addToWatchlist(symbol, name);
      setWatchlist(prev => [...prev, { symbol, name }]);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    }
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-amber-600 to-yellow-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Mining Stock Analyzer</h1>
              <p className="text-amber-100 mt-2">
                Value investing metrics for gold and silver mining companies
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center">
                  <span className="text-white mr-3 hidden sm:block">
                    {user.attributes.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white text-amber-700 py-1 px-3 rounded-md text-sm font-medium hover:bg-amber-50 transition"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                    onClick={() => setAuthModalOpen(true)}
                    className="bg-white text-amber-700 py-1 px-3 rounded-md text-sm font-medium hover:bg-amber-50 transition"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <StockSearch 
              onSelect={handleStockSelect} 
              onAddToWatchlist={handleAddToWatchlist}
            />
            
            {loading && (
              <div className="mt-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading stock analysis...</p>
              </div>
            )}
            
            {error && (
              <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {selectedStock && !loading && (
              <Dashboard 
                stock={selectedStock} 
                watchlist={watchlist}
                onAddToWatchlist={handleAddToWatchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
              />
            )}
            
            {!selectedStock && !loading && (
              <div className="mt-12 text-center">
                <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Search for a mining stock
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter a TSXV stock symbol to see detailed value analysis
                </p>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <Watchlist 
              items={watchlist} 
              loading={loadingWatchlist}
              onSelect={handleStockSelect}
              onRemove={handleRemoveFromWatchlist}
            />
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Mining Stock Analyzer &copy; {new Date().getFullYear()} - Value Investing for Resource Stocks
          </p>
        </div>
      </footer>
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;