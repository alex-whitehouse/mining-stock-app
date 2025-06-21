import React from 'react';

const ValueMetrics = ({ metrics }) => {
  if (!metrics) return null;
  
  const getQualityClass = (value, goodThreshold, warningThreshold) => {
    if (value <= goodThreshold) return 'text-green-700 bg-green-100';
    if (value <= warningThreshold) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Value Investing Metrics</h3>
        <p className="mt-1 text-sm text-gray-500">Ben Graham fundamentals analysis</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
        <div className={`p-4 rounded-lg ${getQualityClass(metrics.pe_ratio, 15, 25)}`}>
          <div className="text-sm font-medium">P/E Ratio</div>
          <div className="text-2xl font-bold mt-1">
            {metrics.pe_ratio ? metrics.pe_ratio.toFixed(2) : 'N/A'}
          </div>
          <div className="text-xs mt-1">
            {metrics.pe_ratio <= 15 ? 'Excellent' : metrics.pe_ratio <= 25 ? 'Acceptable' : 'High'}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${getQualityClass(metrics.pb_ratio, 1.5, 2)}`}>
          <div className="text-sm font-medium">P/B Ratio</div>
          <div className="text-2xl font-bold mt-1">
            {metrics.pb_ratio ? metrics.pb_ratio.toFixed(2) : 'N/A'}
          </div>
          <div className="text-xs mt-1">
            {metrics.pb_ratio <= 1.5 ? 'Excellent' : metrics.pb_ratio <= 2 ? 'Acceptable' : 'High'}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${getQualityClass(metrics.debt_equity, 0.5, 1)}`}>
          <div className="text-sm font-medium">Debt/Equity</div>
          <div className="text-2xl font-bold mt-1">
            {metrics.debt_equity ? metrics.debt_equity.toFixed(2) : 'N/A'}
          </div>
          <div className="text-xs mt-1">
            {metrics.debt_equity <= 0.5 ? 'Low' : metrics.debt_equity <= 1 ? 'Moderate' : 'High'}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${getQualityClass(-metrics.current_ratio, -2, -1.5)}`}>
          <div className="text-sm font-medium">Current Ratio</div>
          <div className="text-2xl font-bold mt-1">
            {metrics.current_ratio ? metrics.current_ratio.toFixed(2) : 'N/A'}
          </div>
          <div className="text-xs mt-1">
            {metrics.current_ratio >= 2 ? 'Strong' : metrics.current_ratio >= 1.5 ? 'Adequate' : 'Weak'}
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-indigo-50">
          <div className="text-sm font-medium text-indigo-700">Market Cap</div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">
            {metrics.market_cap ? formatMarketCap(metrics.market_cap) : 'N/A'}
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-purple-50">
          <div className="text-sm font-medium text-purple-700">Graham Number</div>
          <div className="text-2xl font-bold text-purple-900 mt-1">
            {metrics.graham_ratio ? `$${metrics.graham_ratio.toFixed(2)}` : 'N/A'}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Intrinsic Value Estimate
          </div>
        </div>
      </div>
    </div>
  );
};

const formatMarketCap = (value) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
};

export default ValueMetrics;