import React from 'react';

const MiningMetrics = ({ metrics }) => {
  if (!metrics) return null;
  
  // Calculate mining-specific metrics
  const allInCost = metrics.aisc || 0;
  const goldPrice = 1950; // Current gold price (would be dynamic in production)
  const margin = goldPrice - allInCost;
  const marginPercent = (margin / goldPrice) * 100;
  
  const productionPerShare = metrics.production_oz && metrics.shares_outstanding
    ? metrics.production_oz / metrics.shares_outstanding
    : 0;
    
  const resourcesPerShare = metrics.resources_oz && metrics.shares_outstanding
    ? metrics.resources_oz / metrics.shares_outstanding
    : 0;
  
  const getMarginClass = (percent) => {
    if (percent >= 30) return 'text-green-700 bg-green-100';
    if (percent >= 20) return 'text-yellow-700 bg-yellow-100';
    if (percent >= 10) return 'text-orange-700 bg-orange-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Mining Operations</h3>
        <p className="mt-1 text-sm text-gray-500">Production and cost metrics</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
        <div className="p-4 rounded-lg bg-amber-50">
          <div className="text-sm font-medium text-amber-700">AISC (All-In Sustaining Cost)</div>
          <div className="text-2xl font-bold text-amber-900 mt-1">
            {allInCost ? `$${allInCost}/oz` : 'N/A'}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${getMarginClass(marginPercent)}`}>
          <div className="text-sm font-medium">Operating Margin</div>
          <div className="text-2xl font-bold mt-1">
            {marginPercent ? `${marginPercent.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-xs mt-1">
            ${margin.toFixed(0)}/oz at ${goldPrice} gold
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-blue-50">
          <div className="text-sm font-medium text-blue-700">Annual Production</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {metrics.production_oz ? `${formatNumber(metrics.production_oz)} oz` : 'N/A'}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {productionPerShare > 0 ? `${productionPerShare.toFixed(4)} oz/share` : ''}
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-teal-50">
          <div className="text-sm font-medium text-teal-700">Resource Reserves</div>
          <div className="text-2xl font-bold text-teal-900 mt-1">
            {metrics.resources_oz ? `${formatNumber(metrics.resources_oz)} oz` : 'N/A'}
          </div>
          <div className="text-xs text-teal-600 mt-1">
            {resourcesPerShare > 0 ? `${resourcesPerShare.toFixed(4)} oz/share` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatNumber = (num) => {
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toString();
};

export default MiningMetrics;