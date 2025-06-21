import React from 'react';

const NewsFeed = ({ news }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Company News</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {news && news.length > 0 ? (
          news.map((item, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex-shrink-0" />
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                  <button className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-800">
                    Read full story →
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No recent news available
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <button className="text-sm font-medium text-amber-600 hover:text-amber-800">
          View all news
        </button>
      </div>
    </div>
  );
};

export default NewsFeed;