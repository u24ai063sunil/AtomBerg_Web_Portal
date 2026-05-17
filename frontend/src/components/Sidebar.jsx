import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Target, 
    CheckSquare, 
    BarChart3, 
    Settings, 
    LogOut,
    Users,
    FileText,
    Sun,
    Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Sidebar.css';

import Avatar from './Avatar';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/dashboard', end: true },
        { name: 'My Goal Sheet', icon: <Target size={20} />, path: '/dashboard/goals' },
        { name: 'Quarterly Check-ins', icon: <CheckSquare size={20} />, path: '/dashboard/check-ins' },
    ];

    const userRole = user?.role?.toUpperCase() || 'EMPLOYEE';

    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
        navItems.push({ name: 'Team Review', icon: <Users size={20} />, path: '/dashboard/team' });
    }

    if (userRole === 'ADMIN') {
        navItems.push({ name: 'Admin Console', icon: <Settings size={20} />, path: '/dashboard/admin' });
        navItems.push({ name: 'Reports', icon: <BarChart3 size={20} />, path: '/dashboard/reports' });
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src="/atomberg-logo.png" alt="Atomberg" className="sidebar-logo" />
                <span className="brand-name">AtomQuest</span>
                <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>

            <Link to="/dashboard/profile" className="user-profile-summary">
                <Avatar src={user?.picture} name={user?.name} size={44} />
                <div className="user-info">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-role">{user?.role}</span>
                </div>
            </Link>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink 
                        key={item.path} 
                        to={item.path} 
                        end={item.end}
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={logout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
