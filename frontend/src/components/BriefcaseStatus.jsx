import { useState, useEffect } from 'react';
import axios from 'axios';

// 1. Create a persistent storage outside the component
let persistedAngle = 0;
let isInitialized = false;

export default function ServoSlider() {
  // 2. Initialize state with persisted value
  const [angle, setAngle] = useState(persistedAngle);
  const [loading, setLoading] = useState(false);
  const BACKEND_API = 'http://localhost:5002';

  // 3. One-time initialization on mount
  useEffect(() => {
    if (!isInitialized) {
      isInitialized = true;
      axios.get(`${BACKEND_API}/api/servo/status`)
        .then(res => {
          const currentAngle = res.data.angle || 0;
          persistedAngle = currentAngle;
          setAngle(currentAngle);
        })
        .catch(console.error);
    }
  }, []);

  const handleChange = async (e) => {
    const newAngle = parseInt(e.target.value);
    setAngle(newAngle);
    persistedAngle = newAngle; // Update persisted value
    setLoading(true);

    const user = JSON.parse(localStorage.getItem('user'));
    const userID = user?.id;

    if (!userID) {
      alert("Please log in again");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${BACKEND_API}/api/servo/angle`, {
       angle: newAngle,
       userID
       });

    } catch (err) {
      console.error('Update failed:', err);
      // Revert to last known good value
      setAngle(persistedAngle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xs mx-auto mt-10 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold text-center mb-4">REMOTE SHOWCASE</h2>
      
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600">CLOSE</span>
        <input
          type="range"
          min="0"
          max="90"
          step="1"
          value={angle}
          onChange={handleChange}
          disabled={loading}
          className="flex-grow"
        />
        <span className="text-sm font-medium text-gray-600">OPEN</span>
      </div>

      <div className="text-center mt-2 text-gray-700">
        Angle: <span className="font-bold text-blue-600">{angle}°</span>
        {loading && <span className="ml-2 text-yellow-500">(Updating...)</span>}
      </div>
    </div>
  );
}