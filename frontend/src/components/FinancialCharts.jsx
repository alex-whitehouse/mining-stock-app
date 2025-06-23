import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialCharts = ({ financials }) => {
  // Extract income statement and balance sheet data
  const { incomeStatement = [], balanceSheet = [] } = financials;
  
  // Prepare income statement chart data
  const incomeData = incomeStatement.slice(0, 4).map(report => ({
    period: `Q${report.fiscalQuarter} ${report.fiscalYear}`,
    revenue: report.totalRevenue,
    netIncome: report.netIncome,
    operatingExpenses: report.operatingExpenses
  })).reverse(); // Show oldest first
  
  // Prepare balance sheet chart data
  const balanceData = balanceSheet.slice(0, 4).map(report => ({
    period: `Q${report.fiscalQuarter} ${report.fiscalYear}`,
    assets: report.totalAssets,
    liabilities: report.totalLiabilities,
    equity: report.totalShareholderEquity
  })).reverse(); // Show oldest first
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Financial Performance</h3>
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Income Statement (Millions USD)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incomeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toFixed(1)}M`, '']} />
                <Legend />
                <Bar dataKey="revenue" fill="#F59E0B" name="Revenue" />
                <Bar dataKey="netIncome" fill="#10B981" name="Net Income" />
                <Bar dataKey="operatingExpenses" fill="#EF4444" name="Operating Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Balance Sheet (Millions USD)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={balanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toFixed(1)}M`, '']} />
                <Legend />
                <Bar dataKey="assets" fill="#3B82F6" name="Total Assets" />
                <Bar dataKey="liabilities" fill="#EF4444" name="Total Liabilities" />
                <Bar dataKey="equity" fill="#10B981" name="Shareholder Equity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialCharts;