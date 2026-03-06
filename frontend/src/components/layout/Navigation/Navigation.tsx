/**
 * Navigation Component
 * Top navigation bar for the application.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const NAV_ITEMS = [
  { path: '/', label: 'Inicio', exact: true },
  { path: '/library', label: 'Biblioteca', exact: false },
  { path: '/upload', label: 'Subir', exact: false },
  { path: '/tuner', label: 'Afinador', exact: false },
  { path: '/practice/write', label: 'Escribir', exact: false },
];

export const Navigation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-layout">
      <nav className="navigation">
        <div className="navigation__brand">
          <NavLink to="/" className="navigation__logo">
            Vibe
          </NavLink>
        </div>
        <div className="navigation__links">
          {NAV_ITEMS.map(({ path, label, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) =>
                `navigation__link ${isActive ? 'navigation__link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="app-layout__content">
        {children}
      </div>
    </div>
  );
};
