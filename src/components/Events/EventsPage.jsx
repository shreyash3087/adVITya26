import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStar,
    faMicrophone,
    faLaptopCode,
    faUsers,
    faGlobe,
    faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const EVENT_CATEGORIES = [
    {
        id: 'pro-night',
        name: 'Pro Night',
        icon: faStar,
        description: 'Professional artists and performances',
        gradient: 'from-pink-500 to-purple-600',
    },
    {
        id: 'celebrity-night',
        name: 'Celebrity Night',
        icon: faMicrophone,
        description: 'Star-studded evening performances',
        gradient: 'from-purple-600 to-pink-500',
    },
    {
        id: 'technical',
        name: 'Technical Events',
        icon: faLaptopCode,
        description: 'Coding, hackathons, and tech competitions',
        gradient: 'from-pink-500 to-purple-400',
    },
    {
        id: 'non-technical',
        name: 'Non-Technical Events',
        icon: faUsers,
        description: 'Cultural, sports, and entertainment',
        gradient: 'from-purple-400 to-pink-500',
    },
    {
        id: 'virtual',
        name: 'Virtual Events',
        icon: faGlobe,
        description: 'Participate from anywhere in the world',
        gradient: 'from-purple-600 to-pink-400',
    },
    {
        id: 'mp-gaurav',
        name: 'MP Gaurav',
        icon: faTrophy,
        description: 'Special events honoring MP excellence',
        gradient: 'from-pink-500 to-purple-400',
    },
];

export default function EventsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 173, 218, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(184, 160, 255, 0.15) 0%, transparent 50%)'
                }}></div>
                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-abril mb-6 text-white drop-shadow-lg">Events</h1>
                    <p className="text-xl md:text-2xl font-ballet text-white/90">
                        Discover the excitement at Advitya 2026
                    </p>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {EVENT_CATEGORIES.map((category) => (
                            <Link
                                key={category.id}
                                to={`/events/${category.id}`}
                                className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:scale-105 hover:shadow-2xl hover:border-purple-600/50 transition-all duration-500 block"
                            >
                                <div className={`bg-gradient-to-br ${category.gradient} w-20 h-20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                                    <FontAwesomeIcon
                                        icon={category.icon}
                                        className="text-white text-3xl"
                                    />
                                </div>
                                <h3 className="text-2xl font-abril text-white mb-3">
                                    {category.name}
                                </h3>
                                <p className="text-gray-300 font-ballet mb-4 text-lg">
                                    {category.description}
                                </p>
                                <div className="mt-4 text-pink-500 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                                    Explore Events <span>→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-12">
                        <h2 className="text-3xl md:text-5xl font-abril text-white mb-6">
                            Ready to Participate?
                        </h2>
                        <p className="text-lg md:text-xl text-gray-300 mb-8 font-ballet">
                            Sign in to register for events and track your participation
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
