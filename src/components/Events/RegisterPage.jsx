import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { databases, account } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

export default function RegisterPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [club, setClub] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const EVENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID;
    const CLUBS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CLUBS_COLLECTION_ID;
    const REGISTRATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID;

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const eventDoc = await databases.getDocument(
                    DATABASE_ID,
                    EVENTS_COLLECTION_ID,
                    eventId
                );
                setEvent(eventDoc);

                if (eventDoc.formFields && typeof eventDoc.formFields === 'string') {
                    eventDoc.parsedFormFields = JSON.parse(eventDoc.formFields);
                    const initialData = {};
                    eventDoc.parsedFormFields.forEach(field => {
                        initialData[field.name] = '';
                    });
                    setFormData(initialData);
                }

                const clubDoc = await databases.getDocument(
                    DATABASE_ID,
                    CLUBS_COLLECTION_ID,
                    eventDoc.clubId
                );
                setClub(clubDoc);

            } catch (error) {
                console.error('Error fetching event:', error);
                setError('Event not found or failed to load.');
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('You must be logged in to register.');
            return;
        }

        setSubmitting(true);
        try {
            await databases.createDocument(
                DATABASE_ID,
                REGISTRATIONS_COLLECTION_ID,
                ID.unique(),
                {
                    eventId: eventId,
                    clubId: event.clubId,
                    userId: user.$id,
                    userEmail: user.email,
                    formData: JSON.stringify(formData),

                }
            );

            alert('Registration successful!');
            navigate('/events');
        } catch (error) {
            console.error('Error submitting registration:', error);
            alert('Error submitting registration. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} spin className="text-5xl text-purple-600" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-12 text-center max-w-2xl">
                    <p className="text-3xl font-abril text-white mb-4">Event Not Found</p>
                    <p className="text-gray-300 mb-8">
                        {error || `The event with ID "${eventId}" doesn't exist.`}
                    </p>
                    <Link
                        to="/events"
                        className="inline-block px-8 py-4 bg-purple-600 text-white rounded-xl hover:opacity-90 hover:shadow-lg transition-all duration-300 font-semibold"
                    >
                        Browse All Events
                    </Link>
                </div>
            </div>
        );
    }

    if (event.registrationMethod === 'external') {
        return (
            <div className="min-h-screen bg-black text-white">
                <section className="py-20 px-4">
                    <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-10 text-center">
                        {event.poster && (
                            <div className="relative h-80 overflow-hidden rounded-2xl mb-8">
                                <img
                                    src={event.poster}
                                    alt={event.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <h1 className="text-4xl md:text-5xl font-abril text-white mb-6">
                            {event.name}
                        </h1>
                        <p className="text-gray-300 mb-10 text-lg">
                            This event uses external registration. Click the button below to register.
                        </p>

                        <a
                            href={event.registrationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg rounded-xl hover:opacity-90 hover:shadow-xl transition-all duration-300 font-semibold"
                        >
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                            Register Now
                        </a>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">

            <section className="py-20 px-4">
                <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-10 shadow-2xl">
                    {event.poster && (
                        <div className="relative h-80 overflow-hidden rounded-2xl mb-8">
                            <img
                                src={event.poster}
                                alt={event.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <h1 className="text-4xl md:text-5xl font-abril text-white mb-3">
                        Register for {event.name}
                    </h1>
                    <p className="text-sm text-gray-400 mb-10">Event ID: {event.$id}</p>

                    {!user ? (
                        <div className="text-center p-6 bg-red-500/10 border border-red-500/50 rounded-xl mb-6">
                            <p className="text-red-200 mb-4">Please login to register for this event.</p>
                            <Link to="/login" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Login</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {event.parsedFormFields && event.parsedFormFields.length > 0 ? (
                                event.parsedFormFields.map((field, index) => (
                                    <div key={index}>
                                        <label className="block text-white mb-2 font-semibold">
                                            {field.label}
                                            {field.required && <span className="text-pink-600 ml-1">*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                required={field.required}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleChange(field.name, e.target.value)}
                                                className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-900 outline-none transition-all"
                                                rows="4"
                                            />
                                        ) : field.type === 'select' ? (
                                            <select
                                                required={field.required}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleChange(field.name, e.target.value)}
                                                className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-900 outline-none transition-all"
                                                style={{ colorScheme: 'dark' }}
                                            >
                                                <option value="" className="bg-black text-white">Select an option</option>
                                                {field.options?.map((option, i) => (
                                                    <option key={i} value={option} className="bg-black text-white">{option}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type || 'text'}
                                                required={field.required}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleChange(field.name, e.target.value)}
                                                className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-900 outline-none transition-all"
                                            />
                                        )}
                                    </div>
                                ))
                            ) : <p className="text-gray-400">No additional details required. Click submit to register.</p>}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg rounded-xl hover:opacity-90 hover:shadow-xl transition-all duration-300 disabled:opacity-50 font-semibold cursor-pointer"
                            >
                                {submitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Registration'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </div>
    );
}
