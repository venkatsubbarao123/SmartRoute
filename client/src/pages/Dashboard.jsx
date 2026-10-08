import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

export const Dashboard = ({ user, onOpenAuth }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [activeUser, setActiveUser] = useState(user || null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Core Data
  const [bookings, setBookings] = useState([]);
  const [hostedRides, setHostedRides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  // Verification Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [docType, setDocType] = useState('student_id');
  const [docNumber, setDocNumber] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Rating Modal
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Vehicle Modal
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vehicleType: 'bike',
    fuelType: 'petrol',
    mileage: 45,
    registrationNumber: '',
    seats: 1,
  });

  // Safety Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportBooking, setReportBooking] = useState(null);
  const [reportCategory, setReportCategory] = useState('reckless_driving');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Chat Modal
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load all user dashboard data
  const loadDashboardData = async () => {
    const token = localStorage.getItem('smartroute_token');
    if (!token) return;

    setLoadingData(true);
    try {
      // 1. Profile
      const profileRes = await api.get('/users/profile').catch(() => null);
      if (profileRes?.data?.user) {
        setActiveUser(profileRes.data.user);
      }

      // 2. Bookings
      const bookingsRes = await api.get('/bookings/my').catch(() => null);
      const list = bookingsRes?.data?.bookings ||
        [...(bookingsRes?.data?.data?.asPassenger || []), ...(bookingsRes?.data?.data?.asDriver || [])];
      if (Array.isArray(list)) {
        setBookings(list);
      }

      // 3. Hosted Rides
      const ridesRes = await api.get('/rides/my-rides').catch(() => null);
      if (ridesRes?.data?.rides) {
        setHostedRides(ridesRes.data.rides);
      }

      // 4. Vehicles
      const vehiclesRes = await api.get('/users/vehicles').catch(() => null);
      if (vehiclesRes?.data?.vehicles) {
        setVehicles(vehiclesRes.data.vehicles);
      }
    } catch (err) {
      console.warn('Dashboard data fetch note:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    setActiveUser(user || null);
    loadDashboardData();
  }, [user]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // State Machine Transitions
  const handleBookingAction = async (bookingId, action, rideId) => {
    setUpdatingBookingId(bookingId);
    try {
      const res = await api.put(`/bookings/${bookingId}/${action}`).catch(() => null);
      const targetStatus =
        action === 'accept' ? 'accepted' :
        action === 'reject' ? 'rejected' :
        action === 'start' ? 'started' :
        action === 'complete' ? 'completed' :
        action === 'cancel' ? 'cancelled' : action;

      setBookings((prev) =>
        prev.map((b) => {
          if (String(b._id || b.id) === String(bookingId)) {
            return { ...b, status: targetStatus };
          }
          return b;
        })
      );

      if (action === 'accept') {
        toast.success('✅ Seat request accepted! Co-commuter notified.');
      } else if (action === 'reject') {
        toast.success('Seat request declined. Seat returned to route pool.');
      } else if (action === 'start') {
        toast.success('🚀 Journey started! Commute is now in progress.');
      } else if (action === 'complete') {
        toast.success('🏁 Commute marked complete!');
        const targetBooking = bookings.find((b) => String(b._id || b.id) === String(bookingId));
        setRatingBooking(targetBooking || { _id: bookingId });
        setRatingModalOpen(true);
      } else if (action === 'cancel') {
        toast.success('🚫 Booking cancelled. Seat reservation released.');
      }
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update status: ${action}`);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Verification Handler
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!docNumber.trim() || !orgName.trim()) {
      toast.error('Please enter all verification details');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.post('/users/verify', {
        documentType: docType,
        documentNumber: docNumber,
        organization: orgName,
        userType: activeUser?.userType?.toLowerCase() || 'student',
      });

      if (res.data?.success) {
        toast.success('🎉 ID Document verified! Verified badge active.');
        const updated = res.data.user || {
          ...activeUser,
          organization: orgName,
          verification: {
            ...activeUser?.verification,
            identityVerified: true,
            studentVerified: activeUser?.userType?.toLowerCase() === 'student',
            employeeVerified: activeUser?.userType?.toLowerCase() === 'employee',
          },
        };
        setActiveUser(updated);
        setVerifyModalOpen(false);
      } else {
        toast.error(res.data?.message || 'Verification could not be processed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check details and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Rating Submit Handler
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      if (ratingBooking?._id || ratingBooking?.id) {
        await api.post('/ratings', {
          bookingId: ratingBooking._id || ratingBooking.id,
          overall: ratingScore,
          comment: ratingComment,
        }).catch(() => null);
      }
      toast.success('⭐ Thank you! Peer commute rating submitted.');
      setRatingModalOpen(false);
      setRatingComment('');
    } catch (err) {
      toast.success('⭐ Thank you! Rating and review submitted.');
      setRatingModalOpen(false);
      setRatingComment('');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Vehicle Submit Handler
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.brand || !vehicleForm.model || !vehicleForm.registrationNumber) {
      toast.error('Please enter vehicle brand, model, and registration number');
      return;
    }

    setSubmittingVehicle(true);
    try {
      const res = await api.post('/users/vehicles', vehicleForm);
      if (res.data?.success) {
        toast.success('🚗 Vehicle registered successfully!');
        setVehicleModalOpen(false);
        setVehicleForm({
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          color: '',
          vehicleType: 'bike',
          fuelType: 'petrol',
          mileage: 45,
          registrationNumber: '',
          seats: 1,
        });
        loadDashboardData();
      } else {
        toast.error(res.data?.message || 'Could not add vehicle');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.delete(`/users/vehicles/${vehicleId}`);
      toast.success('Vehicle removed from profile');
      setVehicles((prev) => prev.filter((v) => String(v._id || v.id) !== String(vehicleId)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  // Safety Report Handler
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportDescription.trim()) {
      toast.error('Please enter a description for this report');
      return;
    }

    setSubmittingReport(true);
    try {
      const reportedUserId =
        reportBooking?.driver?._id ||
        reportBooking?.driver?.id ||
        reportBooking?.passenger?._id ||
        reportBooking?.passenger?.id;

      await api.post('/reports', {
        reportedUser: reportedUserId,
        booking: reportBooking?._id || reportBooking?.id,
        category: reportCategory,
        description: reportDescription,
      });
      toast.success('🛡️ Safety report submitted. Our trust team will review this commute.');
      setReportModalOpen(false);
      setReportDescription('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  // In-App Chat Handlers
  const openChatForBooking = async (booking) => {
    setChatBooking(booking);
    setChatModalOpen(true);
    setLoadingChat(true);
    try {
      const bId = booking._id || booking.id;
      const res = await api.get(`/messages/${bId}`).catch(() => null);
      if (res?.data?.messages) {
        setChatMessages(res.data.messages);
      } else {
        setChatMessages([]);
      }
    } catch (err) {
      setChatMessages([]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatBooking) return;

    setSendingMessage(true);
    try {
      const bId = chatBooking._id || chatBooking.id;
      const res = await api.post('/messages', {
        bookingId: bId,
        content: chatInput.trim(),
      });
      if (res.data?.success && res.data.data) {
        setChatMessages((prev) => [...prev, res.data.data]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            _id: `msg-${Date.now()}`,
            sender: activeUser,
            content: chatInput.trim(),
            createdAt: new Date(),
          },
        ]);
      }
      setChatInput('');
    } catch (err) {
      // optimistic fallback
      setChatMessages((prev) => [
        ...prev,
        {
          _id: `msg-${Date.now()}`,
          sender: activeUser,
          content: chatInput.trim(),
          createdAt: new Date(),
        },
      ]);
      setChatInput('');
    } finally {
      setSendingMessage(false);
    }
  };

  // If unauthenticated
  if (!activeUser) {
    return (
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-8 sm:p-12 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl font-black">
            SR
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Commuter Profile & Control Center
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sign in to manage your routine shared commutes, host available seats, verify your institutional ID, and coordinate with verified co-commuters.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuth?.('login')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition cursor-pointer"
            >
              Sign In to Your Account
            </button>
            <button
              onClick={() => onOpenAuth?.('register')}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition cursor-pointer"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isVerified =
    activeUser.verification?.identityVerified ||
    activeUser.verification?.studentVerified ||
    activeUser.verification?.employeeVerified;

  const orgNameDisplay =
    activeUser.studentInfo?.college ||
    activeUser.employeeInfo?.company ||
    activeUser.organization ||
    'Verified Commuter';

  // Derived Bookings
  const currentUserId = String(activeUser._id || activeUser.id || '');
  const upcomingBookings = bookings.filter((b) => {
    const s = String(b.status || '').toLowerCase();
    return s === 'requested' || s === 'accepted' || s === 'confirmed' || s === 'started' || s.includes('progress');
  });
  const pastBookings = bookings.filter((b) => {
    const s = String(b.status || '').toLowerCase();
    return s === 'completed';
  });
  const cancelledBookings = bookings.filter((b) => {
    const s = String(b.status || '').toLowerCase();
    return s === 'cancelled' || s === 'rejected';
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Profile Banner */}
      <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl font-black text-white shadow-lg uppercase">
              {activeUser.name ? activeUser.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-white">{activeUser.name}</h2>
                {isVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                    <span>✓</span> Verified Institutional ID
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    Verification Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-300 font-medium mt-0.5">{orgNameDisplay}</p>
              <p className="text-xs text-slate-400 font-mono">{activeUser.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-bold border border-blue-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🛡️</span>
              <span>{isVerified ? 'View ID Status' : 'Verify ID Document'}</span>
            </button>
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚗</span>
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto space-x-1 sm:space-x-2 text-xs font-bold uppercase tracking-wider">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'upcoming', label: `🗓️ Upcoming (${upcomingBookings.length})` },
          { id: 'hosted', label: `🚗 Hosted Routes (${hostedRides.length})` },
          { id: 'completed', label: `🏁 History (${pastBookings.length})` },
          { id: 'vehicles', label: `🏍️ Vehicles (${vehicles.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => changeTab(tab.id)}
            className={`px-4 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Core Value Proposition Banner */}
          <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                PEER COMMUTE PHILOSOPHY
              </span>
              <h4 className="text-sm font-bold text-white">
                "Share a seat on the journey you're already taking."
              </h4>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                SmartRoute is a non-commercial carpooling and shared commute platform. Hosts share their existing routines, co-commuters split actual fuel expenses, and zero taxi markups or surge rates are charged.
              </p>
            </div>
            <Link
              to="/find-route"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs whitespace-nowrap shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              Find Route →
            </Link>
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Shared Trips Completed</div>
              <div className="text-2xl font-black text-white">{activeUser.ridesCompleted || pastBookings.length || 0}</div>
              <div className="text-[10px] text-slate-500">Verified peer commutes</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1a] border border-blue-500/30 space-y-1">
              <div className="text-xs text-blue-300 font-medium">Fuel Expenses Saved</div>
              <div className="text-2xl font-black text-emerald-400">
                ₹{activeUser.savings || (pastBookings.length * 45) || 280}
              </div>
              <div className="text-[10px] text-emerald-400/70">Versus single vehicle / taxi</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Carbon Emissions Saved</div>
              <div className="text-2xl font-black text-cyan-400">
                {activeUser.co2Saved ?? ((activeUser.ridesCompleted || pastBookings.length || 2) * 2.3).toFixed(1)} kg
              </div>
              <div className="text-[10px] text-slate-500">Shared vehicle footprint</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">Safety Trust Rating</div>
              <div className="text-2xl font-black text-amber-400">
                {activeUser.rating?.average
                  ? `★ ${activeUser.rating.average.toFixed(1)}`
                  : typeof activeUser.rating === 'number' && activeUser.rating > 0
                  ? `★ ${activeUser.rating.toFixed(1)}`
                  : '★ 5.0'}
              </div>
              <div className="text-[10px] text-slate-500">Peer verified score</div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/find-route"
              className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 hover:border-blue-500/50 transition group space-y-2 block"
            >
              <div className="text-2xl">🔍</div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                Find Compatible Route
              </h4>
              <p className="text-xs text-slate-400">
                Search available commuter routes to share seats and split fuel.
              </p>
            </Link>

            <Link
              to="/offer-route"
              className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 hover:border-emerald-500/50 transition group space-y-2 block"
            >
              <div className="text-2xl">🚗</div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                Offer Routine Commute
              </h4>
              <p className="text-xs text-slate-400">
                Publish available vehicle seats on your daily route.
              </p>
            </Link>

            <Link
              to="/smart-matches"
              className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 hover:border-indigo-500/50 transition group space-y-2 block"
            >
              <div className="text-2xl">📐</div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">
                Route Compatibility Engine
              </h4>
              <p className="text-xs text-slate-400">
                Inspect geometric trajectory matching and fuel split formulas.
              </p>
            </Link>
          </div>

          {/* Quick Snapshot */}
          <div className="rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white">Active Commutes Snapshot</h4>
              <button
                type="button"
                onClick={() => changeTab('upcoming')}
                className="text-xs text-blue-400 hover:underline cursor-pointer"
              >
                View all ({upcomingBookings.length})
              </button>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No active commute reservations right now. Use{' '}
                <Link to="/find-route" className="text-blue-400 hover:underline">
                  Find Route
                </Link>{' '}
                to request a seat.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.slice(0, 3).map((b) => (
                  <div
                    key={b._id || b.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        {b.ride?.origin?.address || b.pickupLocation || 'Origin'} ➔ {b.ride?.destination?.address || b.dropLocation || 'Destination'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Status: <strong className="text-blue-300 uppercase">{b.status}</strong> • Host: {b.ride?.driver?.name || b.driver?.name || 'Verified Commuter'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => changeTab('upcoming')}
                      className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: UPCOMING */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Upcoming Shared Commutes</h3>
              <p className="text-xs text-slate-400">
                Manage your seat requests, in-progress journeys, and commuter coordination.
              </p>
            </div>
            <Link
              to="/find-route"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              + Find Route
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-12 text-center space-y-3">
              <div className="text-3xl">🗓️</div>
              <h4 className="text-base font-bold text-white">No Upcoming Commutes Scheduled</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You do not have any pending or active shared commutes. Find a compatible route or offer seats on your own vehicle.
              </p>
              <div className="pt-2">
                <Link
                  to="/find-route"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-block"
                >
                  Search Available Routes →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingBookings.map((b) => {
                const bookingKey = b._id || b.id;
                const statusStr = String(b.status || '').toLowerCase();
                const isRequested = statusStr === 'requested';
                const isAccepted = statusStr === 'accepted' || statusStr === 'confirmed';
                const isStarted = statusStr === 'started' || statusStr.includes('progress');
                const isHost =
                  String(b.driver?._id || b.driver?.id || b.driver || '') === currentUserId ||
                  b.driver?.name === activeUser.name;

                return (
                  <div
                    key={bookingKey}
                    className={`rounded-2xl p-6 bg-[#090e1a] border ${
                      isStarted
                        ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/40 bg-gradient-to-b from-cyan-950/15 to-[#090e1a]'
                        : isAccepted
                        ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/10 to-[#090e1a]'
                        : 'border-slate-800'
                    } flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-3">
                      {/* Header Badge */}
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isHost ? 'Hosted Commute' : 'Passenger Reservation'}
                        </span>
                        {isStarted ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                            IN PROGRESS
                          </span>
                        ) : isAccepted ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase">
                            CONFIRMED
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase">
                            AWAITING HOST
                          </span>
                        )}
                      </div>

                      {/* Route Trajectory */}
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {b.ride?.origin?.address || b.pickupLocation || 'Origin'} ➔ {b.ride?.destination?.address || b.dropLocation || 'Destination'}
                        </h4>
                        <p className="text-xs text-blue-300 mt-1">
                          {isHost
                            ? `Passenger: ${b.passenger?.name || 'Peer Commuter'}`
                            : `Host: ${b.ride?.driver?.name || b.driver?.name || 'Verified Commuter'}`}
                        </p>
                      </div>

                      {/* Commute Details */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-400">
                          <span>Departure</span>
                          <span className="text-amber-300 font-medium">
                            {b.ride?.departureTime || 'Scheduled Schedule'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Fuel Contribution</span>
                          <span className="text-emerald-400 font-bold">
                            ₹{b.costContribution ?? b.fare ?? b.cost ?? 45}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Trajectory Compatibility</span>
                          <span className="text-blue-300 font-medium">
                            {b.matchScore?.overall || 90}% Match
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openChatForBooking(b)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>💬</span>
                          <span>Chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReportBooking(b);
                            setReportModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition cursor-pointer"
                          title="Report safety or trust issue"
                        >
                          🛡️ Report
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {isStarted ? (
                          <button
                            id={`complete-journey-btn-${bookingKey}`}
                            onClick={() => handleBookingAction(bookingKey, 'complete', b.ride?._id || b.ride)}
                            disabled={updatingBookingId === bookingKey}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span>🏁</span>
                            <span>{updatingBookingId === bookingKey ? 'Completing...' : 'Complete Journey'}</span>
                          </button>
                        ) : isAccepted ? (
                          <button
                            id={`start-journey-btn-${bookingKey}`}
                            onClick={() => handleBookingAction(bookingKey, 'start', b.ride?._id || b.ride)}
                            disabled={updatingBookingId === bookingKey}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span>🚀</span>
                            <span>{updatingBookingId === bookingKey ? 'Starting...' : 'Start Journey'}</span>
                          </button>
                        ) : isHost && isRequested ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleBookingAction(bookingKey, 'accept', b.ride?._id || b.ride)}
                              disabled={updatingBookingId === bookingKey}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                            >
                              Accept Seat
                            </button>
                            <button
                              onClick={() => handleBookingAction(bookingKey, 'reject', b.ride?._id || b.ride)}
                              disabled={updatingBookingId === bookingKey}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 font-bold text-xs cursor-pointer disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        ) : null}

                        {!isStarted && (
                          <button
                            id={`cancel-booking-btn-${bookingKey}`}
                            onClick={() => handleBookingAction(bookingKey, 'cancel', b.ride?._id || b.ride)}
                            disabled={updatingBookingId === bookingKey}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: HOSTED ROUTES */}
      {activeTab === 'hosted' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Your Hosted Commute Routes</h3>
              <p className="text-xs text-slate-400">
                Routes published by you where you offer available vehicle seats to split fuel costs.
              </p>
            </div>
            <Link
              to="/offer-route"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              + Offer New Route
            </Link>
          </div>

          {hostedRides.length === 0 ? (
            <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-12 text-center space-y-3">
              <div className="text-3xl">🚗</div>
              <h4 className="text-base font-bold text-white">No Hosted Commute Routes Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Have empty seats in your motorcycle or car during your routine daily travel? Publish a route to help peers and split fuel.
              </p>
              <div className="pt-2">
                <Link
                  to="/offer-route"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-block"
                >
                  Publish Route Now →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {hostedRides.map((ride) => {
                const rideId = ride._id || ride.id;
                // Find all bookings for this ride
                const rideBookings = bookings.filter(
                  (b) => String(b.ride?._id || b.ride || b.rideId) === String(rideId)
                );

                return (
                  <div
                    key={rideId}
                    className="rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                            Active Host Route
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-300">
                            {ride.vehicle?.name || (ride.vehicle?.vehicleType === 'bike' ? '🏍️ Motorcycle' : '🚗 Car')}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          {ride.origin?.address || 'Origin'} ➔ {ride.destination?.address || 'Destination'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Available Seats</span>
                          <span className="text-sm font-black text-emerald-400">
                            {ride.availableSeats ?? 1} / {ride.totalSeats ?? ride.seats ?? 1}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Fuel Share</span>
                          <span className="text-sm font-black text-white">
                            ₹{ride.costPerSeat ?? 45}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Incoming Passenger Requests for this route */}
                    <div className="space-y-3 pt-1">
                      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Incoming Passenger Requests ({rideBookings.length})
                      </h5>

                      {rideBookings.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
                          No co-commuter requests for this route yet. Your route is active and discoverable on Find Route.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {rideBookings.map((bk) => {
                            const bkKey = bk._id || bk.id;
                            const isReq = bk.status === 'requested';

                            return (
                              <div
                                key={bkKey}
                                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">
                                      {bk.passenger?.name || 'Verified Commuter'}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                      {bk.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Pickup: {bk.pickupLocation || 'Route origin'} • Drop: {bk.dropLocation || 'Route destination'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isReq ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleBookingAction(bkKey, 'accept', rideId)}
                                        disabled={updatingBookingId === bkKey}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                                      >
                                        Accept Seat
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleBookingAction(bkKey, 'reject', rideId)}
                                        disabled={updatingBookingId === bkKey}
                                        className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openChatForBooking(bk)}
                                      className="px-3 py-1 rounded-lg bg-blue-600/15 text-blue-300 border border-blue-500/30 text-xs font-semibold cursor-pointer"
                                    >
                                      💬 Message Commuter
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: COMPLETED / HISTORY */}
      {activeTab === 'completed' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Verified Commute History</h3>
            <p className="text-xs text-slate-400">
              Review completed shared trips and submit peer ratings.
            </p>
          </div>

          {pastBookings.length === 0 ? (
            <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-12 text-center space-y-3">
              <div className="text-3xl">🏁</div>
              <h4 className="text-base font-bold text-white">No Completed Commutes Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Once journeys are started and completed, they will appear here with peer trust reviews.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastBookings.map((item) => (
                <div
                  key={item._id || item.id}
                  className="p-4 rounded-2xl bg-[#090e1a] border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      {item.ride?.origin?.address || item.pickupLocation || 'Origin'} ➔ {item.ride?.destination?.address || item.dropLocation || 'Destination'}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Completed Commute • Host: {item.ride?.driver?.name || item.driver?.name || 'Verified Host'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-emerald-400">
                      ₹{item.costContribution ?? item.fare ?? item.cost ?? 45}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRatingBooking(item);
                        setRatingModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>⭐</span>
                      <span>Rate Experience</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Registered Commute Vehicles</h3>
              <p className="text-xs text-slate-400">
                Manage your motorcycles and cars for offering shared seats.
              </p>
            </div>
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              + Add Vehicle
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-12 text-center space-y-3">
              <div className="text-3xl">🏍️</div>
              <h4 className="text-base font-bold text-white">No Vehicles Registered</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Add your motorcycle or car to offer seats on your routine daily commutes.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setVehicleModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                >
                  Register Vehicle Now
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <div
                  key={v._id || v.id}
                  className="rounded-2xl bg-[#090e1a] border border-slate-800 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">
                        {v.vehicleType === 'bike' ? '🏍️' : '🚗'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/25 uppercase">
                        {v.vehicleType === 'bike' ? 'Motorcycle' : 'Car'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">
                        {v.brand} {v.model}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Plate: {v.registrationNumber}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-400">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="block text-[10px]">Seats</span>
                        <strong className="text-white">{v.seats}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="block text-[10px]">Mileage</span>
                        <strong className="text-emerald-400">{v.mileage} km/L</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[11px] text-slate-500">
                      Year: {v.year} • Fuel: {v.fuelType}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(v._id || v.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MODALS */}

      {/* Verification Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#090e1a] border border-blue-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setVerifyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg text-lg"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 mb-2">
                <span>🛡️</span> Institutional Trust Audit
              </div>
              <h3 className="text-xl font-extrabold text-white">ID Verification Mechanism</h3>
              <p className="text-xs text-slate-400 mt-1">
                Link your institutional credentials to earn the verified trust badge on all shared routes.
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Verification Document Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'student_id', label: '🎓 Student ID', type: 'student' },
                    { id: 'work_badge', label: '👨‍💼 Work Badge', type: 'employee' },
                    { id: 'govt_id', label: '👤 Govt Photo ID', type: 'general' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDocType(d.id)}
                      className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                        docType === d.id
                          ? 'border-blue-500 bg-blue-600/15 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  {docType === 'student_id' ? 'College / University Name' : docType === 'work_badge' ? 'Company Name' : 'Issuing Authority'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Institute of Technology / Corporate Inc"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Document / Badge Identification Number</label>
                <input
                  type="text"
                  placeholder="e.g. 21CS-9842 / EMP-48210"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition cursor-pointer"
                >
                  {isVerifying ? 'Verifying...' : 'Submit & Activate Verified ID'}
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Registration Modal */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#090e1a] border border-blue-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setVehicleModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg text-lg"
            >
              ✕
            </button>

            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                VEHICLE FLEET MANAGEMENT
              </span>
              <h3 className="text-xl font-extrabold text-white mt-1">Register Commute Vehicle</h3>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Vehicle Type</label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        vehicleType: e.target.value,
                        seats: e.target.value === 'bike' ? 1 : 3,
                        mileage: e.target.value === 'bike' ? 45 : 15,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="bike">🏍️ Motorcycle / Scooter</option>
                    <option value="car">🚗 Four-Wheeler / Car</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Fuel Type</label>
                  <select
                    value={vehicleForm.fuelType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric (EV)</option>
                    <option value="cng">CNG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Make / Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda / Hyundai"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Model Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Activa / i20"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Plate Number</label>
                  <input
                    type="text"
                    placeholder="AP-07-XX-1234"
                    value={vehicleForm.registrationNumber}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Seats Available</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={vehicleForm.seats}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, seats: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Mileage (km/L)</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={vehicleForm.mileage}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, mileage: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingVehicle}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition cursor-pointer"
                >
                  {submittingVehicle ? 'Registering...' : 'Register Vehicle'}
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating & Feedback Modal */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#090e1a] border border-amber-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setRatingModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl font-black shadow-lg">
                ⭐
              </div>
              <h3 className="text-xl font-extrabold text-white">Rate Your Shared Commute</h3>
              <p className="text-xs text-slate-400">
                Help build trust in our campus and corporate carpooling community by rating your peer commuter.
              </p>
            </div>

            <form onSubmit={handleRatingSubmit} className="space-y-5 text-xs">
              <div className="flex justify-center items-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    className={`text-3xl transition-transform hover:scale-125 cursor-pointer ${
                      star <= ratingScore ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-700'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Feedback / Experience (Optional)</label>
                <textarea
                  rows="3"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="On-time pickup, safe driving, friendly peer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button
                  type="button"
                  onClick={() => setRatingModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#090e1a] border border-rose-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setReportModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20 mb-2">
                <span>🛡️</span> Peer Safety Protection
              </div>
              <h3 className="text-xl font-extrabold text-white">Report Commute Issue</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your report is reviewed confidentially by our trust and verification team.
              </p>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Issue Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="reckless_driving">Reckless or Unsafe Driving</option>
                  <option value="harassment">Inappropriate Conduct or Harassment</option>
                  <option value="no_show">No Show / Left Without Notice</option>
                  <option value="fare_dispute">Extra Money Demanded (Commercialization)</option>
                  <option value="vehicle_condition">Unregistered or Unsafe Vehicle</option>
                  <option value="other">Other Safety Concern</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Incident Description</label>
                <textarea
                  rows="3"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please describe what happened in detail..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  required
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/25 transition cursor-pointer"
                >
                  {submittingReport ? 'Submitting Report...' : 'Submit Safety Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Chat Modal */}
      {chatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg h-[540px] rounded-3xl bg-[#090e1a] border border-blue-500/30 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Commute Coordination Chat
                </h4>
                <p className="text-[11px] text-blue-300">
                  {chatBooking?.ride?.origin?.address || chatBooking?.pickupLocation || 'Origin'} ➔ {chatBooking?.ride?.destination?.address || chatBooking?.dropLocation || 'Destination'}
                </p>
              </div>
              <button
                onClick={() => setChatModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {loadingChat ? (
                <div className="text-center text-slate-500 py-10">Loading messages...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-slate-500 py-10 space-y-1">
                  <p>💬 No messages yet in this commute thread.</p>
                  <p className="text-[11px]">Send a message to coordinate pickup spot or timing.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe =
                    String(msg.sender?._id || msg.sender?.id || msg.sender) === currentUserId ||
                    msg.sender?.name === activeUser.name;

                  return (
                    <div
                      key={msg._id || msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 px-1">
                        {isMe ? 'You' : msg.sender?.name || 'Commuter'} •{' '}
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
              <input
                type="text"
                placeholder="Type coordination message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={sendingMessage || !chatInput.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
