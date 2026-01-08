import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const CATEGORY_NAMES = {
    'pro-night': 'Pro Night',
    'celebrity-night': 'Celebrity Night',
    'technical': 'Technical Events',
    'non-technical': 'Non-Technical Events',
    'virtual': 'Virtual Events',
    'mp-gaurav': 'MP Gaurav',
};

export default function CategoryEventsPage() {
    const { category } = useParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const CLUBS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CLUBS_COLLECTION_ID;
    const EVENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID;

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const clubsRes = await databases.listDocuments(
                    DATABASE_ID,
                    CLUBS_COLLECTION_ID,
                    [Query.equal('category', category)]
                );

                const clubIds = clubsRes.documents.map(doc => doc.$id);
                const clubMap = {};
                clubsRes.documents.forEach(doc => { clubMap[doc.$id] = doc.name; });

                if (clubIds.length === 0) {
                    setEvents([]);
                    return;
                }

                const eventsRes = await databases.listDocuments(
                    DATABASE_ID,
                    EVENTS_COLLECTION_ID,
                    [Query.equal('clubId', clubIds)]
                );

                const eventsWithClubNames = eventsRes.documents.map(event => ({
                    ...event,
                    clubName: clubMap[event.clubId] || 'Unknown Club'
                }));

                setEvents(eventsWithClubNames);

            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        if (category) {
            fetchEvents();
        }
    }, [category]);

    return (
        <div className="min-h-screen bg-black text-white">
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 173, 218, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(184, 160, 255, 0.15) 0%, transparent 50%)'
                }}></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <Link to="/events" className="text-white hover:text-pink-400 mb-6 inline-flex items-center gap-2 font-semibold transition-colors">
                        <span>←</span> Back to Events
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-abril text-white drop-shadow-lg">
                        {CATEGORY_NAMES[category] || 'Events'}
                    </h1>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="text-center py-20">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-5xl text-purple-600" />
                            <p className="mt-6 text-gray-300 text-lg">Loading events...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-12 max-w-2xl mx-auto">
                                <p className="text-2xl text-gray-300 font-ballet">
                                    No events available yet. Check back soon!
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {events.map((event) => (
                                <div key={event.$id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:scale-105 hover:shadow-2xl hover:border-purple-600/50 transition-all duration-500">
                                    {event.poster && (
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={event.poster}
                                                alt={event.name}
                                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <h3 className="text-2xl font-abril text-white mb-2">
                                            {event.name}
                                        </h3>
                                        <p className="text-sm text-pink-500 font-semibold mb-4 uppercase">
                                            by {event.clubName}
                                        </p>
                                        {event.registrationMethod === 'internal' ? (
                                            <Link
                                                to={`/register/${event.$id}`}
                                                className="block text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 hover:shadow-lg transition-all duration-300 font-semibold"
                                            >
                                                Register Now
                                            </Link>
                                        ) : (
                                            <a
                                                href={event.registrationLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 hover:shadow-lg transition-all duration-300 font-semibold"
                                            >
                                                Register Now
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
