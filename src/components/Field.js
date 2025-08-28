// src/components/Field.js
import React from 'react';

export default function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
      {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
    </label>
  );
}
