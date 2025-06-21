import React, { useState, useEffect } from 'react';
import { searchSymbols } from '../services/api';

const StockSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query.length > 1) {
      setLoading(true);
      setError(null);
      const timer = setTimeout(() => {
        searchSymbols(query)
          .then(data => {
            setResults(data);
            setIsOpen(true);
          })
          .catch(err => {
            setError('Failed to search symbols');
            console.error(err);
          })
          .finally(() => setLoading(false));
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  const handleSelect = (stock) => {
    onSelect(stock);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex rounded-md shadow-sm">
        <div className="relative flex-grow focus-within:z-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-10 py-4 focus:border-amber-500 focus:ring-amber-500 sm:text-lg"
            placeholder="Search TSXV mining stocks..."
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-2 text-gray-500">Searching...</div>
          ) : error ? (
            <div className="px-4 py-2 text-red-500">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">No stocks found</div>
          ) : (
            results.map((stock) => (
              <div
                key={`${stock.symbol}-${stock.exchange}`}
                className="cursor-pointer hover:bg-amber-50 px-4 py-2"
                onClick={() => handleSelect(stock)}
              >
                <div className="font-medium text-gray-900">{stock.symbol}</div>
                <div className="text-gray-500 text-sm truncate">{stock.name}</div>
                <div className="text-xs text-gray-400">{stock.exchange}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StockSearch;