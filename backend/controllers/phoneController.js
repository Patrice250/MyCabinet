// controllers/phoneController.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const getPhoneStatus = async (req, res) => {
  try {
    const esp32Url = `${process.env.ESP32_IP}/phone/status`;
    const response = await axios.get(esp32Url);
    const data = response.data;

    if (!data || typeof data !== 'object') {
      return res.status(502).json({ error: 'Invalid response from ESP32' });
    }

    res.json({
      samsung: data.samsung || 'absent',
      iphone: data.iphone || 'absent',
      lastCheck: data.lastCheck || Date.now()
    });
  } catch (error) {
    console.error(' Failed to fetch phone status:', error.message);
    res.status(500).json({ error: 'Failed to fetch phone status' });
  }
};
