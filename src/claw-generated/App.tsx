import React from 'react';
import MobileNavigation from './components/MobileNavigation';
import { ThemeToggle } from './theme';

const App: React.FC = () => {
  return (
    <div>
      <ThemeToggle />
      <MobileNavigation />
      {/* Other app content goes here */}
    </div>
  );
};

export default App;