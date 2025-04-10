import React from 'react';
import { IMG_URL } from "../utils/baseUrl";

const Front = ({ data }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-primary-dark dark:to-primary-dark py-12 px-4 sm:px-6 lg:px-8 grid place-content-center">
            <div className="max-w-2xl mx-auto">
                {/* Profile Section */}
                <div className="bg-white dark:bg-primary/50 rounded-2xl shadow-lg p-8">
                    <div className="flex flex-col  items-center gap-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/40 to-primary dark:from-primary/30 dark:to-primary overflow-hidden border-4 border-white dark:border-primary-light shadow-lg">
                                {data?.photo && data?.photo != "null" ? (
                                    <img 
                                        src={`${IMG_URL}${data?.photo.replace(/\\/g, "/")}`} 
                                        alt="Profile" 
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full text-white  text-4xl font-bold capitalize grid place-content-center">
                                        {data?.userName && data?.userName.includes(' ') 
                                            ? data?.userName.split(' ')[0][0] + data?.userName.split(' ')[1][0] 
                                            : data?.userName[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-primary-dark dark:text-white mb-2">Welcome back!</h1>
                            <p className="text-2xl font-semibold text-primary dark:text-primary">{data?.userName}</p>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">{data?.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Front;