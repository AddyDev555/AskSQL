"use client";
import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function Switch() {
    const [theme, setTheme] = useState("light");

    // Apply the theme to CSS variables
    const applyTheme = (mode) => {
        const root = document.documentElement;
        if (mode === "dark") {
            root.style.setProperty("--background", "#222831");
            root.style.setProperty("--foreground", "#ededed");
        } else {
            root.style.setProperty("--background", "#FDFBEE");
            root.style.setProperty("--foreground", "#171717");
        }
    };

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        applyTheme(savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full cursor-pointer border border-gray-400 bg-gray-200 hover:scale-110 transition-transform"
            style={{
                backgroundColor: theme === "dark" ? "#1e1f20" : "#e5e7eb",
                borderColor: theme === "dark" ? "#4b5563" : "#9ca3af",
            }}
        >
            {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-500" />
            ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
            )}
        </button>
    );
}
