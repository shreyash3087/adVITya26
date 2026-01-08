import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

function LoginForm({ onSuccess }) {
    const { loginWithGoogle, loginWithMagicLink, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [error, setError] = useState('');
    const [sendingLink, setSendingLink] = useState(false);

    const handleMagicLinkLogin = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your college email ID');
            return;
        }
        setError('');
        setSendingLink(true);

        try {
            const res = await loginWithMagicLink(email);
            if (res.success) {
                setMagicLinkSent(true);
            } else {
                setError('Failed to send magic link. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setSendingLink(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 w-full h-full">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-6xl h-[650px] pt-18 px-20 flex gap-6 shadow-2xl"
        >
            <div className="hidden md:flex w-1/2 rounded-3xl relative bg-[#B7C9D9]/10 backdrop-blur-lg items-center justify-center overflow-hidden">
            </div>

            <div className="w-full md:w-1/2 px-12 py-16 rounded-3xl flex flex-col justify-center bg-[#B7C9D9]/10 backdrop-blur-lg">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-md mx-auto w-full"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold text-[#CDB7D9] mb-4 tracking-tight">LOGIN</h1>
                    <p className="text-[#CDB7D9]/80 text-sm mb-8 leading-relaxed">
                        Dive into the heart of VIT Bhopal with AdVlTya'25 - an electrifying blend of technology and culture. Crafted by the ingenious minds of VIT Bhopal students,
                    </p>

                    {magicLinkSent ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center"
                        >
                            <FontAwesomeIcon icon={faPaperPlane} className="text-3xl text-green-400 mb-3" />
                            <h3 className="text-white font-semibold mb-2">Check your inbox!</h3>
                            <p className="text-white text-sm">
                                We've sent a magic link to <span className="text-green-400">{email}</span>.
                                Click the link in the email to sign in.
                            </p>
                            <button
                                onClick={() => setMagicLinkSent(false)}
                                className="mt-4 text-sm text-white hover:text-white underline cursor-pointer"
                            >
                                Try another email
                            </button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleMagicLinkLogin} className="space-y-2">
                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your College Mail ID"
                                    className="w-full bg-[#CDB7D9]/10 text-white placeholder-[#CDB7D9]/80 rounded-xl px-5 py-4 focus:outline-none transition-all text-sm"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs text-center">{error}</p>
                            )}

                            <button type="submit" className="hidden" />
                            <AnimatePresence>
                                {email && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <button
                                            type="submit"
                                            disabled={sendingLink}
                                            className={`w-full py-4 rounded-xl cursor-pointer font-semibold transition-all duration-300 text-sm ${sendingLink
                                                ? 'bg-[#CDB7D9]/10 text-[#CDB7D9]/80 cursor-not-allowed border border-white/5'
                                                : 'bg-[#CDB7D9]/10 text-white border border-white/10 hover:bg-[#CDB7D9]/30'
                                                }`}
                                        >
                                            {sendingLink ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Sending...
                                                </span>
                                            ) : 'Continue with Email'}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute h-[1px] w-full bg-white/10"></div>
                                <span className="relative bg-transparent px-6 text-gray-500 text-sm">Or</span>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    await loginWithGoogle();
                                    if (onSuccess) onSuccess();
                                }}
                                className="w-full bg-[#CDB7D9]/10 hover:bg-[#CDB7D9]/30 cursor-pointer text-white/90 border border-white/5 py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 group"
                            >
                                <FontAwesomeIcon icon={faGoogle} className="text-xl text-[#CDB7D9]/80" />
                                <span className="text-sm">Sign in with Google</span>
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}

export default LoginForm;
