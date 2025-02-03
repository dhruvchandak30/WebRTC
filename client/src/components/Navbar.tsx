import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    return (
        <nav className="bg-white shadow-md p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="text-2xl font-bold text-gray-800">
                    Stream Meet
                </div>
                <ul className="hidden md:flex space-x-6 text-gray-600 font-medium">
                    <li className="hover:text-blue-500 cursor-pointer">Home</li>
                    <li className="hover:text-blue-500 cursor-pointer">
                        Features
                    </li>
                    <li className="hover:text-blue-500 cursor-pointer">
                        Downloads
                    </li>
                    <li className="hover:text-blue-500 cursor-pointer">
                        Pricings
                    </li>
                </ul>
                <button className="bg-blue-500 text-white font-semibold rounded-lg shadow-md px-4 py-2 hover:bg-blue-700">
                    <Link to={'/home'}>Get Started</Link>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
