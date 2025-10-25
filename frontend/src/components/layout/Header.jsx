import React from 'react';
import { Bell, Menu } from 'lucide-react';
const Header = ({ user, onToggleSidebar }) => {
    return (
        <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-200">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Hamburger Menu for Mobile */}
                    <button
                        onClick={onToggleSidebar}
                        className="text-gray-600 hover:text-gray-900 lg:hidden"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Spacer on desktop, search on mobile (optional) */}
                    <div className="lg:hidden"></div>
                    <div className="hidden lg:block"></div> {/* Spacer for desktop */}
                    
                    {/* Right-side icons and profile */}
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100">
                            <Bell size={20} />
                        </button>
                        <div className="flex items-center space-x-2">
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;