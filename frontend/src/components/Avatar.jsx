import React from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Avatar = ({ src, name, size = 40, className = "" }) => {
    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    };

    const style = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size / 2.5}px`,
        fontWeight: '700',
        color: 'white',
        backgroundColor: name ? stringToColor(name) : 'var(--primary)',
        flexShrink: 0,
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.1)'
    };

    if (src) {
        // Check if src is relative path and append API URL if needed
        const fullSrc = src.startsWith('http') ? src : `${API_URL}${src}`;
        return (
            <img 
                src={fullSrc} 
                alt={name} 
                style={{ ...style, objectFit: 'cover' }} 
                className={className} 
            />
        );
    }

    return (
        <div style={style} className={className}>
            {getInitials(name)}
        </div>
    );
};

export default Avatar;
