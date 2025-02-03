import React from 'react';
import Navbar from './Navbar';
import hero from '../assets/hero.webp';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 text-gray-900 font-[Poppins]">
            <Navbar />
            <div className="container mx-auto px-6 lg:px-20 flex flex-col lg:flex-row items-center justify-between mt-16">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="lg:w-1/2 text-center lg:text-left space-y-6"
                >
                    <h1 className="text-5xl font-semibold leading-tight bg-gradient-to-r text-black to-purple-600 text-transparent bg-clip-text">
                        The Future of Video Communication
                    </h1>
                    <p className="text-lg text-gray-700 leading-relaxed max-w-lg">
                        Experience seamless, high-quality video calls with
                        cutting-edge technology and security.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: '#2563eb' }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-500 text-white font-semibold rounded-full shadow-lg px-8 py-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    >
                        <Link to={'/home'}>Get Started</Link>
                    </motion.button>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="lg:w-1/2 flex justify-center mt-6 lg:mt-0"
                >
                    <img
                        src={hero}
                        alt="hero"
                        className="w-full max-w-md lg:max-w-lg rounded-lg shadow-2xl hover:scale-105 transition-transform duration-300"
                    />
                </motion.div>
            </div>

            {/* Features Section */}
            <div className="container mx-auto px-6 lg:px-20 mt-24">
                <h2 className="text-center text-4xl font-extrabold bg-gradient-to-r text-blue-500 bg-clip-text">
                    Why Choose Us?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {[
                        'Easy to Use',
                        'End-to-End Encryption',
                        'Ultra-Low Latency',
                        'HD Quality',
                        'Seamless Screen Sharing',
                        'Works on All Devices',
                    ].map((feature, index) => (
                        <motion.div
                            key={feature}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-200"
                        >
                            <h3 className="text-2xl font-semibold text-gray-800">
                                {feature}
                            </h3>
                            <p className="mt-4 text-gray-600">
                                Experience {feature} like never before with our
                                top-tier technology.
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="container mx-auto px-6 lg:px-20 mt-24 text-center">
                <h2 className="text-4xl font-extrabold text-blue-500">
                    What Our Users Say
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                    {[
                        'Best video app ever!',
                        'Super smooth and secure',
                        'Love the HD quality!',
                        'Game-changer for remote work',
                        'Feels like being in the same room',
                        'No lag, even on weak connections',
                    ].map((testimonial, index) => (
                        <motion.div
                            key={testimonial}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl border-l-4 cursor-pointer hover:-translate-y-2 border-blue-500 transform hover:scale-105 transition-all duration-300"
                        >
                            <p className="mt-4 text-gray-600 italic">
                                "{testimonial}"
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Call to Action */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-blue-500 w-full text-white py-16 mt-24 text-center shadow-xl rounded-t-2xl"
            >
                <h2 className="text-4xl font-extrabold">
                    Ready to Get Started?
                </h2>
                <p className="mt-4 text-lg max-w-2xl mx-auto">
                    Join millions of users today and elevate your video
                    conferencing experience with unparalleled quality and
                    security.
                </p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 bg-white text-blue-500 font-semibold rounded-full shadow-lg px-8 py-4 transition-all duration-300 hover:bg-gray-200"
                >
                    <Link to={'/home'}>Sign Up Now</Link>
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Landing;
