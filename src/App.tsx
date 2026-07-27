import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Search, MapPin, Bed, Bath, Square, 
  Calendar, MessageSquare, AlertTriangle, CheckCircle2, Star, 
  UserCheck, Smartphone, Camera, Building2, PlusCircle, Filter, 
  ArrowRight, X, Eye, ThumbsUp, Lock, RefreshCw, AlertOctagon, 
  SlidersHorizontal, Check, Map as MapIcon, Grid, PhoneCall, Send, HelpCircle
} from 'lucide-react';
import { Listing, Appointment, Message } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'landlord' | 'appointments' | 'admin'>('explore');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchPrompt, setAiSearchPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Saved Favorites
  const [favorites, setFavorites] = useState<string[]>([]);

  // Modals inside property detail
  const [detailTab, setDetailTab] = useState<'overview' | 'booking' | 'chat' | 'landlord'>('overview');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Booking form state
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [renterName, setRenterName] = useState('Sarah Jenkins');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Fake photos');
  const [reportComment, setReportComment] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Landlord Add Listing state
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRooms, setNewRooms] = useState('2');
  const [newBathrooms, setNewBathrooms] = useState('1');
  const [newSqft, setNewSqft] = useState('850');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');
  const [creatingListing, setCreatingListing] = useState(false);
  const [createSuccessMessage, setCreateSuccessMessage] = useState('');

  // Appointments list
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [feedbackModalApt, setFeedbackModalApt] = useState<Appointment | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    fetchListings();
    fetchAppointments();
  }, [searchQuery, minPrice, maxPrice, roomFilter, verifiedOnly, sortBy]);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (roomFilter !== 'all') params.append('rooms', roomFilter);
      if (verifiedOnly) params.append('verifiedOnly', 'true');
      if (sortBy !== 'default') params.append('sort', sortBy);

      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error("Failed to load listings", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments", err);
    }
  };

  const handleAiSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchPrompt.trim()) return;
    setAiLoading(true);
    setAiSummary('');
    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiSearchPrompt })
      });
      const data = await res.json();
      if (data.matchedIds) {
        setListings(prev => prev.filter(l => data.matchedIds.includes(l.id)));
      }
      if (data.recommendationSummary) {
        setAiSummary(data.recommendationSummary);
      }
    } catch (err) {
      console.error("AI search error", err);
    } finally {
      setAiLoading(false);
    }
  };

  const openListingDetails = async (listing: Listing) => {
    try {
      const res = await fetch(`/api/listings/${listing.id}`);
      const data = await res.json();
      setSelectedListing(data);
      setDetailTab('overview');
      fetchMessages(data.id);
    } catch (err) {
      console.error("Error fetching detail", err);
    }
  };

  const fetchMessages = async (listingId: string) => {
    try {
      const res = await fetch(`/api/chat/${listingId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedListing) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing.id,
          sender: 'renter',
          senderName: renterName,
          text: chatInput
        })
      });
      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]);
      setChatInput('');
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const handleBookViewing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing.id,
          listingTitle: selectedListing.title,
          renterName,
          renterEmail: 'renter@example.com',
          date: bookingDate || new Date().toISOString().split('T')[0],
          time: bookingTime
        })
      });
      await res.json();
      setBookingSuccess(true);
      fetchAppointments();
      setTimeout(() => setBookingSuccess(false), 4000);
    } catch (err) {
      console.error("Booking error", err);
    }
  };

  const handleReportListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    try {
      const res = await fetch(`/api/listings/${selectedListing.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, comment: reportComment })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedListing(data.listing);
        setReportSuccess(true);
        setTimeout(() => {
          setReportSuccess(false);
          setReportModalOpen(false);
        }, 2500);
      }
    } catch (err) {
      console.error("Report error", err);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingListing(true);
    setCreateSuccessMessage('');
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          price: Number(newPrice),
          location: newLocation,
          rooms: Number(newRooms),
          bathrooms: Number(newBathrooms),
          squareFeet: Number(newSqft),
          description: newDesc,
          images: newImage ? [newImage] : undefined,
          amenities: ["High-speed WiFi", "Secure Parking", "Air Conditioning"],
          verifiedProperty: true
        })
      });
      const created = await res.json();
      if (created.id) {
        setCreateSuccessMessage(`Listing created successfully! AI Scam Risk Score: ${created.scamRiskScore}% (${created.aiAnalysisNotes})`);
        setNewTitle('');
        setNewPrice('');
        setNewLocation('');
        setNewDesc('');
        setNewImage('');
        fetchListings();
      }
    } catch (err) {
      console.error("Create listing error", err);
    } finally {
      setCreatingListing(false);
    }
  };

  const handleVerifyProperty = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${id}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setListings(prev => prev.map(l => l.id === id ? data.listing : l));
        if (selectedListing?.id === id) {
          setSelectedListing(data.listing);
        }
      }
    } catch (err) {
      console.error("Verify error", err);
    }
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackModalApt) return;
    try {
      const res = await fetch(`/api/appointments/${feedbackModalApt.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
          landlordMet: true
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
        setFeedbackModalApt(null);
        setFeedbackComment('');
      }
    } catch (err) {
      console.error("Feedback error", err);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* ⚠️ STRICT SAFETY BANNER: NO DEPOSIT BEFORE VIEWING */}
      <div className="bg-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-inner text-center">
        <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
        <span>
          <strong>No Deposit Before Viewing Policy:</strong> Never pay a deposit or rent before physically inspecting the property and confirming the landlord's verified identity badge.
        </span>
      </div>

      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                HomeLink <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Verified Trusted</span>
              </h1>
              <p className="text-xs text-slate-500">Find verified homes. Meet verified landlords.</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'explore' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Explore & Search
            </button>
            <button 
              onClick={() => setActiveTab('landlord')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'landlord' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Landlord Hub
            </button>
            <button 
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'appointments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Viewings & Appointments ({appointments.length})
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Scam Monitor & Trust
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" 
                alt="User profile" 
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Sarah Jenkins</p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> Verified Renter
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex border-t border-slate-200 bg-white">
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-3 text-xs font-medium text-center ${activeTab === 'explore' ? 'text-emerald-600 border-b-2 border-emerald-600 font-bold' : 'text-slate-600'}`}
          >
            Explore
          </button>
          <button 
            onClick={() => setActiveTab('landlord')}
            className={`flex-1 py-3 text-xs font-medium text-center ${activeTab === 'landlord' ? 'text-emerald-600 border-b-2 border-emerald-600 font-bold' : 'text-slate-600'}`}
          >
            Landlord
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-3 text-xs font-medium text-center ${activeTab === 'appointments' ? 'text-emerald-600 border-b-2 border-emerald-600 font-bold' : 'text-slate-600'}`}
          >
            Bookings
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-3 text-xs font-medium text-center ${activeTab === 'admin' ? 'text-emerald-600 border-b-2 border-emerald-600 font-bold' : 'text-slate-600'}`}
          >
            Trust & Safety
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= EXPLORE TAB ================= */}
        {activeTab === 'explore' && (
          <div className="space-y-8">
            
            {/* HERO / SEARCH BAR WITH AI INTEGRATION */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="max-w-2xl relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" /> Zero Scams. Verified Properties Only.
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                  Find verified homes. <br className="hidden sm:inline" />Meet verified landlords.
                </h2>
                <p className="text-slate-300 text-sm sm:text-base mb-6">
                  Every landlord passes government ID & selfie verification. Properties are GPS-confirmed with strict anti-scam protection.
                </p>

                {/* AI Smart Search Bar */}
                <form onSubmit={handleAiSmartSearch} className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex flex-col sm:flex-row gap-2 shadow-lg">
                  <div className="flex-1 flex items-center px-3 gap-2 bg-white/95 rounded-xl text-slate-900">
                    <SparklesIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                    <input 
                      type="text" 
                      value={aiSearchPrompt}
                      onChange={(e) => setAiSearchPrompt(e.target.value)}
                      placeholder="Ask AI: '2 bed apartment under $2000 near transit with verified badge'"
                      className="w-full py-3 bg-transparent text-sm focus:outline-none text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={aiLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shrink-0 shadow-md"
                  >
                    {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>AI Match</span>
                  </button>
                </form>

                {aiSummary && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-900/60 border border-emerald-500/30 text-emerald-100 text-xs sm:text-sm flex items-start gap-2 animate-fade-in">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">AI Recommendation Analysis:</strong>
                      {aiSummary}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FILTER CONTROLS & VIEW TOGGLE */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Search input keyword */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search location or title..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Price max */}
                <select 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none"
                >
                  <option value="">Any Max Rent</option>
                  <option value="1200">Max $1,200</option>
                  <option value="2000">Max $2,000</option>
                  <option value="3000">Max $3,000</option>
                </select>

                {/* Rooms */}
                <select 
                  value={roomFilter} 
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none"
                >
                  <option value="all">All Rooms</option>
                  <option value="1">1+ Bedroom</option>
                  <option value="2">2+ Bedrooms</option>
                  <option value="3">3+ Bedrooms</option>
                </select>

                {/* Verified Only Checkbox */}
                <label className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer text-xs font-semibold text-emerald-800">
                  <input 
                    type="checkbox" 
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>100% Verified Only</span>
                </label>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none"
                >
                  <option value="default">Sort by: Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="safety">Highest Safety Score</option>
                </select>

                {/* Grid vs Map Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                    title="Map View"
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* LISTINGS DISPLAY */}
            {loading ? (
              <div className="text-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-slate-500 text-sm">Loading verified listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No matching listings found</h3>
                <p className="text-slate-500 text-sm mb-4">Try clearing your filters or search criteria.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setMinPrice(''); setMaxPrice(''); setRoomFilter('all'); setVerifiedOnly(false); }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition-all"
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => {
                  const isFavorite = favorites.includes(listing.id);
                  const isHighRisk = listing.scamRiskScore > 70;

                  return (
                    <div 
                      key={listing.id}
                      onClick={() => openListingDetails(listing)}
                      className={`bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-all cursor-pointer flex flex-col group relative ${isHighRisk ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'}`}
                    >
                      {/* Image container */}
                      <div className="relative h-60 overflow-hidden bg-slate-100">
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          {listing.verifiedProperty ? (
                            <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">
                              <ShieldCheck className="w-3.5 h-3.5" /> Verified Property
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-600/90 backdrop-blur-md text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">
                              <AlertTriangle className="w-3.5 h-3.5" /> Unverified
                            </span>
                          )}

                          {isHighRisk && (
                            <span className="px-2.5 py-1 bg-rose-600/90 backdrop-blur-md text-white text-xs font-bold rounded-lg flex items-center gap-1">
                              <AlertOctagon className="w-3.5 h-3.5" /> AI Scam Risk
                            </span>
                          )}
                        </div>

                        {/* Favorite button */}
                        <button 
                          onClick={(e) => toggleFavorite(listing.id, e)}
                          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all ${isFavorite ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}
                        >
                          ❤️
                        </button>

                        {/* Price tag */}
                        <div className="absolute bottom-3 left-3 text-white">
                          <span className="text-2xl font-black">${listing.price}</span>
                          <span className="text-xs text-slate-200 font-medium"> /month</span>
                        </div>

                        {/* Safety score */}
                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          Safety: {listing.safetyScore}%
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{listing.location}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                            <span className="flex items-center gap-1"><Bed className="w-4 h-4 text-slate-400" /> {listing.rooms} Beds</span>
                            <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-slate-400" /> {listing.bathrooms} Baths</span>
                            <span className="flex items-center gap-1"><Square className="w-4 h-4 text-slate-400" /> {listing.squareFeet} sqft</span>
                          </div>
                        </div>

                        {/* Landlord Info footer */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <img src={listing.landlord.avatar} alt={listing.landlord.name} className="w-8 h-8 rounded-full object-cover" />
                              {listing.landlord.verifiedIdentity && (
                                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                {listing.landlord.name}
                                {listing.landlord.verifiedIdentity && (
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" title="Verified Landlord ID" />
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500">Trust Score: {listing.landlord.trustScore}/100</p>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                            View <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* INTERACTIVE MAP VIEW SIMULATION */
              <div className="bg-white rounded-3xl border border-slate-200 p-6 relative overflow-hidden h-[600px] flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-slate-100 opacity-70 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="max-w-md bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-200 mb-6">
                    <MapPin className="w-12 h-12 text-emerald-600 mx-auto mb-3 animate-bounce" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Interactive GPS Property Map</h3>
                    <p className="text-xs text-slate-600 mb-4">
                      All pins are verified via GPS coordinate matching and on-site physical inspection to prevent incorrect location scams.
                    </p>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-500 transition-all"
                    >
                      Switch back to Grid View ({listings.length} listings)
                    </button>
                  </div>

                  {/* Simulated map pins spread out */}
                  <div className="flex flex-wrap gap-4 justify-center relative z-10 max-w-2xl">
                    {listings.map(l => (
                      <button 
                        key={l.id}
                        onClick={() => openListingDetails(l)}
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{l.title.slice(0, 22)}... (${l.price})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= LANDLORD HUB TAB ================= */}
        {activeTab === 'landlord' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Landlord Verification & Listing Portal</h2>
                  <p className="text-xs text-slate-500">List your property with zero fake listings and instant AI scam protection.</p>
                </div>
              </div>

              {/* Landlord badge status card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1">
                      Verified Landlord Status Active <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </h4>
                    <p className="text-xs text-emerald-700">National ID, phone number, and facial biometric selfie successfully verified.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
                    Trust Score: 98/100
                  </span>
                </div>
              </div>

              {/* Add New Listing Form */}
              <form onSubmit={handleCreateListing} className="space-y-6">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-600" /> Create New Verified Property Listing
                </h3>

                {createSuccessMessage && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm rounded-xl">
                    {createSuccessMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Property Title</label>
                    <input 
                      type="text" 
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Luxury 2 Bedroom Apartment"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Rent ($)</label>
                    <input 
                      type="number" 
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="1500"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location / Address</label>
                    <input 
                      type="text" 
                      required
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="Downtown Metro City"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bedrooms</label>
                    <input 
                      type="number" 
                      value={newRooms}
                      onChange={(e) => setNewRooms(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Square Footage</label>
                    <input 
                      type="number" 
                      value={newSqft}
                      onChange={(e) => setNewSqft(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Photo Image URL (Unsplash or custom)</label>
                  <input 
                    type="url" 
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description & Safety Rules</label>
                  <textarea 
                    rows={4}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe amenities, parking, schools nearby. Note: No Deposit Before Viewing strictly adhered."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  ></textarea>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Listing Freshness Rule:</strong> All listings require 30-day reconfirmation. Listings not confirmed within 30 days are automatically hidden.
                  </span>
                </div>

                <button 
                  type="submit"
                  disabled={creatingListing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {creatingListing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Publish Verified Listing & Run AI Scam Check</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= APPOINTMENTS & VIEWINGS TAB ================= */}
        {activeTab === 'appointments' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Your Viewing Appointments</h2>
                    <p className="text-xs text-slate-500">Schedule physical viewings with verified landlords safely.</p>
                  </div>
                </div>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No viewing appointments scheduled yet. Select a property and click "Book Viewing".
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1">
                          {apt.status}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">{apt.listingTitle}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          📅 Date: <strong>{apt.date}</strong> at <strong>{apt.time}</strong> | Renter: {apt.renterName}
                        </p>
                        {apt.feedback && (
                          <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                            ⭐ Rating: {apt.feedback.rating}/5 — "{apt.feedback.comment}"
                          </div>
                        )}
                      </div>

                      {apt.status !== 'Completed' && (
                        <button 
                          onClick={() => setFeedbackModalApt(apt)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-all shadow-sm"
                        >
                          Complete & Leave Feedback
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ADMIN SCAM MONITOR TAB ================= */}
        {activeTab === 'admin' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">AI Scam Monitor & Trust Dashboard</h2>
                    <p className="text-xs text-slate-500">Real-time AI surveillance detecting duplicate photos, price anomalies, and scam reports.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 font-medium">Total Active Listings</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{listings.length}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <p className="text-xs text-emerald-700 font-medium">Verified Properties</p>
                  <p className="text-2xl font-black text-emerald-800 mt-1">{listings.filter(l => l.verifiedProperty).length}</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                  <p className="text-xs text-rose-700 font-medium">Flagged Scam Risks</p>
                  <p className="text-2xl font-black text-rose-800 mt-1">{listings.filter(l => l.scamRiskScore > 50).length}</p>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-4">All Listings & Scam Risk Status</h3>
              <div className="space-y-4">
                {listings.map(l => (
                  <div key={l.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={l.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{l.title}</h4>
                        <p className="text-xs text-slate-500">{l.location} • ${l.price}/mo • Landlord: {l.landlord.name}</p>
                        <p className="text-xs text-slate-600 mt-1">🤖 AI Notes: {l.aiAnalysisNotes}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${l.scamRiskScore > 50 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        Scam Risk: {l.scamRiskScore}%
                      </span>

                      {!l.verifiedProperty && (
                        <button 
                          onClick={() => handleVerifyProperty(l.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                        >
                          Verify Property
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ================= PROPERTY DETAIL MODAL ================= */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Listing
                </span>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-1">{selectedListing.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedListing(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-6">
              <button 
                onClick={() => setDetailTab('overview')}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${detailTab === 'overview' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600'}`}
              >
                Property Overview
              </button>
              <button 
                onClick={() => setDetailTab('booking')}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${detailTab === 'booking' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600'}`}
              >
                📅 Book Viewing
              </button>
              <button 
                onClick={() => setDetailTab('chat')}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${detailTab === 'chat' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600'}`}
              >
                💬 Secure Chat
              </button>
              <button 
                onClick={() => setDetailTab('landlord')}
                className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${detailTab === 'landlord' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600'}`}
              >
                🛡️ Landlord Trust
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {detailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Photo gallery grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedListing.images.map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-full h-48 object-cover rounded-2xl border border-slate-200 shadow-sm" />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-black text-slate-900">${selectedListing.price} <span className="text-sm font-normal text-slate-500">/ month</span></p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedListing.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                            Safety Score: {selectedListing.safetyScore}%
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                        <div>🛏️ <strong>{selectedListing.rooms}</strong> Bedrooms</div>
                        <div>🚿 <strong>{selectedListing.bathrooms}</strong> Bathrooms</div>
                        <div>📐 <strong>{selectedListing.squareFeet}</strong> sqft</div>
                        <div>👁️ <strong>{selectedListing.views}</strong> views</div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Description & Safety Policy</h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{selectedListing.description}</p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedListing.amenities.map((am, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium">
                              ✓ {am}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block mb-0.5 font-bold">No Deposit Before Viewing Policy Reminder</strong>
                          Do not transfer any money, deposits, or advance rent until you have toured this property in person with the verified landlord.
                        </div>
                      </div>
                    </div>

                    {/* Right column: Landlord card & Report */}
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm">Landlord Profile</h4>
                        <div className="flex items-center gap-3">
                          <img src={selectedListing.landlord.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                              {selectedListing.landlord.name}
                              <ShieldCheck className="w-4 h-4 text-emerald-600" title="Verified" />
                            </p>
                            <p className="text-[10px] text-slate-500">Trust Score: <strong>{selectedListing.landlord.trustScore}/100</strong></p>
                          </div>
                        </div>

                        <div className="text-xs space-y-2 pt-2 border-t border-slate-200 text-slate-600">
                          <div className="flex justify-between"><span>Identity:</span> <strong className="text-emerald-700">Verified ID & Selfie</strong></div>
                          <div className="flex justify-between"><span>Successful Rentals:</span> <strong>{selectedListing.landlord.successfulRentals}</strong></div>
                          <div className="flex justify-between"><span>Response Time:</span> <strong>~{selectedListing.landlord.responseMinutes} mins</strong></div>
                          <div className="flex justify-between"><span>Rating:</span> <strong>⭐ {selectedListing.landlord.rating} ({selectedListing.landlord.reviewCount} reviews)</strong></div>
                        </div>

                        <button 
                          onClick={() => setDetailTab('booking')}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                        >
                          Book Viewing Appointment
                        </button>
                      </div>

                      <button 
                        onClick={() => setReportModalOpen(true)}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <AlertOctagon className="w-4 h-4" /> Report Scam or Fake Listing
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'booking' && (
                <div className="max-w-xl mx-auto space-y-6 py-4">
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-slate-900">Schedule Physical Viewing</h4>
                    <p className="text-xs text-slate-500">Meet {selectedListing.landlord.name} safely at the property location.</p>
                  </div>

                  {bookingSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl text-center">
                      Viewing appointment confirmed successfully! Check your Bookings tab.
                    </div>
                  )}

                  <form onSubmit={handleBookViewing} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                      <input 
                        type="text" 
                        value={renterName}
                        onChange={(e) => setRenterName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Viewing Date</label>
                        <input 
                          type="date" 
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time</label>
                        <select 
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        >
                          <option value="10:00">10:00 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="14:00">02:00 PM</option>
                          <option value="16:00">04:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      🔒 <strong>Secure Viewing Notice:</strong> Personal phone numbers remain masked until both parties confirm appointment.
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                    >
                      Confirm Safe Viewing Appointment
                    </button>
                  </form>
                </div>
              )}

              {detailTab === 'chat' && (
                <div className="max-w-xl mx-auto flex flex-col h-[400px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                  <div className="bg-white p-3 border-b border-slate-200 flex items-center gap-3">
                    <img src={selectedListing.landlord.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{selectedListing.landlord.name}</p>
                      <p className="text-[10px] text-emerald-600">Secure In-App Chat • Phone hidden for privacy</p>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.sender === 'renter' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${m.sender === 'renter' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>
                          <p>{m.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">{m.timestamp}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type secure message..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                    <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500">
                      Send
                    </button>
                  </form>
                </div>
              )}

              {detailTab === 'landlord' && (
                <div className="max-w-xl mx-auto space-y-6 py-4">
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                    <h4 className="font-bold text-slate-900">Landlord Trust Breakdown</h4>
                    <div className="space-y-3 text-xs text-slate-700">
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span>Identity Verification (National ID / Passport)</span>
                        <strong className="text-emerald-700">✓ Verified</strong>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span>Phone Number Verification</span>
                        <strong className="text-emerald-700">✓ Verified</strong>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span>Facial Biometric Selfie Check</span>
                        <strong className="text-emerald-700">✓ Passed</strong>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span>Property Ownership Deed & GPS</span>
                        <strong className="text-emerald-700">✓ Confirmed</strong>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span>Overall Trust Score</span>
                        <strong className="text-emerald-600 text-base">{selectedListing.landlord.trustScore} / 100</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* REPORT SCAM MODAL */}
      {reportModalOpen && selectedListing && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" /> Report Scam or Fake Listing
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl text-center">
                Report submitted successfully. AI Scam Monitor has flagged this listing for immediate manual review.
              </div>
            ) : (
              <form onSubmit={handleReportListing} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Report</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Fake photos">Fake or stolen photos</option>
                    <option value="Wrong location">Incorrect GPS location</option>
                    <option value="Deposit scam">Asking deposit before viewing</option>
                    <option value="Overpriced scam">Unrealistic price scam</option>
                    <option value="Duplicate">Duplicate listing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Additional details (optional)</label>
                  <textarea 
                    rows={3}
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Provide details..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm shadow-md transition-all"
                >
                  Submit Scam Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {feedbackModalApt && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Viewing Feedback & Safety Check</h3>
            <p className="text-xs text-slate-500">How was your viewing for "{feedbackModalApt.listingTitle}"?</p>

            <form onSubmit={submitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                <select 
                  value={feedbackRating}
                  onChange={(e) => setFeedbackRating(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="5">⭐⭐⭐⭐⭐ 5 - Exceptional & Verified</option>
                  <option value="4">⭐⭐⭐⭐ 4 - Good</option>
                  <option value="3">⭐⭐⭐ 3 - Average</option>
                  <option value="2">⭐⭐ 2 - Below Expectations</option>
                  <option value="1">⭐ 1 - Suspicious / Scam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Comments / Landlord Behavior</label>
                <textarea 
                  rows={3}
                  required
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Did landlord adhere to No Deposit Before Viewing policy?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-emerald-500"
              >
                Submit Feedback & Close Appointment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 Z"/>
    </svg>
  );
}
