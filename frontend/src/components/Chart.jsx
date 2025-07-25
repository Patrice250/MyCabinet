import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Chart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5002/api/chart/weekly-access-stats');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch chart data', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Weekly Access Method vs Status</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Physical_granted" fill="#4ade80" name="Physical - Granted" />
          <Bar dataKey="Physical_denied" fill="#f87171" name="Physical - Denied" />
          <Bar dataKey="Remote_granted" fill="#60a5fa" name="Remote - Granted" />
          <Bar dataKey="Remote_denied" fill="#fbbf24" name="Remote - Denied" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
