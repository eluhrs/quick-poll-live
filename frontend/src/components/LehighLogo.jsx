import React from 'react';

const LehighLogo = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" className={className}>
        <rect width="100%" height="100%" fill="none" />
        {/* Approximate representation for MVP - text based logo if SVG path unavailable */}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="serif" fontWeight="bold" fontSize="40" fill="#231f20">LEHIGH</text>
        <text x="50%" y="80%" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#502d0eaa">UNIVERSITY</text>
    </svg>
);

export default LehighLogo;
