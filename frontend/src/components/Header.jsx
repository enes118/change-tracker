import React from 'react';

export default function Header({ title }) {
  return (
    <header className="cms-header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
      </div>
    </header>
  );
}
