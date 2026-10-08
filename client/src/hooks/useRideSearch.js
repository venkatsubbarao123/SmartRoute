import { useState, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export const useRideSearch = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchRides = useCallback(async (params) => {
    const { from, to, fromCoords, toCoords, date, time } = params;
    if (!from || !to) {
      toast.error('Please enter pickup and destination locations');
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const query = new URLSearchParams();
      if (fromCoords) {
        query.append('pickupLat', fromCoords[1]);
        query.append('pickupLon', fromCoords[0]);
      }
      if (toCoords) {
        query.append('dropLat', toCoords[1]);
        query.append('dropLon', toCoords[0]);
      }
      if (date) query.append('date', date);
      if (time) query.append('time', time);
      query.append('from', from);
      query.append('to', to);

      const res = await api.get(`/rides/search?${query.toString()}`);
      setRides(res.data.data || []);
      setSearched(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
      setRides([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetSearch = useCallback(() => {
    setRides([]);
    setSearched(false);
  }, []);

  return { rides, loading, searched, searchRides, resetSearch };
};
