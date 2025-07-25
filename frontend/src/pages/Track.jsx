import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, fromUnixTime } from 'date-fns';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Alert icon for map markers
const alertIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Socket.io connection
const socket = io('http://localhost:5002', {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket'],
  autoConnect: true
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

const Track = () => {
  const [position, setPosition] = useState([-2.148252, 30.542430]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('Never');
  const [gpsStatus, setGpsStatus] = useState('Waiting for GPS signal...');
  const [isRealTime, setIsRealTime] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10000);
  const [lastApiTimestamp, setLastApiTimestamp] = useState(null);
  const [alertMode, setAlertMode] = useState(false);
  const [safeZoneCenter] = useState([-2.148252, 30.542430]);
  const [safeZoneRadius, setSafeZoneRadius] = useState(50); // meters
  const [gpsDriftThreshold, setGpsDriftThreshold] = useState(10); // meters
  const [alertHistory, setAlertHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const mapRef = useRef(null);

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('http://localhost:5002/api/gps/settings');
        if (res.data) {
          setSafeZoneRadius(res.data.safe_zone_radius * 111320); // Convert degrees to meters
          setGpsDriftThreshold(res.data.gps_drift_threshold * 111320);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return format(new Date(), 'hh:mm:ss a');
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return format(date, 'hh:mm:ss a');
    } catch {
      return format(new Date(), 'hh:mm:ss a');
    }
  };

  // Handle incoming alerts and GPS updates
  useEffect(() => {
    socket.on('connect_error', (err) => {
      console.log('Socket connection error:', err.message);
    });

    socket.on('alert', (data) => {
      const alertMessage = `ALERT: Device moved out of safe zone at ${formatTime(data.timestamp)}`;
      
      toast.error(alertMessage, {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
      });
      
      setAlertMode(true);
      setGpsStatus('ALERT: Device out of safe zone!');
      
      setAlertHistory(prev => [
        {
          timestamp: data.timestamp,
          message: alertMessage,
          latitude: data.latitude,
          longitude: data.longitude
        },
        ...prev.slice(0, 9)
      ]);
    });

    socket.on('gps_update', (data) => {
      if (data.is_alert) {
        setAlertMode(true);
      } else {
        setAlertMode(false);
        setGpsStatus('Live GPS Tracking');
      }
      setPosition([data.latitude, data.longitude]);
      setLastUpdate(formatTime(new Date(data.timestamp)));
      setLastApiTimestamp(new Date(data.timestamp));
    });

    return () => {
      socket.off('alert');
      socket.off('gps_update');
      socket.off('connect_error');
    };
  }, []);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5002/api/gps/location');
      const { latitude, longitude, timestamp, is_alert } = res.data;
      
      if (latitude && longitude) {
        const newPosition = [latitude, longitude];
        setPosition(newPosition);
        const apiTimestamp = timestamp ? new Date(timestamp) : new Date();
        setLastApiTimestamp(apiTimestamp);
        setLastUpdate(formatTime(apiTimestamp));
        setAlertMode(is_alert);
        setGpsStatus(is_alert ? 'ALERT: Device out of safe zone!' : 'Live GPS Tracking');
        setIsRealTime(true);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch GPS location", err);
      setIsRealTime(false);
      setGpsStatus('Using last known position');
      setError("Failed to get live location. Data may be outdated.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await axios.post('http://localhost:5002/api/gps/settings', {
        safe_zone_radius: safeZoneRadius / 111320, // Convert meters to degrees
        gps_drift_threshold: gpsDriftThreshold / 111320
      });
      setShowSettings(false);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      if (lastApiTimestamp) {
        const now = new Date();
        const secondsDiff = (now - lastApiTimestamp) / 1000;
        if (secondsDiff > 0) {
          const updatedTime = new Date(lastApiTimestamp.getTime() + secondsDiff * 1000);
          setLastUpdate(formatTime(updatedTime));
        }
      }
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [lastApiTimestamp]);

  const handleRefresh = () => {
    setLoading(true);
    fetchLocation();
  };

  const acknowledgeAlert = () => {
    setAlertMode(false);
    setGpsStatus('Live GPS Tracking');
    toast.dismiss();
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">GPS Tracking Dashboard</h2>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            alertMode ? 'bg-red-100 text-red-800' : 
            isRealTime ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {gpsStatus}
          </span>
          {alertMode && (
            <button 
              onClick={acknowledgeAlert}
              className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition"
            >
              Acknowledge Alert
            </button>
          )}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
          >
            {showSettings ? 'Hide Settings' : 'Geo-Fence Settings'}
          </button>
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h3 className="text-lg font-semibold mb-3">Geo-Fence Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safe Zone Radius (meters)
              </label>
              <input
                type="number"
                value={safeZoneRadius}
                onChange={(e) => setSafeZoneRadius(Number(e.target.value))}
                className="w-full p-2 border rounded"
                min="100"
                max="10000"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPS Drift Threshold (meters)
              </label>
              <input
                type="number"
                value={gpsDriftThreshold}
                onChange={(e) => setGpsDriftThreshold(Number(e.target.value))}
                className="w-full p-2 border rounded"
                min="10"
                max="2000"
                step="10"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading GPS data...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
              <p>{error}</p>
              <p className="text-xs mt-1">Last successful update: {lastUpdate}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '450px' }}>
            <MapContainer 
              center={position} 
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
              whenCreated={(map) => {
                mapRef.current = map;
                setTimeout(() => map.invalidateSize(), 100);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <Circle
                center={safeZoneCenter}
                radius={safeZoneRadius}
                color={alertMode ? 'red' : 'blue'}
                fillColor={alertMode ? 'red' : 'blue'}
                fillOpacity={0.2}
              />
              
              <Marker 
                position={position} 
                icon={alertMode ? alertIcon : L.Icon.Default.prototype}
              >
                <Popup className="font-medium">
                  <div className="space-y-1">
                    <div className="font-bold">Showcase Current Location</div>
                    <div>Latitude: {position[0].toFixed(6)}</div>
                    <div>Longitude: {position[1].toFixed(6)}</div>
                    <div className="text-sm text-gray-500">
                      Last update: {lastUpdate}
                      {!isRealTime && <span className="text-red-500"> (offline)</span>}
                    </div>
                    {alertMode && (
                      <div className="text-red-500 font-bold">ALERT: Out of safe zone!</div>
                    )}
                  </div>
                </Popup>
              </Marker>
              
              <Marker position={safeZoneCenter}>
                <Popup>
                  <div className="font-medium">
                    <div className="font-bold">Safe Zone Center</div>
                    <div>Radius: {(safeZoneRadius/1000).toFixed(1)} km</div>
                    <div>Drift Threshold: {gpsDriftThreshold} m</div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Coordinates</h3>
              <p className="mt-2 text-lg font-mono">
                {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Distance from center: {calculateDistance(
                  position[0], position[1],
                  safeZoneCenter[0], safeZoneCenter[1]
                ).toFixed(0)} meters
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Last Update</h3>
              <p className="mt-2 text-lg">
                <span className="font-mono">{lastUpdate}</span>
                {isRealTime && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Live
                  </span>
                )}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Refresh Rate</h3>
              <div className="mt-2 flex items-center space-x-2">
                <select 
                  value={refreshInterval} 
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Track;