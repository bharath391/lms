import React from 'react';
const ProfileSettings = ({ user }) => {
    // TODO: Fetch this data
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
                <div className="flex items-center space-x-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold">{user.name}</h2>
                        <p className="text-gray-600">{user.email}</p>
                        <button className="mt-2 text-sm bg-blue-100 text-blue-700 py-1 px-3 rounded-full font-medium hover:bg-blue-200">
                            Change Avatar
                        </button>
                    </div>
                </div>
                
                <form className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" defaultValue={user.name} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" defaultValue={user.email} className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Change Password</label>
                        <input type="password" placeholder="New Password" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input type="password" placeholder="Confirm New Password" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;