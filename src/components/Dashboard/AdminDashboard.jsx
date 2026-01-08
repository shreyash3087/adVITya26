import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faUsers, faBuilding, faSpinner, faSearch,
  faChevronLeft, faChevronRight,
  faTachometerAlt, faAngleDoubleLeft, faAngleDoubleRight,
  faTrophy, faCalendarAlt, faClipboardCheck, faCheck, faTimes, faEye, faUpload, faImage
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { useAuth } from '@/contexts/AuthContext';
import { uploadImageFile, transformGoogleDriveUrl } from '@/lib/storage';

const COLORS = ['#CDB7D9', '#9F87C4', '#765BA0', '#4E317D', '#280338'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);

  // Upload States (Processing)
  const [isSubmittingClub, setIsSubmittingClub] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Filters
  const [showAddClub, setShowAddClub] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userClubFilter, setUserClubFilter] = useState('all');
  const [clubCategoryFilter, setClubCategoryFilter] = useState('all');
  const [eventClubFilter, setEventClubFilter] = useState('all');

  // New Club State
  const [newClub, setNewClub] = useState({
    name: '',
    category: 'technical',
    description: '',
    logoFile: null,      // The actual file object
    logoPreview: '',     // The local preview URL
    logoUrl: ''          // The fallback URL text input
  });

  // Event Creation State
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    clubId: '',
    eventName: '',
    posterFile: null,
    posterPreview: '',
    posterUrl: '',
    registrationFee: 0,
    registrationMethod: 'internal',
    registrationLink: '',
  });
  const [formFields, setFormFields] = useState([]);

  // Review Modal State
  const [selectedReview, setSelectedReview] = useState(null);

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const CLUBS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CLUBS_COLLECTION_ID;
  const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
  const REGISTRATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID;
  const EVENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID;
  const PENDING_EVENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PENDING_EVENTS_COLLECTION_ID;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clubsRes, usersRes, registrationsRes, eventsRes, pendingRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, CLUBS_COLLECTION_ID, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, [Query.limit(1000)]),
        databases.listDocuments(DATABASE_ID, EVENTS_COLLECTION_ID, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, PENDING_EVENTS_COLLECTION_ID, [Query.limit(100)])
      ]);

      const eventsData = eventsRes.documents;
      const allUsers = usersRes.documents;
      const pendingData = pendingRes.documents;

      const clubsData = clubsRes.documents.map(club => {
        const clubEvents = eventsData.filter(e => e.clubId === club.$id);
        const coordinator = allUsers.find(u => u.clubName === club.name && u.role === 'coordinator');
        return {
          ...club,
          events: clubEvents,
          coordinatorName: coordinator ? coordinator.name : 'Unassigned'
        };
      });

      setClubs(clubsData);
      setUsers(allUsers);
      setRegistrations(registrationsRes.documents);
      setEvents(eventsData);
      setPendingReviews(pendingData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Upload Helpers (Deferred) ---
  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setNewClub(prev => ({ ...prev, logoFile: file, logoPreview: previewUrl }));
  };

  const handlePosterSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setNewEvent(prev => ({ ...prev, posterFile: file, posterPreview: previewUrl }));
  };


  // --- Club Management ---
  const handleAddClub = async (e) => {
    e.preventDefault();
    setIsSubmittingClub(true);
    try {
      let finalLogoUrl = newClub.logoUrl;

      if (newClub.logoFile) {
        finalLogoUrl = await uploadImageFile(newClub.logoFile);
      }

      console.log("DEBUG: Final Logo URL:", finalLogoUrl);

      await databases.createDocument(
        DATABASE_ID,
        CLUBS_COLLECTION_ID,
        ID.unique(),
        {
          name: newClub.name,
          category: newClub.category,
          description: newClub.description || '',
          logo: finalLogoUrl || '',
        }
      );
      setNewClub({ name: '', category: 'technical', description: '', logoFile: null, logoPreview: '', logoUrl: '' });
      setShowAddClub(false);
      alert('Club added successfully!');
      fetchData();
    } catch (error) {
      console.error('Error adding club:', error);
      alert('Error adding club: ' + error.message);
    } finally {
      setIsSubmittingClub(false);
    }
  };

  // --- User Management ---
  const handlePromoteToCoordinator = async (userId, currentRole) => {
    if (currentRole === 'coordinator') return;
    try {
      await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId,
        { role: 'coordinator' }
      );
      alert('User promoted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Error promoting user');
    }
  };

  const handleAssignClub = async (userId, clubName) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId,
        { clubName: clubName }
      );
      alert('Club assigned successfully!');
      fetchData();
    } catch (error) {
      console.error('Error assigning club:', error);
      alert('Error assigning club');
    }
  };

  // --- Event Creation Logic ---
  const addFormField = () => {
    setFormFields([...formFields, { name: '', label: '', type: 'text', required: false }]);
  };

  const removeFormField = (index) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const updateFormField = (index, field, value) => {
    const updated = [...formFields];
    updated[index][field] = value;
    if (field === 'label') {
      updated[index].name = value.toLowerCase().replace(/\s+/g, '_');
    }
    setFormFields(updated);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.clubId) {
      alert("Please select a club");
      return;
    }
    if (newEvent.registrationMethod === 'internal' && formFields.length === 0) {
      alert('Please add at least one form field for internal registration');
      return;
    }

    setIsSubmittingEvent(true);
    try {
      let finalPosterUrl = newEvent.posterUrl;

      if (newEvent.posterFile) {
        finalPosterUrl = await uploadImageFile(newEvent.posterFile);
      }

      await databases.createDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        ID.unique(),
        {
          clubId: newEvent.clubId,
          name: newEvent.eventName,
          poster: finalPosterUrl,
          registrationFee: Number(newEvent.registrationFee),
          registrationMethod: newEvent.registrationMethod,
          registrationLink: newEvent.registrationMethod === 'external' ? newEvent.registrationLink : null,
          formFields: newEvent.registrationMethod === 'internal' ? JSON.stringify(formFields) : null,
        }
      );
      alert('Event created successfully!');
      setShowAddEvent(false);
      setNewEvent({
        clubId: '', eventName: '', posterFile: null, posterPreview: '', posterUrl: '', registrationFee: 0,
        registrationMethod: 'internal', registrationLink: ''
      });
      setFormFields([]);
      fetchData();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Error creating event: " + error.message);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // --- Review Logic ---
  const handleApproveReview = async (review) => {
    try {
      const changes = JSON.parse(review.proposedChanges);

      // Update the actual event
      await databases.updateDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        review.originalEventId,
        {
          name: changes.name,
          poster: changes.poster,
          registrationFee: changes.registrationFee,
          registrationMethod: changes.registrationMethod,
          registrationLink: changes.registrationLink,
          formFields: changes.formFields
        }
      );

      // Delete the pending review
      await databases.deleteDocument(DATABASE_ID, PENDING_EVENTS_COLLECTION_ID, review.$id);

      alert("Changes approved and applied!");
      setSelectedReview(null);
      fetchData();
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Error approving changes");
    }
  };

  const handleRejectReview = async (reviewId) => {
    if (!confirm("Are you sure you want to reject and delete this request?")) return;
    try {
      await databases.deleteDocument(DATABASE_ID, PENDING_EVENTS_COLLECTION_ID, reviewId);
      alert("Request rejected.");
      setSelectedReview(null);
      fetchData();
    } catch (error) {
      console.error("Error rejecting review:", error);
      alert("Error rejecting request");
    }
  };


  // --- Helper Functions ---
  const getTopClubsData = () => {
    const data = clubs.map(club => {
      const count = registrations.filter(r => r.clubId === club.$id || r.clubId === club.name).length;
      return { name: club.name, count, coordinator: club.coordinatorName };
    });
    return data.sort((a, b) => b.count - a.count);
  };

  const getEventsPieData = () => {
    const categoryCounts = {};
    clubs.forEach(club => {
      if (!categoryCounts[club.category]) categoryCounts[club.category] = 0;
      categoryCounts[club.category] += club.events?.length || 0;
    });
    return Object.keys(categoryCounts).map((cat, index) => ({
      name: cat,
      uv: categoryCounts[cat],
      fill: COLORS[index % COLORS.length]
    }));
  };

  // Filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || '') ||
      (user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || '');
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const matchesClub = userClubFilter === 'all' || user.clubName === userClubFilter;
    return matchesSearch && matchesRole && matchesClub;
  });

  const filteredEvents = events.filter(event => {
    if (eventClubFilter === 'all') return true;
    // Find club name for this event
    const club = clubs.find(c => c.$id === event.clubId);
    return club?.name === eventClubFilter;
  });


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A0B2E]/90 border border-[#CDB7D9]/20 p-4 rounded-xl backdrop-blur-md shadow-xl">
          <p className="font-abril text-[#CDB7D9] text-lg mb-1">{label}</p>
          <p className="text-white font-mono text-sm">
            {payload[0].value} <span className="text-[#CDB7D9]/60">Items</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F0518]">
        <FontAwesomeIcon icon={faSpinner} spin className="text-6xl text-[#CDB7D9]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative text-[#CDB7D9] overflow-hidden bg-[#0F0518]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex z-0 pointer-events-none"
      >
        <img src="/Herosection_BG.svg" alt="BG" className="w-full h-full object-cover opacity-20" />
      </motion.div>

      <motion.div
        animate={{ width: isSidebarOpen ? '18rem' : '5rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-[#1A0B2E]/80 border-r border-[#CDB7D9]/10 z-20 flex flex-col sticky top-0 h-screen pt-10 shadow-[5px_0_30px_rgba(0,0,0,0.5)]"
      >
        <div className="p-4 flex items-center justify-between">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 pl-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#CDB7D9] to-[#4E317D] flex items-center justify-center">
                  <span className="font-medium text-[#1A0B2E] text-xs">AD</span>
                </div>
                <h1 className="text-xl font-medium text-[#CDB7D9] tracking-wider">ADMIN</h1>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[#CDB7D9]/10 rounded-full transition-colors">
            <FontAwesomeIcon icon={isSidebarOpen ? faAngleDoubleLeft : faAngleDoubleRight} className="text-[#CDB7D9]/50" />
          </button>
        </div>

        <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
          {[
            { id: 'overview', label: 'Overview', icon: faTachometerAlt },
            { id: 'reviews', label: 'Reviews', icon: faClipboardCheck },
            { id: 'events', label: 'Events', icon: faCalendarAlt },
            { id: 'clubs', label: 'Clubs', icon: faBuilding },
            { id: 'users', label: 'Users', icon: faUsers },
            { id: 'registrations', label: 'Registrations', icon: faSearch },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setShowAddClub(false); setShowAddEvent(false); }}
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 font-medium group cursor-pointer ${activeTab === item.id
                ? 'bg-gradient-to-r from-[#CDB7D9]/20 to-transparent text-[#CDB7D9]'
                : 'text-[#CDB7D9]/50 hover:text-[#CDB7D9] hover:bg-[#CDB7D9]/5'
                }`}
            >
              <div className="w-6 flex justify-center">
                <FontAwesomeIcon icon={item.icon} className={`text-lg transition-transform group-hover:scale-110`} />
              </div>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="ml-4 whitespace-nowrap overflow-hidden">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.id === 'reviews' && pendingReviews.length > 0 && isSidebarOpen && (
                <span className="ml-auto bg-pink-500 text-[10px] text-white font-bold px-2 py-0.5 rounded-full">{pendingReviews.length}</span>
              )}
            </button>
          ))}
        </nav>
      </motion.div>

      <div className="flex-1 pt-8 flex flex-col h-screen overflow-hidden z-10 relative">
        <header className="h-24 flex items-end px-10 justify-between z-20 sticky top-0">
          <div>
            <h2 className="text-4xl font-abril text-white tracking-wide">
              {activeTab === 'overview' ? 'Overview' :
                activeTab === 'clubs' ? (showAddClub ? 'New Club' : 'Clubs') :
                  activeTab === 'events' ? (showAddEvent ? 'Create Event' : 'Events') :
                    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-[#CDB7D9]/50 text-sm mt-1 font-medium">Welcome back, {user?.name || 'Admin'}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-[#CDB7D9]/10">
          <AnimatePresence mode="wait">

            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    { label: 'Total Registrations', value: registrations.length, icon: faUsers, color: 'text-pink-400' },
                    { label: 'Active Clubs', value: clubs.length, icon: faBuilding, color: 'text-purple-400' },
                    { label: 'Total Events', value: events.length, icon: faCalendarAlt, color: 'text-indigo-400' },
                    { label: 'Pending Reviews', value: pendingReviews.length, icon: faClipboardCheck, color: 'text-yellow-400' },
                  ].map((stat, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#CDB7D9]/5 to-transparent rounded-3xl blur-xl group-hover:opacity-100 opacity-50 transition-opacity"></div>
                      <div className="relative flex items-center gap-6 p-4">
                        <div className={`text-4xl font-light ${stat.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>
                          {stat.value}
                        </div>
                        <div>
                          <h3 className="text-[#CDB7D9]/60 uppercase text-xs font-normal tracking-widest mb-1">{stat.label}</h3>
                          <div className="h-1 w-12 bg-gradient-to-r from-[#CDB7D9]/50 to-transparent rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                  {/* Top Clubs & Pie Chart Same as Before */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-2xl font-abril text-white flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                      Top Performing Clubs
                    </h3>
                    <div className="h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#CDB7D9]/20 scrollbar-track-transparent space-y-3">
                      {getTopClubsData().map((club, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-[#B7C9D9]/5 backdrop-blur-sm border border-[#CDB7D9]/10 rounded-2xl hover:bg-[#CDB7D9]/10 transition-all group">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                              index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                                'bg-[#CDB7D9]/10 text-[#CDB7D9] border border-[#CDB7D9]/20'
                            }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-lg truncate">{club.name}</h4>
                            <p className="text-[#CDB7D9]/50 text-xs uppercase tracking-wide truncate">
                              Coordinator: <span className="text-[#CDB7D9]/70">{club.coordinator}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl text-white font-mono">{club.count}</p>
                            <p className="text-[10px] text-[#CDB7D9]/40 uppercase tracking-widest">Regs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-abril text-white mb-6 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Categories
                    </h3>
                    <div className="h-[400px] w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getEventsPieData()}
                            innerRadius={80}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="uv"
                          >
                            {getEventsPieData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.05)" />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <div className="text-4xl text-white font-bold">{clubs.length}</div>
                        <div className="text-[#CDB7D9]/50 text-xs uppercase tracking-widest">Clubs</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {!selectedReview ? (
                  <div className="bg-[#B7C9D9]/5 backdrop-blur-md border border-[#CDB7D9]/10 rounded-3xl overflow-hidden shadow-2xl p-6">
                    {pendingReviews.length === 0 ? (
                      <div className="text-center py-20 text-[#CDB7D9]/50">No pending reviews.</div>
                    ) : (
                      <div className="grid gap-4">
                        {pendingReviews.map(review => (
                          <div key={review.$id} className="p-6 bg-[#000]/20 rounded-xl border border-[#CDB7D9]/10 flex justify-between items-center group hover:border-[#CDB7D9]/30 transition-all">
                            <div>
                              <h4 className="text-white text-lg font-medium mb-1">Update Request: {review.eventName}</h4>
                              <p className="text-[#CDB7D9]/50 text-sm">Requested by: {review.coordinatorName} (Club ID: {review.clubId})</p>
                            </div>
                            <button
                              onClick={() => setSelectedReview(review)}
                              className="px-6 py-2 bg-[#CDB7D9]/10 hover:bg-[#CDB7D9] hover:text-[#280338] text-[#CDB7D9] rounded-lg transition-all font-medium flex items-center gap-2"
                            >
                              <FontAwesomeIcon icon={faEye} /> Review
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <button onClick={() => setSelectedReview(null)} className="flex items-center gap-2 text-[#CDB7D9]/70 hover:text-[#CDB7D9] mb-4">
                      <FontAwesomeIcon icon={faChevronLeft} /> Back to Reviews
                    </button>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Original Event Not Shown here for brevity, usually you'd fetch it to compare. 
                                 For now showing Proposed Changes */}
                      <div className="bg-[#B7C9D9]/5 p-8 rounded-3xl border border-[#CDB7D9]/10">
                        <h3 className="text-xl text-white mb-6 border-b border-[#CDB7D9]/10 pb-4">Proposed Changes</h3>
                        {(() => {
                          const changes = JSON.parse(selectedReview.proposedChanges);
                          return (
                            <div className="space-y-4 text-sm">
                              <div><span className="text-[#CDB7D9]/50 block">Name</span> <span className="text-white text-lg">{changes.name}</span></div>
                              <div><span className="text-[#CDB7D9]/50 block">Fee</span> <span className="text-white">₹{changes.registrationFee}</span></div>
                              <div><span className="text-[#CDB7D9]/50 block">Method</span> <span className="text-white capitalize">{changes.registrationMethod}</span></div>
                              <div><span className="text-[#CDB7D9]/50 block">Poster</span> <a href={changes.poster} target="_blank" className="text-pink-400 hover:underline truncate block">{changes.poster}</a></div>
                            </div>
                          )
                        })()}
                      </div>

                      <div className="flex flex-col justify-center gap-4">
                        <button
                          onClick={() => handleApproveReview(selectedReview)}
                          className="w-full py-4 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500 hover:text-white transition-all font-bold text-lg flex items-center justify-center gap-3"
                        >
                          <FontAwesomeIcon icon={faCheck} /> Approve Changes
                        </button>
                        <button
                          onClick={() => handleRejectReview(selectedReview.$id)}
                          className="w-full py-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-lg flex items-center justify-center gap-3"
                        >
                          <FontAwesomeIcon icon={faTimes} /> Reject Request
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                {!showAddEvent ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <select
                        value={eventClubFilter}
                        onChange={(e) => setEventClubFilter(e.target.value)}
                        className="px-6 py-2 bg-[#000]/20 text-[#CDB7D9] rounded-xl border border-[#CDB7D9]/20 outline-none"
                      >
                        <option value="all">All Clubs</option>
                        {clubs.map(c => <option key={c.$id} value={c.name}>{c.name}</option>)}
                      </select>
                      <button
                        onClick={() => setShowAddEvent(true)}
                        className="px-6 py-2 bg-[#CDB7D9] text-[#280338] rounded-xl font-bold flex items-center gap-2 hover:-translate-y-1 transition-all"
                      >
                        <FontAwesomeIcon icon={faPlus} /> Create Event
                      </button>
                    </div>

                    <div className="bg-[#B7C9D9]/5 backdrop-blur-md border border-[#CDB7D9]/10 rounded-3xl overflow-hidden shadow-2xl">
                      <table className="w-full text-[#CDB7D9] text-left border-collapse">
                        <thead className="bg-[#CDB7D9]/5 text-[#CDB7D9]/50 uppercase text-xs font-normal tracking-widest leading-loose">
                          <tr>
                            <th className="px-8 py-6">Event Name</th>
                            <th className="px-8 py-6">Club</th>
                            <th className="px-8 py-6 text-center">Registrations</th>
                            <th className="px-8 py-6 text-right">Fee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#CDB7D9]/5">
                          {filteredEvents.map(event => {
                            const clubName = clubs.find(c => c.$id === event.clubId)?.name || 'Unknown';
                            const regCount = registrations.filter(r => r.eventId === event.$id).length;
                            return (
                              <tr key={event.$id} className="hover:bg-[#CDB7D9]/5 transition-colors">
                                <td className="px-8 py-5 text-white font-medium text-lg">{event.name}</td>
                                <td className="px-8 py-5">{clubName}</td>
                                <td className="px-8 py-5 text-center font-mono">{regCount}</td>
                                <td className="px-8 py-5 text-right font-mono text-white">₹{event.registrationFee}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      {filteredEvents.length === 0 && <div className="text-center py-10 text-[#CDB7D9]/50">No events found.</div>}
                    </div>
                  </>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <button onClick={() => setShowAddEvent(false)} className="flex items-center gap-2 text-[#CDB7D9]/70 hover:text-[#CDB7D9] mb-4">
                      <FontAwesomeIcon icon={faChevronLeft} /> Back to Events
                    </button>
                    <div className="bg-[#B7C9D9]/5 backdrop-blur-xl border border-[#CDB7D9]/20 rounded-3xl p-8">
                      <h3 className="text-2xl text-white font-abril mb-6">Create New Event</h3>
                      <form onSubmit={handleCreateEvent} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="block text-[#CDB7D9]/70 text-xs uppercase tracking-wider mb-2">Club</label>
                            <select
                              required
                              value={newEvent.clubId}
                              onChange={(e) => setNewEvent({ ...newEvent, clubId: e.target.value })}
                              className="w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] outline-none"
                            >
                              <option value="" className="bg-[#1A0B2E]">Select Club</option>
                              {clubs.map(c => <option key={c.$id} value={c.$id} className="bg-[#1A0B2E]">{c.name}</option>)}
                            </select>
                          </div>
                          <div className="group">
                            <label className="block text-[#CDB7D9]/70 text-xs uppercase tracking-wider mb-2">Event Name</label>
                            <input
                              type="text" required
                              value={newEvent.eventName}
                              onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                              className="w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="block text-[#CDB7D9]/70 text-xs uppercase tracking-wider mb-2">Poster</label>
                            <div className="space-y-2">
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePosterSelect}
                                  className="hidden"
                                  id="poster-upload"
                                />
                                <label htmlFor="poster-upload" className="flex items-center justify-center w-full px-4 py-4 bg-[#000]/20 border border-dashed border-[#CDB7D9]/30 rounded-2xl cursor-pointer hover:bg-[#CDB7D9]/5 transition-all text-[#CDB7D9]/70 gap-2">
                                  {isSubmittingEvent ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUpload} />}
                                  <span>{newEvent.posterPreview ? 'Change Poster' : 'Click to Upload'}</span>
                                </label>
                              </div>
                              {newEvent.posterPreview ? (
                                <div className="relative mt-2 rounded-xl overflow-hidden border border-[#CDB7D9]/20 h-32 w-full">
                                  <img src={newEvent.posterPreview} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <input
                                  type="url"
                                  placeholder="Or paste URL"
                                  value={newEvent.posterUrl}
                                  onChange={(e) => setNewEvent({ ...newEvent, posterUrl: e.target.value })}
                                  className="w-full px-4 py-2 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-xl focus:border-[#CDB7D9] outline-none text-sm"
                                />
                              )}
                            </div>
                          </div>
                          <div className="group">
                            <label className="block text-[#CDB7D9]/70 text-xs uppercase tracking-wider mb-2">Registration Fee</label>
                            <input
                              type="number" min="0"
                              value={newEvent.registrationFee}
                              onChange={(e) => setNewEvent({ ...newEvent, registrationFee: e.target.value })}
                              className="w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] outline-none"
                            />
                          </div>
                        </div>

                        <div className="group">
                          <label className="block text-[#CDB7D9]/70 text-xs uppercase tracking-wider mb-2">Registration Method</label>
                          <select
                            value={newEvent.registrationMethod}
                            onChange={(e) => setNewEvent({ ...newEvent, registrationMethod: e.target.value })}
                            className="w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] outline-none"
                          >
                            <option value="internal" className="bg-[#1A0B2E]">Internal Form</option>
                            <option value="external" className="bg-[#1A0B2E]">External Link</option>
                          </select>
                        </div>

                        {newEvent.registrationMethod === 'external' ? (
                          <div className="group">
                            <label className="block text-[#CDB7D9]/70 text-xs uppercase tracking-wider mb-2">Registration Link</label>
                            <input
                              type="url" required
                              value={newEvent.registrationLink}
                              onChange={(e) => setNewEvent({ ...newEvent, registrationLink: e.target.value })}
                              className="w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] outline-none"
                            />
                          </div>
                        ) : (
                          <div className="p-6 bg-[#000]/20 rounded-2xl border border-[#CDB7D9]/10">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-white font-medium">Form Fields</h4>
                              <button type="button" onClick={addFormField} className="text-xs bg-[#CDB7D9]/10 hover:bg-[#CDB7D9] hover:text-[#280338] px-3 py-1 rounded-lg transition-colors text-[#CDB7D9]">Add Field</button>
                            </div>
                            <div className="space-y-3">
                              {formFields.map((field, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <input
                                    placeholder="Label"
                                    value={field.label}
                                    onChange={(e) => updateFormField(idx, 'label', e.target.value)}
                                    className="flex-1 px-4 py-2 bg-[#1A0B2E] border border-[#CDB7D9]/20 rounded-xl text-sm"
                                  />
                                  <select
                                    value={field.type}
                                    onChange={(e) => updateFormField(idx, 'type', e.target.type)}
                                    className="px-4 py-2 bg-[#1A0B2E] border border-[#CDB7D9]/20 rounded-xl text-sm"
                                  >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="email">Email</option>
                                  </select>
                                  <button type="button" onClick={() => removeFormField(idx)} className="text-red-400 hover:text-red-300 px-2"><FontAwesomeIcon icon={faTimes} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button disabled={isSubmittingEvent} type="submit" className="w-full py-4 bg-[#CDB7D9] text-[#280338] font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(205,183,217,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {isSubmittingEvent ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : null}
                          {isSubmittingEvent ? 'Creating...' : 'Create Event'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'clubs' && (
              <motion.div
                key="clubs"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {!showAddClub ? (
                  <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                      <div className="flex bg-[#B7C9D9]/5 p-1 rounded-xl backdrop-blur-md border border-[#CDB7D9]/10">
                        {['all', 'technical', 'non-technical'].map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setClubCategoryFilter(filter)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${clubCategoryFilter === filter
                              ? 'bg-[#CDB7D9] text-[#280338] shadow-[0_0_15px_rgba(205,183,217,0.3)]'
                              : 'text-[#CDB7D9]/60 hover:text-[#CDB7D9]'
                              }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowAddClub(true)}
                        className="px-8 py-3 bg-gradient-to-r from-[#CDB7D9] to-[#9F87C4] text-[#280338] rounded-full cursor-pointer font-bold flex items-center gap-3 hover:-translate-y-1"
                      >
                        <FontAwesomeIcon icon={faPlus} /> Create New
                      </button>
                    </div>

                    <div className="grid gap-4">
                      {clubs
                        .filter(c => clubCategoryFilter === 'all' || c.category === clubCategoryFilter)
                        .map((club) => (
                          <div key={club.$id} className="group relative overflow-hidden bg-[#B7C9D9]/5 backdrop-blur-md border border-[#CDB7D9]/10 rounded-2xl p-6 hover:bg-[#CDB7D9]/10 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#CDB7D9]/10 to-[#1A0B2E]/50 flex items-center justify-center border border-[#CDB7D9]/20 group-hover:scale-105 transition-transform overflow-hidden relative">
                                {club.logo ? (
                                  <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                                ) : (
                                  <FontAwesomeIcon icon={faBuilding} className="text-2xl text-[#CDB7D9]" />
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-xl font-medium text-white">{club.name}</h3>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${club.category === 'technical'
                                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                    : 'bg-pink-500/10 text-pink-300 border-pink-500/20'
                                    }`}>
                                    {club.category}
                                  </span>
                                </div>
                                <p className="text-[#CDB7D9]/50 text-sm flex items-center gap-2">
                                  Coordinator: <span className="text-[#CDB7D9]">{club.coordinatorName}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-12 lg:pr-12">
                              <div className="text-center">
                                <p className="text-xl font-mono text-white">{club.events?.length || 0}</p>
                                <p className="text-[10px] text-[#CDB7D9]/40 uppercase tracking-widest">Events</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
                    <button onClick={() => setShowAddClub(false)} className="mb-8 text-[#CDB7D9]/50 hover:text-[#CDB7D9] flex items-center gap-2 transition-colors group cursor-pointer">
                      <div className="p-2 rounded-full border border-[#CDB7D9]/20 group-hover:bg-[#CDB7D9] group-hover:text-[#280338] transition-all">
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </div>
                      <span className="font-medium">Back to Club List</span>
                    </button>

                    <div className="grid lg:grid-cols-5 gap-8">
                      <div className="lg:col-span-2 order-first lg:order-last">
                        <div className="bg-[#B7C9D9]/5 backdrop-blur-xl border border-[#CDB7D9]/20 rounded-3xl p-8 h-full min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-[#CDB7D9]/40 transition-colors cursor-pointer border-dashed">
                          <label className="cursor-pointer inset-0 absolute flex flex-col items-center justify-center">
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                            {newClub.logoPreview ? (
                              <img src={newClub.logoPreview} className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <div className="w-24 h-24 rounded-full bg-[#CDB7D9]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                  <FontAwesomeIcon icon={faPlus} className="text-3xl text-[#CDB7D9]/50 group-hover:text-[#CDB7D9]" />
                                </div>
                                <h4 className="text-xl text-white mb-2">Club Logo</h4>
                                <p className="text-[#CDB7D9]/50 text-sm max-w-[200px]">Click to upload club logo</p>
                              </>
                            )}
                          </label>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#CDB7D9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                      </div>

                      <form onSubmit={handleAddClub} className="lg:col-span-3 relative">
                        <h3 className="text-3xl font-abril text-white mb-8">New Club Details</h3>
                        <div className="space-y-6">
                          <div className="relative group">
                            <input
                              type="text"
                              required
                              value={newClub.name}
                              onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                              className="peer w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] focus:outline-none transition-all placeholder-transparent"
                              placeholder="Club Name"
                            />
                            <label className="absolute left-6 top-4 text-[#CDB7D9]/50 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-[#CDB7D9] peer-focus:bg-[#1A0B2E] peer-focus:px-2 pointer-events-none">
                              Club Name
                            </label>
                          </div>

                          <div className="relative group">
                            <select
                              value={newClub.category}
                              onChange={(e) => setNewClub({ ...newClub, category: e.target.value })}
                              className="w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] focus:outline-none appearance-none cursor-pointer"
                            >
                              <option value="technical" className="bg-[#1A0B2E]">Technical</option>
                              <option value="non-technical" className="bg-[#1A0B2E]">Non-Technical</option>
                              <option value="pro-night" className="bg-[#1A0B2E]">Pro Night</option>
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#CDB7D9]/50">
                              <FontAwesomeIcon icon={faChevronRight} className="rotate-90" />
                            </div>
                          </div>

                          <div className="relative group">
                            <textarea
                              value={newClub.description}
                              onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                              className="peer w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] focus:outline-none transition-all placeholder-transparent h-40 resize-none"
                              placeholder="Description"
                            />
                            <label className="absolute left-6 top-4 text-[#CDB7D9]/50 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-[#CDB7D9] peer-focus:bg-[#1A0B2E] peer-focus:px-2 pointer-events-none">
                              Description
                            </label>
                          </div>

                          <button disabled={isSubmittingClub} type="submit" className="w-full py-4 bg-[#CDB7D9] text-[#280338] font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(205,183,217,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmittingClub ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : null}
                            {isSubmittingClub ? 'Adding...' : 'Add Club'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[#B7C9D9]/5 backdrop-blur-md border border-[#CDB7D9]/10 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-8 border-b border-[#CDB7D9]/10 grid md:grid-cols-3 gap-6">
                  <div className="relative bg-[#000]/20 rounded-xl overflow-hidden">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-[#CDB7D9]/30" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-transparent text-[#CDB7D9] outline-none placeholder-[#CDB7D9]/30"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-6 py-4 bg-[#000]/20 text-[#CDB7D9] rounded-xl border border-transparent focus:border-[#CDB7D9]/30 outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A0B2E]">All Roles</option>
                    <option value="member" className="bg-[#1A0B2E]">Member</option>
                    <option value="coordinator" className="bg-[#1A0B2E]">Coordinator</option>
                    <option value="admin" className="bg-[#1A0B2E]">Admin</option>
                  </select>
                  <select
                    value={userClubFilter}
                    onChange={(e) => setUserClubFilter(e.target.value)}
                    className="px-6 py-4 bg-[#000]/20 text-[#CDB7D9] rounded-xl border border-transparent focus:border-[#CDB7D9]/30 outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A0B2E]">All Clubs</option>
                    {clubs.map(c => <option key={c.$id} value={c.name} className="bg-[#1A0B2E]">{c.name}</option>)}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[#CDB7D9] text-left border-collapse">
                    <thead className="bg-[#CDB7D9]/5 text-[#CDB7D9]/50 uppercase text-xs font-normal tracking-widest leading-loose">
                      <tr>
                        <th className="px-8 py-6">User</th>
                        <th className="px-8 py-6">Role</th>
                        <th className="px-8 py-6">Club Affiliation</th>
                        <th className="px-8 py-6 text-right">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CDB7D9]/5">
                      {filteredUsers.map(user => (
                        <tr key={user.$id} className="hover:bg-[#CDB7D9]/5 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="font-medium text-white text-lg">{user.name}</div>
                            <div className="text-xs text-[#CDB7D9]/50 font-mono mt-1">{user.email}</div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1 text-[10px] rounded-full font-bold uppercase tracking-widest border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' :
                              user.role === 'coordinator' ? 'bg-pink-500/10 text-pink-300 border-pink-500/20' :
                                'bg-white/5 text-gray-400 border-white/10'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            {user.clubName ? (
                              <span className="text-[#CDB7D9] font-medium">{user.clubName}</span>
                            ) : (
                              <span className="text-[#CDB7D9]/20 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            {user.role === 'member' && (
                              <button
                                onClick={() => handlePromoteToCoordinator(user.$id, user.role)}
                                className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-[#CDB7D9]/10 border border-[#CDB7D9]/20 text-[#CDB7D9] rounded-lg hover:bg-[#CDB7D9] hover:text-[#280338] text-xs font-bold uppercase transition-all"
                              >
                                Promote
                              </button>
                            )}
                            {user.role === 'coordinator' && (
                              <select
                                value={user.clubName || ''}
                                onChange={(e) => handleAssignClub(user.$id, e.target.value)}
                                className="px-3 py-2 bg-[#000]/40 border border-[#CDB7D9]/20 text-[#CDB7D9] rounded-lg text-xs outline-none focus:border-[#CDB7D9] cursor-pointer"
                              >
                                <option value="" className="bg-[#1A0B2E]">Assign Club</option>
                                {clubs.map(c => <option key={c.$id} value={c.name} className="bg-[#1A0B2E]">{c.name}</option>)}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'registrations' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid gap-4"
              >
                {clubs.flatMap(club =>
                  club.events?.map(event => {
                    const count = registrations.filter(r => r.eventId === event.$id).length;
                    return (
                      <div key={event.$id} className="bg-[#B7C9D9]/5 backdrop-blur-md border border-[#CDB7D9]/10 rounded-2xl p-6 flex justify-between items-center hover:border-[#CDB7D9]/30 hover:bg-[#B7C9D9]/10 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-[#CDB7D9]/10 flex items-center justify-center text-[#CDB7D9]">
                            {event.poster ? <img src={event.poster} className="w-full h-full object-cover rounded-xl" /> : <FontAwesomeIcon icon={faTrophy} />}
                          </div>
                          <div>
                            <h3 className="text-xl font-medium text-white">{event.name}</h3>
                            <p className="text-[#CDB7D9]/50 text-sm">{club.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-mono text-[#CDB7D9]">{count}</div>
                          <p className="text-[10px] uppercase tracking-widest text-[#CDB7D9]/40">Registrations</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
