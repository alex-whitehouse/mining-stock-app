import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialCharts = ({ financials }) => {
  // Mock data for demonstration - in a real app, this would come from the API
  const quarterlyData = [
    { period: 'Q1 2023', revenue: 45.2, costs: 32.1, net: 8.7 },
    { period: 'Q2 2023', revenue: 48.7, costs: 33.8, net: 9.2 },
    { period: 'Q3 2023', revenue: 52.1, costs: 35.4, net: 10.5 },
    { period: 'Q4 2023', revenue: 55.6, costs: 37.2, net: 11.8 },
  ];
  
  const annualData = [
    { year: 2020, revenue: 162.4, net: 28.5 },
    { year: 2021, revenue: 178.9, net: 32.1 },
    { year: 2022, revenue: 195.3, net: 38.7 },
    { year: 2023, revenue: 217.6, net: 46.3 },
  ];
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Financial Performance</h3>
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Quarterly Results (Millions USD)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={quarterlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}M`, '']} />
                <Legend />
                <Bar dataKey="revenue" fill="#F59E0B" name="Revenue" />
                <Bar dataKey="costs" fill="#EF4444" name="Costs" />
                <Bar dataKey="net" fill="#10B981" name="Net Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Annual Trends (Millions USD)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={annualData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}M`, '']} />
                <Legend />
                <Bar dataKey="revenue" fill="#F59E0B" name="Revenue" />
                <Bar dataKey="net" fill="#10B981" name="Net Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialCharts;