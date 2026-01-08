'use client';

import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faPlus, faTrash, faEdit, faSearch, faChevronLeft, faChevronRight,
  faCalendarAlt, faClipboardList, faTachometerAlt, faAngleDoubleLeft, faAngleDoubleRight,
  faPaperPlane, faUpload
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImageFile } from '@/lib/storage';

export default function CoordinatorDashboard({ clubName }) {
  const { userData } = useAuth();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState('events');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Edit/Suggest State
  const [showSuggestEdit, setShowSuggestEdit] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [newEvent, setNewEvent] = useState({
    eventName: '',
    posterFile: null,      // File object
    posterPreview: '',     // Local preview
    posterUrl: '',         // Existing/Fallback URL
    registrationFee: 0,
    registrationMethod: 'internal',
    registrationLink: '',
  });

  // Upload State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
  const itemsPerPage = 50;

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const CLUBS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CLUBS_COLLECTION_ID;
  const EVENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID;
  const REGISTRATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID;
  const PENDING_EVENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PENDING_EVENTS_COLLECTION_ID;

  const fetchClubData = async () => {
    if (!userData?.clubName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const clubRes = await databases.listDocuments(
        DATABASE_ID,
        CLUBS_COLLECTION_ID,
        [Query.equal('name', userData.clubName)]
      );

      if (clubRes.documents.length === 0) {
        setLoading(false);
        return;
      }

      const clubDoc = clubRes.documents[0];
      setClub(clubDoc);

      const eventsRes = await databases.listDocuments(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        [Query.equal('clubId', clubDoc.$id)]
      );
      setEvents(eventsRes.documents);

      const regsRes = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [Query.equal('clubId', clubDoc.$id), Query.limit(1000)]
      );

      const parsedRegistrations = regsRes.documents.map(reg => {
        let formData = {};
        try {
          formData = typeof reg.formData === 'string' ? JSON.parse(reg.formData) : reg.formData;
        } catch (e) { console.error("Error parsing form data", e); }
        return { ...reg, formData };
      });

      setAllRegistrations(parsedRegistrations);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [userData?.clubName]);


  // --- Form Field Logic (for suggestions) ---
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

  // --- Upload Helper (Deferred) ---
  const handlePosterSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setNewEvent(prev => ({ ...prev, posterFile: file, posterPreview: previewUrl }));
  };


  // --- Suggest Edit Logic ---
  const startSuggestEdit = (event) => {
    setSelectedEventId(event.$id);

    let parsedFields = [];
    if (event.formFields) {
      try {
        parsedFields = typeof event.formFields === 'string' ? JSON.parse(event.formFields) : event.formFields;
      } catch (e) { }
    }

    setNewEvent({
      eventName: event.name,
      posterFile: null,
      posterPreview: event.poster || '', // Use existing as initial preview
      posterUrl: event.poster || '',
      registrationFee: event.registrationFee || 0,
      registrationMethod: event.registrationMethod,
      registrationLink: event.registrationLink || '',
    });
    setFormFields(parsedFields);
    setShowSuggestEdit(true);
  };

  const handleSuggestEdit = async (e) => {
    e.preventDefault();

    if (newEvent.registrationMethod === 'internal' && formFields.length === 0) {
      alert('Please add at least one form field for internal registration');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPosterUrl = newEvent.posterUrl;
      if (newEvent.posterFile) {
        finalPosterUrl = await uploadImageFile(newEvent.posterFile);
      }

      const proposedChanges = {
        name: newEvent.eventName,
        poster: finalPosterUrl,
        registrationFee: Number(newEvent.registrationFee),
        registrationMethod: newEvent.registrationMethod,
        registrationLink: newEvent.registrationMethod === 'external' ? newEvent.registrationLink : null,
        formFields: newEvent.registrationMethod === 'internal' ? JSON.stringify(formFields) : null,
      };

      await databases.createDocument(
        DATABASE_ID,
        PENDING_EVENTS_COLLECTION_ID,
        ID.unique(),
        {
          originalEventId: selectedEventId,
          clubId: club.$id,
          proposedChanges: JSON.stringify(proposedChanges),
          coordinatorId: userData.$id,
          coordinatorName: userData.name,
          eventName: newEvent.eventName,
          status: 'pending'
        }
      );

      alert('Edit suggestion sent to Admin for review!');
      setShowSuggestEdit(false);
      setNewEvent({ eventName: '', posterFile: null, posterPreview: '', posterUrl: '', registrationFee: 0, registrationMethod: 'internal', registrationLink: '' });
      setFormFields([]);
      setSelectedEventId(null);
    } catch (error) {
      console.error('Error suggesting edit:', error);
      alert('Error sending suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- Registration Filter Logic ---
  const filteredRegistrations = allRegistrations.filter(reg => {
    const matchesSearch = searchTerm === '' ||
      JSON.stringify(reg.formData).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = filterEvent === 'all' || reg.eventId === filterEvent;
    return matchesSearch && matchesEvent;
  });

  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, startIndex + itemsPerPage);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F0518]">
        <FontAwesomeIcon icon={faSpinner} spin className="text-6xl text-[#CDB7D9]" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F0518] text-[#CDB7D9]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">No Club Assigned</h2>
          <p className="opacity-50">Please contact an admin to assign you to a club.</p>
        </div>
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

      {/* Sidebar */}
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
                  <span className="font-medium text-[#1A0B2E] text-xs">CO</span>
                </div>
                <h1 className="text-xl font-medium text-[#CDB7D9] tracking-wider">COORD</h1>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[#CDB7D9]/10 rounded-full transition-colors">
            <FontAwesomeIcon icon={isSidebarOpen ? faAngleDoubleLeft : faAngleDoubleRight} className="text-[#CDB7D9]/50" />
          </button>
        </div>

        <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
          {[
            { id: 'events', label: 'Events', icon: faCalendarAlt },
            { id: 'registrations', label: 'Registrations', icon: faClipboardList },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setShowSuggestEdit(false); }}
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
            </button>
          ))}
        </nav>
      </motion.div>

      <div className="flex-1 pt-8 flex flex-col h-screen overflow-hidden z-10 relative">
        <header className="h-24 flex items-end px-10 justify-between z-20 sticky top-0">
          <div>
            <h2 className="text-4xl font-abril text-white tracking-wide">
              {activeTab === 'events' ? 'My Events' : 'Registrations'}
            </h2>
            <p className="text-[#CDB7D9]/50 text-sm mt-1 font-medium">Managing Club: {club.name}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-[#CDB7D9]/10">
          <AnimatePresence mode="wait">

            {activeTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                {!showSuggestEdit ? (
                  <div className="bg-[#B7C9D9]/5 backdrop-blur-md border border-[#CDB7D9]/10 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-[#CDB7D9] text-left border-collapse">
                      <thead className="bg-[#CDB7D9]/5 text-[#CDB7D9]/50 uppercase text-xs font-normal tracking-widest leading-loose">
                        <tr>
                          <th className="px-8 py-6">Event Name</th>
                          <th className="px-8 py-6">Method</th>
                          <th className="px-8 py-6 text-right">Fee</th>
                          <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#CDB7D9]/5">
                        {events.map(event => (
                          <tr key={event.$id} className="hover:bg-[#CDB7D9]/5 transition-colors">
                            <td className="px-8 py-5 text-white font-medium text-lg">{event.name}</td>
                            <td className="px-8 py-5 capitalize">{event.registrationMethod}</td>
                            <td className="px-8 py-5 text-right font-mono text-white">₹{event.registrationFee}</td>
                            <td className="px-8 py-5 text-right">
                              <button
                                onClick={() => startSuggestEdit(event)}
                                className="px-4 py-2 bg-[#CDB7D9]/10 border border-[#CDB7D9]/20 text-[#CDB7D9] rounded-lg hover:bg-[#CDB7D9] hover:text-[#280338] text-xs font-bold uppercase transition-all flex items-center gap-2 ml-auto"
                              >
                                <FontAwesomeIcon icon={faEdit} /> Suggest Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {events.length === 0 && (
                      <div className="text-center py-12 text-[#CDB7D9]/50">No events found for this club.</div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <button onClick={() => setShowSuggestEdit(false)} className="flex items-center gap-2 text-[#CDB7D9]/70 hover:text-[#CDB7D9] mb-4">
                      <FontAwesomeIcon icon={faChevronLeft} /> Back to Events
                    </button>
                    <div className="bg-[#B7C9D9]/5 backdrop-blur-xl border border-[#CDB7D9]/20 rounded-3xl p-8">
                      <div className="mb-6 border-b border-[#CDB7D9]/10 pb-4">
                        <h3 className="text-2xl text-white font-abril mb-1">Suggest Edits: {newEvent.eventName}</h3>
                        <p className="text-[#CDB7D9]/50 text-sm">Make changes below and submit for admin approval.</p>
                      </div>

                      <form onSubmit={handleSuggestEdit} className="space-y-6">
                        <div className="group">
                          <label className="block text-[#CDB7D9]/70 text-xs uppercase tracking-wider mb-2">Event Name</label>
                          <input
                            type="text" required
                            value={newEvent.eventName}
                            onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                            className="w-full px-6 py-4 bg-[#000]/20 border border-[#CDB7D9]/20 text-white rounded-2xl focus:border-[#CDB7D9] outline-none"
                          />
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
                                  {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUpload} />}
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
                                  <button type="button" onClick={() => removeFormField(idx)} className="text-red-400 hover:text-red-300 px-2"><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-[#CDB7D9] text-[#280338] font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(205,183,217,0.3)] hover:-translate-y-0.5 transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                          {isSubmitting ? 'Sending...' : 'Send for Review'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'registrations' && (
              <motion.div
                key="registrations"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-[#B7C9D9]/5 backdrop-blur-md border border-[#CDB7D9]/10 rounded-3xl overflow-hidden shadow-2xl p-6"
              >
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1 bg-[#000]/20 rounded-xl overflow-hidden">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-[#CDB7D9]/30" />
                    <input
                      type="text"
                      placeholder="Search registrations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-transparent text-[#CDB7D9] outline-none placeholder-[#CDB7D9]/30"
                    />
                  </div>
                  <div className="relative flex-1">
                    <select
                      value={filterEvent}
                      onChange={(e) => setFilterEvent(e.target.value)}
                      className="w-full px-6 py-4 bg-[#000]/20 text-[#CDB7D9] rounded-xl border border-transparent focus:border-[#CDB7D9]/30 outline-none cursor-pointer appearance-none"
                    >
                      <option value="all" className="bg-[#1A0B2E]">All Events</option>
                      {events.map(e => <option key={e.$id} value={e.$id} className="bg-[#1A0B2E]">{e.name}</option>)}
                    </select>
                    <FontAwesomeIcon icon={faChevronRight} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-[#CDB7D9]/50 pointer-events-none" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[#CDB7D9] text-left border-collapse">
                    <thead className="bg-[#CDB7D9]/5 text-[#CDB7D9]/50 uppercase text-xs font-normal tracking-widest leading-loose">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Event</th>
                        <th className="px-6 py-4 whitespace-nowrap">Date</th>
                        {paginatedRegistrations.length > 0 && paginatedRegistrations[0].formData &&
                          Object.keys(paginatedRegistrations[0].formData)
                            .filter(key => key !== 'eventId')
                            .map(key => (
                              <th key={key} className="px-6 py-4 whitespace-nowrap capitalize">
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))
                        }
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CDB7D9]/5">
                      {paginatedRegistrations.map((reg, index) => {
                        const eventName = events.find(e => e.$id === reg.eventId)?.name || '-';
                        const formDataKeys = reg.formData ? Object.keys(reg.formData).filter(key => key !== 'eventId') : [];
                        return (
                          <tr key={index} className="hover:bg-[#CDB7D9]/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{eventName}</td>
                            <td className="px-6 py-4">{new Date(reg.$createdAt).toLocaleDateString()}</td>
                            {formDataKeys.map(key => (
                              <td key={key} className="px-6 py-4">
                                {reg.formData[key] || '-'}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-full border border-[#CDB7D9]/20 flex items-center justify-center text-[#CDB7D9]/50 hover:bg-[#CDB7D9] hover:text-[#280338] disabled:opacity-30 transition-all font-bold"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <span className="text-sm font-medium text-[#CDB7D9]/70">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-full border border-[#CDB7D9]/20 flex items-center justify-center text-[#CDB7D9]/50 hover:bg-[#CDB7D9] hover:text-[#280338] disabled:opacity-30 transition-all font-bold"
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
