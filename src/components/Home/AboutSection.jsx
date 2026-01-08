import { motion } from 'framer-motion';

const AboutSection = () => {
    return (
        <div className="w-full h-full min-h-[600px] sm:min-h-screen relative flex justify-center items-center z-30">
            <div className="container mx-auto max-w-4xl px-4 text-white/60 text-center">
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-12 px-2 font-normal text-sm sm:text-lg leading-relaxed tracking-normal text-center align-middle"
                >
                    Dive into the heart of VIT Bhopal with AdVlTya'25 - an electrifying blend of technology and culture. Crafted by the ingenious minds of VIT Bhopal students, AdVlTya'25 transcends the ordinary, presenting a dynamic showcase of innovation and creativity. Join us for an immersive experience where every moment sparks brilliance, turning the campus into a canvas of unbridled talent and celebration. AdVlTya'25 is more than an event; it's a journey where the extraordinary takes center stage, inviting you to witness and be part of the magic!
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-10 py-3 sm:py-4 bg-[#FFFFFF66] backdrop-blur-[10px] rounded-full text-white text-lg sm:text-xl font-bold uppercase tracking-wider hover:bg-white/50 transition-all duration-300 mb-12 cursor-pointer relative z-40"
                >
                    Book Tickets
                </motion.button>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.2 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.5 }}
                className="absolute left-1/2 bottom-0 -translate-x-1/2 w-full max-w-2xl pointer-events-none"
            >
                <img
                    src="/Lion.svg"
                    alt="Lion"
                    className="w-full h-auto object-contain"
                />
            </motion.div>
        </div>
    );
};

export default AboutSection;
