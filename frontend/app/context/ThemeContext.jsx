"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        applyTheme(savedTheme);
    }, []);

    const applyTheme = (mode) => {
        const root = document.documentElement;
        if (mode === "dark") {
            root.style.setProperty("--background", "#222831");
            root.style.setProperty("--foreground", "#ededed");
        } else {
            root.style.setProperty("--background", "#F2F2F2");
            root.style.setProperty("--foreground", "#171717");
        }
    };

    const handleToggle = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, handleToggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
