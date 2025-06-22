import React from 'react';
import { FiStar } from 'react-icons/fi';
import ValueMetrics from './ValueMetrics';
import MiningMetrics from './MiningMetrics';
import FinancialCharts from './FinancialCharts';
import NewsFeed from './NewsFeed';

const Dashboard = ({ stock, watchlist = [], onAddToWatchlist, onRemoveFromWatchlist }) => {
  // Safe access to properties
  const metrics = stock?.metrics || {};
  const financials = stock?.financials || {};
  const news = stock?.news || [];
  
  // Check if stock is in watchlist
  const isInWatchlist = watchlist.some(item => item.symbol === stock.info.symbol);
  
  return (
    <div className="mt-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {stock.info.symbol} - {stock.info.name}
              </h2>
              <p className="text-sm text-gray-500">
                {stock.info.exchange} | {stock.info.currency}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {metrics.price && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    ${metrics.price.toFixed(2)}
                  </div>
                  {metrics.change && (
                    <div className={`text-sm ${metrics.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.change >= 0 ? '↑' : '↓'} {Math.abs(metrics.change)}% (Today)
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => {
                  if (isInWatchlist) {
                    onRemoveFromWatchlist(stock.info.symbol);
                  } else {
                    onAddToWatchlist(stock.info.symbol, stock.info.name);
                  }
                }}
                className={`p-2 rounded-full ${
                  isInWatchlist 
                    ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              >
                <FiStar className={`h-5 w-5 ${isInWatchlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="md:col-span-2">
            <ValueMetrics metrics={metrics} />
            <MiningMetrics metrics={metrics} />
          </div>
          
          <div className="space-y-6">
            <FinancialCharts financials={financials} />
            <NewsFeed news={news} />
          </div>
        </div>
      </div>
      
      {stock.overview && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <h4 className="font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 text-sm">
                {stock.overview.Description || 'No description available'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">Sector</h4>
                <p className="text-gray-900">{stock.overview.Sector || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Industry</h4>
                <p className="text-gray-900">{stock.overview.Industry || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Market Cap</h4>
                <p className="text-gray-900">{stock.overview.MarketCapitalization || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800">PE Ratio</h4>
              <div className="mt-2 text-xl font-bold text-amber-700">
                {stock.overview.PERatio || 'N/A'}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800">Dividend Yield</h4>
              <div className="mt-2 text-xl font-bold text-blue-700">
                {stock.overview.DividendYield || 'N/A'}
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800">52-Week High</h4>
              <div className="mt-2 text-xl font-bold text-green-700">
                {stock.overview['52WeekHigh'] || 'N/A'}
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800">52-Week Low</h4>
              <div className="mt-2 text-xl font-bold text-purple-700">
                {stock.overview['52WeekLow'] || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Value Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800">Ben Graham Score</h4>
            <div className="mt-2 text-3xl font-bold text-amber-700">
              {calculateGrahamScore(metrics)}
            </div>
            <p className="mt-1 text-sm text-amber-600">
              {getGrahamAssessment(metrics)}
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800">Margin of Safety</h4>
            <div className="mt-2 text-3xl font-bold text-blue-700">
              {calculateMarginOfSafety(metrics)}
            </div>
            <p className="mt-1 text-sm text-blue-600">
              Based on intrinsic value calculation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for value analysis
const calculateGrahamScore = (metrics) => {
  if (!metrics || !metrics.pe_ratio) return 'N/A';
  
  let score = 0;
  
  // P/E Ratio (15 or less is good)
  if (metrics.pe_ratio <= 15) score += 2;
  else if (metrics.pe_ratio <= 20) score += 1;
  
  // P/B Ratio (1.5 or less is good)
  if (metrics.pb_ratio && metrics.pb_ratio <= 1.5) score += 2;
  else if (metrics.pb_ratio && metrics.pb_ratio <= 2) score += 1;
  
  // Debt/Equity (0.5 or less is good)
  if (metrics.debt_equity && metrics.debt_equity <= 0.5) score += 2;
  else if (metrics.debt_equity && metrics.debt_equity <= 1) score += 1;
  
  // Current Ratio (2 or more is good)
  if (metrics.current_ratio && metrics.current_ratio >= 2) score += 2;
  else if (metrics.current_ratio && metrics.current_ratio >= 1.5) score += 1;
  
  return `${score}/8`;
};

const getGrahamAssessment = (metrics) => {
  if (!metrics) return '';
  
  const assessments = [];
  
  if (metrics.pe_ratio > 15) {
    assessments.push('High P/E');
  }
  
  if (metrics.pb_ratio > 1.5) {
    assessments.push('High P/B');
  }
  
  if (metrics.debt_equity > 0.5) {
    assessments.push('Elevated Debt');
  }
  
  if (metrics.current_ratio < 1.5) {
    assessments.push('Low Liquidity');
  }
  
  return assessments.length > 0 
    ? `Watch: ${assessments.join(', ')}`
    : 'Strong value fundamentals';
};

const calculateMarginOfSafety = (metrics) => {
  if (!metrics || !metrics.price || !metrics.graham_ratio) return 'N/A';
  
  const margin = ((metrics.graham_ratio - metrics.price) / metrics.graham_ratio) * 100;
  return `${margin > 0 ? margin.toFixed(1) : 0}%`;
};

export default Dashboard;
