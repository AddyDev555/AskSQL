"use client";
import React from 'react';
import { Poppins } from 'next/font/google';
import Switch from './Switch';
import { useTheme } from '@/app/context/ThemeContext';

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '700'],
});

export default function Header() {
    const { theme, handleToggle } = useTheme();

    const onSwitchChange = () => {
        handleToggle(theme === "light" ? "dark" : "light");
    };

    return (
        <div className="flex items-center px-7 py-5 space-x-1.5 border-b border-indigo-400">
            <h1 className={`${poppins.className} text-xl md:text-2xl font-bold`}>
                Ask<span className="text-indigo-400">SQL</span>
            </h1>
            <div className="ml-auto">
                <Switch checked={theme === "dark"} onChange={onSwitchChange} />
            </div>
        </div>
    );
}
