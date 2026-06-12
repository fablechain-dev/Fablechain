import React, { useState, useEffect } from 'react';

const THEME_KEY = 'openchain_theme';

// Define CSS variables for light and dark themes
const lightTheme = {
  '--bg-color': '#fff',
  '--text-color': '#333',
  '--primary-color': '#007bff',
  '--secondary-color': '#6c757d',
};

const darkTheme = {
  '--bg-color': '#333',
  '--text-color': '#f1f1f1',
  '--primary-color': '#007bff',
  '--secondary-color': '#6c757d',
};

// Function to toggle between light and dark themes
export const toggleTheme = () => {
  const currentTheme = localStorage.getItem(THEME_KEY) || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, newTheme);
  Object.entries(newTheme === 'light' ? lightTheme : darkTheme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};

// Theme toggle component
export const ThemeToggle = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem(THEME_KEY) || 'light'
  );

  useEffect(() => {
    toggleTheme();
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
};