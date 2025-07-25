import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (pageNumber = 1, filterValue = filter) => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5002/api/history', {
        params: {
          page: pageNumber,
          limit: 10,
          filter: filterValue
        }
      });
      setHistory(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page, filter);
  }, [page, filter]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(1);
  };

  const nextPage = () => {
    if (page < totalPages) setPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(prev => prev - 1);
  };

  const exportCSV = () => {
    const csv = [
      ['User', 'Action', 'Method', 'Date & Time', 'Status'],
      ...history.map(h => [
        h.first_name || 'Unknown',
        h.action,
        h.method,
        new Date(h.created_at).toLocaleString(),
        h.status
      ])
    ]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `showcase_history_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Showcase History</h2>
        <select
          value={filter}
          onChange={handleFilterChange}
          className="border px-3 py-1 rounded"
        >
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border mb-4 text-sm">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="p-2">User</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Method</th>
                  <th className="p-2">Date & Time</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{item.first_name || 'Unknown'}</td>
                      <td className="p-2">{item.action}</td>
                      <td className="p-2 capitalize">{item.method?.toLowerCase()}</td>
                      <td className="p-2">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="p-2 capitalize">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'granted'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status?.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      No history records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={exportCSV}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Export CSV
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={prevPage}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Previous
              </button>
              <span className="font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default History;
