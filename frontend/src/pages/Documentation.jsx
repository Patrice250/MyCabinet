import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Smartphone } from 'lucide-react';

const PhoneStatusMonitor = () => {
  const [status, setStatus] = useState({
    samsung: 'Loading...',
    iphone: 'Loading...',
    lastUpdated: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPhoneStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/phone-status');
        
        // Debug log to verify raw API response
        console.log('API Response:', response.data);

        // Transform API response to UI format
        setStatus({
          samsung: response.data.samsung === 'present' ? 'Present' : 'Missing',
          iphone: response.data.iphone === 'present' ? 'Present' : 'Missing',
          lastUpdated: new Date().toLocaleTimeString()
        });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch phone status:', err);
        setError('Connection error - trying again...');
        setStatus(prev => ({
          ...prev,
          samsung: 'Error',
          iphone: 'Error'
        }));
      }
    };

    // Initial fetch
    fetchPhoneStatus();
    
    // Set up polling every 3 seconds
    const intervalId = setInterval(fetchPhoneStatus, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  const getStatusStyle = (statusValue) => {
    switch (statusValue) {
      case 'Present':
        return 'text-green-600 font-bold';
      case 'Missing':
        return 'text-red-600 font-bold';
      case 'Error':
        return 'text-yellow-600 font-bold';
      default:
        return 'text-gray-500';
    }
  };

  const renderStatusIcon = (statusValue) => {
    const baseClasses = 'w-10 h-10 rounded-full p-2';
    
    switch (statusValue) {
      case 'Present':
        return (
          <div className={`${baseClasses} bg-green-100 text-green-600`}>
            <Smartphone className="fill-current" />
          </div>
        );
      case 'Missing':
        return (
          <div className={`${baseClasses} bg-red-100 text-red-600`}>
            <Smartphone className="fill-current" />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100 text-gray-500`}>
            <Smartphone />
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold text-center mb-6">Phone Status Monitor</h1>
      
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Samsung Slot */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 text-center">
          <div className="flex flex-col items-center space-y-2">
            {renderStatusIcon(status.samsung)}
            <h2 className="text-lg font-semibold">SAMSUNG</h2>
            <p className={`text-md ${getStatusStyle(status.samsung)}`}>
              {status.samsung}
            </p>
          </div>
        </div>

        {/* iPhone Slot */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 text-center">
          <div className="flex flex-col items-center space-y-2">
            {renderStatusIcon(status.iphone)}
            <h2 className="text-lg font-semibold">iPHONE</h2>
            <p className={`text-md ${getStatusStyle(status.iphone)}`}>
              {status.iphone}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Last updated: {status.lastUpdated || 'Never'}
      </div>
    </div>
  );
};

export default PhoneStatusMonitor;