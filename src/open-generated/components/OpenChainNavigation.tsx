import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const NavigationContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1rem;
  background-color: #0d1117;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const NavLinks = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.3s ease-in-out;

  li {
    margin-right: 1.5rem;
    font-size: 1.4rem;
    padding: 0.75rem;

    a {
      color: #fff;
      text-decoration: none;
    }

    &:hover {
      background-color: #2d333b;
    }
  }

  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
    flex-direction: column;
    position: absolute;
    top: 5rem;
    left: 0;
    right: 0;
    background-color: #0d1117;
    padding: 1rem;
    z-index: 1;

    li {
      margin-right: 0;
      margin-bottom: 1rem;
    }
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background-color: transparent;
  border: none;
  color: #fff;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 0.75rem;
  width: 3.5rem;
  height: 3.5rem;
  animation: ${({ isOpen }) => (isOpen ? fadeIn : fadeOut)} 0.3s ease-in-out;

  @media (max-width: 768px) {
    display: block;
  }
`;

const OpenChainNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 0) {
        setIsOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleNavigation = () => {
    setIsOpen(!isOpen);
  };

  return (
    <NavigationContainer>
      <div>
        <a href="/">OpenChain</a>
      </div>
      <HamburgerButton onClick={toggleNavigation} isOpen={isOpen}>
        {isOpen ? 'X' : '☰'}
      </HamburgerButton>
      <NavLinks isOpen={isOpen}>
        <li><a href="/explorer">Explorer</a></li>
        <li><a href="/contracts">Contracts</a></li>
        <li><a href="/wallet">Wallet</a></li>
        <li><a href="/governance">Governance</a></li>
      </NavLinks>
    </NavigationContainer>
  );
};

export default OpenChainNavigation;