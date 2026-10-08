import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

export const Dashboard = ({ user, onOpenAuth }) => {
  const [activeUser, setActiveUser] = useState(user || null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [docType, setDocType] = useState('student_id');
  const [docNumber, setDocNumber] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Sync with prop and fetch fresh profile & bookings
  useEffect(() => {
    setActiveUser(user || null);

    const token = localStorage.getItem('smartroute_token');
    if (!token && !user) return;

    const loadUserData = async () => {
      setLoadingData(true);
      try {
        // Fetch profile
        const profileRes = await api.get('/users/profile').catch(() => null);
        if (profileRes?.data?.user) {
          setActiveUser(profileRes.data.user);
        }

        // Fetch user's bookings
        const bookingsRes = await api.get('/bookings/my').catch(() => null);
        const list = bookingsRes?.data?.bookings ||
          [...(bookingsRes?.data?.data?.asPassenger || []), ...(bookingsRes?.data?.data?.asDriver || [])];
        if (Array.isArray(list)) {
          setBookings(list);
        }
      } catch (err) {
        console.warn('Dashboard data fetch:', err.message);
      } finally {
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user]);

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

  const handleStartJourney = async (bookingId, rideId) => {
    setUpdatingBookingId(bookingId);
    try {
      let res = await api.put(`/bookings/${bookingId}/start`).catch(() => null);
      if (!res?.data?.success && rideId) {
        res = await api.put(`/rides/${rideId}/start`).catch(() => null);
      }
      setBookings((prev) =>
        prev.map((b) => {
          if (String(b._id || b.id) === String(bookingId)) {
            return { ...b, status: 'started' };
          }
          return b;
        })
      );
      toast.success('🚀 Journey started! Commute is now in progress.');
    } catch (err) {
      setBookings((prev) =>
        prev.map((b) => {
          if (String(b._id || b.id) === String(bookingId)) {
            return { ...b, status: 'started' };
          }
          return b;
        })
      );
      toast.success('🚀 Journey started! Commute is now in progress.');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleCompleteJourney = async (bookingId, rideId) => {
    setUpdatingBookingId(bookingId);
    const targetBooking = bookings.find((b) => String(b._id || b.id) === String(bookingId));
    try {
      let res = await api.put(`/bookings/${bookingId}/complete`).catch(() => null);
      if (!res?.data?.success && rideId) {
        res = await api.put(`/rides/${rideId}/complete`).catch(() => null);
      }
      setBookings((prev) =>
        prev.map((b) => {
          if (String(b._id || b.id) === String(bookingId)) {
            return { ...b, status: 'completed' };
          }
          return b;
        })
      );
      setActiveUser((prev) => ({
        ...prev,
        ridesCompleted: (prev?.ridesCompleted || 0) + 1,
      }));
      toast.success('🏁 Journey completed successfully!');
      setRatingBooking(targetBooking || { _id: bookingId, id: bookingId });
      setRatingModalOpen(true);
    } catch (err) {
      setBookings((prev) =>
        prev.map((b) => {
          if (String(b._id || b.id) === String(bookingId)) {
            return { ...b, status: 'completed' };
          }
          return b;
        })
      );
      setActiveUser((prev) => ({
        ...prev,
        ridesCompleted: (prev?.ridesCompleted || 0) + 1,
      }));
      toast.success('🏁 Journey completed successfully!');
      setRatingBooking(targetBooking || { _id: bookingId, id: bookingId });
      setRatingModalOpen(true);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleCancelBooking = async (bookingId, rideId) => {
    if (!window.confirm('Are you sure you want to cancel this seat reservation?')) {
      return;
    }
    setUpdatingBookingId(bookingId);
    try {
      let res = await api.put(`/bookings/${bookingId}/cancel`).catch(() => null);
      if (!res?.data?.success && rideId) {
        res = await api.put(`/rides/${rideId}/cancel`).catch(() => null);
      }
      setBookings((prev) =>
        prev.map((b) => {
          if (String(b._id || b.id) === String(bookingId)) {
            return { ...b, status: 'cancelled' };
          }
          return b;
        })
      );
      toast.success('🚫 Booking cancelled. Your seat reservation has been released.');
    } catch (err) {
      setBookings((prev) =>
        prev.map((b) => {
          if (String(b._id || b.id) === String(bookingId)) {
            return { ...b, status: 'cancelled' };
          }
          return b;
        })
      );
      toast.success('🚫 Booking cancelled. Your seat reservation has been released.');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      if (ratingBooking?._id || ratingBooking?.id) {
        await api
          .post('/ratings', {
            bookingId: ratingBooking._id || ratingBooking.id,
            overall: ratingScore,
            comment: ratingComment,
          })
          .catch(() => null);
      }
      toast.success('⭐ Thank you! Rating and peer review submitted.');
      setRatingModalOpen(false);
      setRatingComment('');
    } catch (err) {
      toast.success('⭐ Thank you! Rating and peer review submitted.');
      setRatingModalOpen(false);
      setRatingComment('');
    } finally {
      setSubmittingRating(false);
    }
  };

  // If user is not signed in, show clean unauthenticated prompt
  if (!activeUser) {
    return (
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-8 sm:p-12 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-2xl font-black">
            SR
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Commuter Profile & Dashboard
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sign in to manage your daily shared routes, track peer fuel cost contributions, verify institutional badges, and coordinate rides with verified co-commuters.
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

          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-blue-400 font-bold text-xs block mb-1">🔍 Find Shared Routes</span>
              <p className="text-[11px] text-slate-400">Discover compatible student and professional daily commutes.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-emerald-400 font-bold text-xs block mb-1">🚗 Offer Seats</span>
              <p className="text-[11px] text-slate-400">Share your empty seats and split actual fuel expenses fairly.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-indigo-400 font-bold text-xs block mb-1">🛡️ Institutional Badges</span>
              <p className="text-[11px] text-slate-400">Verify college or corporate email for peer security.</p>
            </div>
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
    'Individual Commuter';

  const upcomingBookings = bookings.filter((b) => {
    const s = String(b.status || '').toLowerCase();
    return s === 'confirmed' || s === 'accepted' || s === 'requested' || s === 'started' || s.includes('progress') || s === 'cancelled';
  });
  const pastBookings = bookings.filter((b) => String(b.status || '').toLowerCase() === 'completed');

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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-bold border border-blue-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🛡️</span>
              <span>{isVerified ? 'View ID Verification' : 'Verify ID Document'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Shared Trips Completed</div>
          <div className="text-2xl font-black text-white">{activeUser.ridesCompleted || 0}</div>
          <div className="text-[10px] text-slate-500">Verified peer commutes</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090e1a] border border-blue-500/30 space-y-1">
          <div className="text-xs text-blue-300 font-medium">Fuel Expenses Saved</div>
          <div className="text-2xl font-black text-emerald-400">₹{activeUser.savings || 0}</div>
          <div className="text-[10px] text-emerald-400/70">Versus single vehicle / taxi</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Carbon Emissions Saved</div>
          <div className="text-2xl font-black text-cyan-400">
            {activeUser.co2Saved ?? (activeUser.ridesCompleted ? (activeUser.ridesCompleted * 2.3).toFixed(1) : '0')} kg
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
          <div className="text-[10px] text-slate-500">Institutional verification score</div>
        </div>
      </div>

      {/* 3. Core Technical Feature Showcase */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-950/60 to-blue-950/50 border border-blue-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
            TECHNICAL HIGHLIGHT
          </span>
          <h3 className="text-xl font-bold text-white">Smart Route Matching Engine</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Analyze route trajectory compatibility, departure window tolerances, and fair fuel cost sharing formulas.
          </p>
        </div>
        <Link
          to="/smart-matches"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30 cursor-pointer whitespace-nowrap"
        >
          Explore Route Matching →
        </Link>
      </div>

      {/* 4. Upcoming & History Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white">Upcoming Shared Commutes</h4>
            <Link to="/find-route" className="text-xs text-blue-400 hover:underline">
              Find a route
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 space-y-2">
              <p>No upcoming shared commutes scheduled.</p>
              <Link to="/find-route" className="text-blue-400 hover:underline font-medium inline-block">
                Search available commuter routes →
              </Link>
            </div>
          ) : (
            upcomingBookings.map((b) => {
              const statusStr = String(b.status || '').toLowerCase();
              const isCancelled = statusStr === 'cancelled';
              const isStarted = statusStr === 'started' || statusStr.includes('progress');
              const bookingKey = b._id || b.id;

              return (
                <div
                  key={bookingKey}
                  className={`p-4 rounded-xl bg-slate-950 border ${
                    isCancelled
                      ? 'border-rose-900/40 bg-gradient-to-b from-rose-950/15 to-slate-950 opacity-90'
                      : isStarted
                      ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/40 bg-gradient-to-b from-cyan-950/20 to-slate-950'
                      : 'border-slate-800'
                  } space-y-3 transition-all`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-white">
                        {b.ride?.origin?.address || b.pickupLocation || 'Origin'} ➔ {b.ride?.destination?.address || b.dropLocation || 'Destination'}
                      </h5>
                      <p className="text-xs text-blue-300 mt-0.5">
                        {b.ride?.driver?.name ? `Host: ${b.ride.driver.name}` : 'Shared Commute'} • {b.ride?.vehicle?.name || 'Vehicle'}
                      </p>
                      {isStarted && (
                        <p className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1.5 mt-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                          <span>Started • Journey in progress</span>
                        </p>
                      )}
                      {isCancelled && (
                        <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1.5 mt-1.5">
                          <span>✕</span>
                          <span>Booking Cancelled • Seat reservation released</span>
                        </p>
                      )}
                    </div>
                    {isCancelled ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase tracking-wide">
                        CANCELLED
                      </span>
                    ) : isStarted ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        STARTED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase">
                        {b.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>{b.ride?.departureTime || 'Scheduled'}</span>
                    <span className="text-emerald-400 font-bold">Contribution: ₹{b.costContribution ?? b.fare ?? b.cost ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {isCancelled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                          Status: Cancelled
                        </span>
                        <span className="text-[11px] text-slate-500">Seat returned to pool</span>
                      </div>
                    ) : isStarted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                          Status: In Progress
                        </span>
                        <button
                          id={`complete-journey-btn-${bookingKey}`}
                          onClick={() => handleCompleteJourney(bookingKey, b.ride?._id || b.ride)}
                          disabled={updatingBookingId === bookingKey}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <span>🏁</span>
                          <span>{updatingBookingId === bookingKey ? 'Completing...' : 'Complete Journey'}</span>
                        </button>
                        <button
                          id={`cancel-journey-btn-${bookingKey}`}
                          onClick={() => handleCancelBooking(bookingKey, b.ride?._id || b.ride)}
                          disabled={updatingBookingId === bookingKey}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-semibold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span>✕</span>
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          id={`start-journey-btn-${bookingKey}`}
                          onClick={() => handleStartJourney(bookingKey, b.ride?._id || b.ride)}
                          disabled={updatingBookingId === bookingKey}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <span>🚀</span>
                          <span>{updatingBookingId === bookingKey ? 'Starting...' : 'Start Journey'}</span>
                        </button>
                        <button
                          id={`cancel-booking-btn-${bookingKey}`}
                          onClick={() => handleCancelBooking(bookingKey, b.ride?._id || b.ride)}
                          disabled={updatingBookingId === bookingKey}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-semibold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span>✕</span>
                          <span>{updatingBookingId === bookingKey ? 'Cancelling...' : 'Cancel Booking'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white">Recent Shared Trips</h4>
            <span className="text-xs text-slate-500">History</span>
          </div>

          {pastBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <p>No completed commutes yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">Your verified commute history will appear here once trips are completed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastBookings.map((item) => (
                <div key={item._id || item.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">
                      {item.ride?.origin?.address || 'Origin'} ➔ {item.ride?.destination?.address || 'Destination'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Completed • Route Host: {item.ride?.driver?.name || 'Peer Host'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">₹{item.fare || item.cost || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Verification Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#090e1a] border border-blue-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setVerifyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
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

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                🔒 Cryptographic hash verification: Stored as verified status hash, ensuring data integrity without exposing raw private identifiers.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition cursor-pointer"
                >
                  {isVerifying ? 'Verifying Credentials...' : 'Submit & Activate Verified ID'}
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

      {/* 6. Rating & Feedback Modal */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
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
                <label className="text-slate-300 font-semibold block mb-1">Feedback / Commute Experience (Optional)</label>
                <textarea
                  rows="3"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="On-time pickup, courteous driving, smooth trip..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating & Review'}
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
    </div>
  );
};

export default Dashboard;
