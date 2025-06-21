import React from 'react';
import { FiStar, FiX } from 'react-icons/fi';

const Watchlist = ({ items, loading, onSelect, onRemove }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">My Watchlist</h3>
        <p className="mt-1 text-sm text-gray-500">Your favorite mining stocks</p>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
              <FiStar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No stocks in your watchlist</p>
            <p className="text-sm text-gray-400 mt-1">
              Add stocks to track them here
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.symbol} className="py-3 flex justify-between items-center">
                <div>
                  <button 
                    onClick={() => onSelect({ symbol: item.symbol, name: item.name })}
                    className="text-left"
                  >
                    <div className="font-medium text-gray-900">{item.symbol}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                      {item.name}
                    </div>
                  </button>
                </div>
                <button 
                  onClick={() => onRemove(item.symbol)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Watchlist;