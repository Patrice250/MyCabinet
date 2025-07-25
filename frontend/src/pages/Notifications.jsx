import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const Notifications = () => {
  const [denials, setDenials] = useState([]);
  const denialIds = useRef(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const playAlertSound = () => {
    const audio = new Audio('/alert.mp3');
    audio.play().catch((err) => console.error('Audio error:', err));
  };

  const getNotificationMessage = (denial) => {
    if (denial.method === 'PHYSICAL') {
      return `Fingerprint Denied at ${formatDateTime(denial.created_at)}`;
    }
    // Extract phone from the action text we logged
    const phoneMatch = denial.action.match(/phone: (\d+)/);
    const phone = phoneMatch ? phoneMatch[1] : 'unknown';
    return `Failed login attempt (${phone}) at ${formatDateTime(denial.created_at)}`;
  };

  const fetchDenials = async () => {
    try {
      const { data } = await axios.get('http://localhost:5002/api/denials/latest');

      data.forEach((denial) => {
        if (!denialIds.current.has(denial.id)) {
          denialIds.current.add(denial.id);
          
          toast.error(getNotificationMessage(denial), {
            duration: 5000,
          });

          if (soundEnabled) {
            playAlertSound();
          }
        }
      });

      setDenials(data);
    } catch (err) {
      console.error('Error fetching denials:', err);
    }
  };

  const handleDeleteDenial = async (id) => {
    try {
      await axios.delete(`http://localhost:5002/api/denials/${id}`);
      setDenials((prev) => prev.filter((d) => d.id !== id));
      denialIds.current.delete(id);
      toast.success('Deleted successfully!');
    } catch (error) {
      console.error('Error deleting denial:', error);
      toast.error('Failed to delete denial');
    }
  };

  useEffect(() => {
    fetchDenials();
    const interval = setInterval(fetchDenials, 3000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Security Notifications</h2>

      <label className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={() => setSoundEnabled(!soundEnabled)}
        />
        <span className="text-sm">Enable Sound Notifications</span>
      </label>

      <ul className="space-y-2">
        {denials.map((denial) => (
          <li 
            key={denial.id} 
            className={`p-3 rounded shadow flex justify-between items-center ${
              denial.method === 'PHYSICAL' ? 'bg-red-100' : 'bg-orange-100'
            }`}
          >
            <span>
              {denial.method === 'PHYSICAL' ? 'Fingerprint Denied' : 'Failed Login'} 
              at {formatDateTime(denial.created_at)}
              <br />
              <small className="text-gray-600">{denial.action}</small>
            </span>
            <button
              onClick={() => handleDeleteDenial(denial.id)}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;