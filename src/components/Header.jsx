import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '@/contexts/UIContext';
import LoginForm from './LoginForm';

function Header() {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Events', path: '/events' },
        { name: 'Sponsors', path: '/sponsors' },
        { name: 'About Us', path: '/about' }
    ];

    const { isHeaderOpen, openHeader, closeHeader, headerMode, setHeaderMode } = useUI();
    const isOpen = isHeaderOpen;
    const setIsOpen = (state) => state ? openHeader() : closeHeader();
    const isDashboard = location.pathname.startsWith('/dashboard');
    if (isDashboard) {
        return null;
    }
    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`fixed w-full py-2 z-50 transition-all duration-300 ${scrolled && !isOpen
                    ? 'backdrop-blur-md shadow-lg border-white/20'
                    : 'bg-transparent'
                    }`}
            >
                <nav className="mx-auto px-8 sm:px-10 md:px-20 py-6">
                    <div className="flex items-center justify-between">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-50"
                        >
                            <Link to="/" className="flex items-center gap-3">
                                <img
                                    src="/Logo_VITBhopal.svg"
                                    alt="VIT Bhopal"
                                    className={`h-10 sm:h-12 w-auto transition-all duration-300 ${isOpen ? 'brightness-0 invert' : ''}`}
                                />
                            </Link>
                        </motion.div>

                        {/* Right Side Buttons */}
                        <div className="flex items-center gap-4 relative z-50">
                            {isOpen && (
                                <Link
                                    to="/register"
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#CDB7D9] text-[#280338] font-semibold hover:opacity-90 transition-opacity"
                                >
                                    <img src="/Register.svg" alt="Register" className="w-5 h-5" />
                                    <span>REGISTER</span>
                                </Link>
                            )}
                            {/* Close/Hamburger Button */}
                            <motion.button
                                onClick={() => setIsOpen(!isOpen)}
                                className="relative z-50 p-2 group h-10 w-10 flex flex-col items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div
                                    className={`absolute h-[3px] rounded-full transition-all duration-300 transform ${isOpen
                                        ? 'w-6 sm:w-8 rotate-45 bg-white'
                                        : 'w-6 sm:w-8 -translate-y-2 bg-[#470067]'
                                        }`}
                                />
                                <div
                                    className={`absolute h-[3px] rounded-full transition-all duration-300 transform ${isOpen
                                        ? 'opacity-0'
                                        : 'w-6 sm:w-8 bg-[#470067]'
                                        }`}
                                />
                                <div
                                    className={`absolute h-[3px] rounded-full transition-all duration-300 transform ${isOpen
                                        ? 'w-6 sm:w-8 -rotate-45 bg-white'
                                        : 'w-4 translate-y-2 translate-x-1 sm:translate-x-2 bg-[#470067] group-hover:w-8 group-hover:translate-x-0'
                                        }`}
                                />
                            </motion.button>
                        </div>
                    </div>
                </nav>
            </motion.header>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-[#0F041C] z-40 flex overflow-hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex z-0"
                        >
                            <img
                                src="/Herosection_BG.svg"
                                alt="Background Left"
                                className="w-full sm:w-1/2 opacity-30 h-full object-cover"
                            />
                            <img
                                src="/Herosection_BG.svg"
                                alt="Background Right"
                                className="hidden sm:block opacity-30 w-1/2 h-full object-cover"
                            />
                        </motion.div>

                        {headerMode === 'login' ? (
                            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                                <LoginForm onSuccess={closeHeader} />
                            </div>
                        ) : (
                            <>
                                {/* Left Side - Images Staggered Grid */}
                                <div className="hidden lg:flex w-1/2 h-full relative z-10 p-8 items-end justify-center pb-0">
                                    <div className="grid grid-cols-2 gap-6 w-full max-w-xl translate-y-[20%]">
                                        <div className="flex flex-col gap-6 -translate-y-12">
                                            <motion.div
                                                initial={{ opacity: 0, y: 50 }}
                                                animate={{ opacity: 0.6, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="w-full aspect-1"
                                            >
                                                <img src="/Image1.svg" alt="Gallery 1" className="w-full h-full object-cover rounded-2xl" />
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 50 }}
                                                animate={{ opacity: 0.6, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="w-full aspect-[3/4]"
                                            >
                                                <img src="/Image3.svg" alt="Gallery 3" className="w-full h-full object-cover rounded-2xl" />
                                            </motion.div>
                                        </div>

                                        {/* Right Column - Positioned slightly lower */}
                                        <div className="flex flex-col gap-6 translate-y-8">
                                            <motion.div
                                                initial={{ opacity: 0, y: 50 }}
                                                animate={{ opacity: 0.6, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="w-full aspect-1"
                                            >
                                                <img src="/Image2.svg" alt="Gallery 2" className="w-full h-full object-cover rounded-2xl" />
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 50 }}
                                                animate={{ opacity: 0.6, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                                className="w-full aspect-1"
                                            >
                                                <img src="/Image1.svg" alt="Gallery 4" className="w-full h-full object-cover rounded-2xl" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Menu */}
                                <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-8 sm:px-16 md:px-24 pt-32 relative z-10 transition-all">
                                    {/* Centered Content Container */}
                                    <div className="flex flex-col pt-20 pb-10 items-center justify-center w-full h-full">
                                        <div className="flex flex-col items-center justify-between w-full h-full">
                                            <div className="flex flex-col items-center gap-8 sm:gap-6 mb-12">
                                                {navItems.map((item, index) => (
                                                    <motion.div
                                                        key={item.path}
                                                        initial={{ opacity: 0, x: 50 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.1 + index * 0.1 }}
                                                    >
                                                        <Link
                                                            to={item.path}
                                                            onClick={() => setIsOpen(false)}
                                                            className={`text-4xl sm:text-5xl font-semibold text-[#CDB7D9] transition-opacity uppercase text-center block ${location.pathname === item.path ? 'opacity-100' : 'opacity-50 hover:opacity-70'}`}
                                                        >
                                                            {item.name}
                                                        </Link>
                                                    </motion.div>
                                                ))}

                                                {isOpen && (
                                                    <Link
                                                        to="/register"
                                                        className="flex sm:hidden block items-center gap-2 px-4 py-2 rounded-lg bg-[#CDB7D9] text-[#280338] font-semibold hover:opacity-90 transition-opacity"
                                                    >
                                                        <img src="/Register.svg" alt="Register" className="w-5 h-5" />
                                                        <span>REGISTER</span>
                                                    </Link>
                                                )}
                                            </div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.6 }}
                                                className="hidden sm:flex flex-col items-center gap-4 mt-8"
                                            >
                                                <a href="mailto:advitya@vitbhopal.ac.in" className="text-[#CDB7D9] hover:text-white transition-colors text-sm tracking-wider uppercase font-semibold">Email Us</a>

                                                <div className="flex items-center gap-3 mt-2">
                                                    <a href="#" className="text-[#CDB7D9] hover:text-white transition-colors uppercase tracking-widest font-medium text-sm">
                                                        YOUTUBE
                                                    </a>
                                                    <a href="#" className="text-[#CDB7D9] hover:text-white transition-colors uppercase tracking-widest font-medium text-sm">
                                                        INSTAGRAM
                                                    </a>
                                                    <a href="#" className="text-[#CDB7D9] hover:text-white transition-colors uppercase tracking-widest font-medium text-sm">
                                                        LINKEDIN
                                                    </a>
                                                    <a href="#" className="text-[#CDB7D9] hover:text-white transition-colors uppercase tracking-widest font-medium text-sm">
                                                        FACEBOOK
                                                    </a>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default Header;