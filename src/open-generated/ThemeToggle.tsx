import React, { useState, useEffect } from 'react';
import { toggleTheme } from './theme';

const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load user's preferred theme from local storage
    const storedTheme = localStorage.getItem('openchain_theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      toggleTheme();
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    toggleTheme();
  };

  return (
    <div className={`theme-toggle ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <button onClick={handleToggleTheme}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </div>
  );
};

export default ThemeToggle;