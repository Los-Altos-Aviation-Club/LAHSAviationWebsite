import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Plane, Compass, LayoutDashboard } from 'lucide-react';
import { ClubData, SiteContent } from '../types';
import EditableText from './EditableText';

interface NavbarProps {
    data: ClubData;
    onUpdate: (key: keyof SiteContent, value: string) => void;
    isAdmin: boolean;
    isGameMode?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ data, onUpdate, isAdmin, isGameMode = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            // Calculate scroll percentage
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scroll = windowHeight > 0 ? totalScroll / windowHeight : 0;
            setScrollProgress(Number(scroll));
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Overview', path: '/' },
        { name: 'Our Mission', path: '/mission' },
        { name: 'Projects', path: '/projects' },
        { name: 'Meetings', path: '/events' },
        { name: 'Contact', path: '/contact' },
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    const handleNavClick = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    // Styles based on Game Mode
    // Note: Using Hex with Alpha (#39ff144d) instead of rgba(57,255,20,0.3) to avoid commas in class string
    const containerClass = isGameMode
        ? 'bg-black border-b border-[#39ff14] shadow-[0_0_15px_#39ff144d]'
        : 'bg-white border-b-2 border-primary/20 shadow-sm';

    const textClass = isGameMode ? 'text-[#39ff14]' : 'text-secondary hover:text-primary';
    const activeTextClass = isGameMode ? 'text-[#39ff14] font-bold shadow-[0_0_5px_#39ff14]' : 'text-primary';
    // Updated logoClass to use text-primary (sky blue) for normal mode
    const logoClass = isGameMode ? 'text-[#39ff14]' : 'text-primary';
    const iconClass = isGameMode ? 'text-[#39ff14]' : 'text-primary';
    // Updated subTextClass to match the blue theme in normal mode
    const subTextClass = isGameMode ? 'text-[#39ff14]/70' : 'text-primary/70';
    // Use hex alpha (#0071E380) instead of rgba(0,113,227,0.5) to avoid commas in arbitrary value
    const progressBarClass = isGameMode ? 'bg-[#39ff14] shadow-[0_0_10px_#39ff14]' : 'bg-primary shadow-[0_0_10px_#0071E380]';

    return (
        <nav className={`fixed top-0 w-full z-[100] transition-colors duration-300 ${containerClass}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <button onClick={() => handleNavClick('/')} className="flex items-center gap-2 group z-50 relative">
                        <div className={`absolute inset-0 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isGameMode ? 'bg-[#39ff14]/20' : 'bg-primary/20'}`}></div>
                        <Plane className={`h-5 w-5 transform group-hover:-rotate-45 transition-transform duration-500 ease-out relative z-10 ${iconClass}`} />
                        <span className={`font-bold text-lg tracking-tight relative z-10 ${logoClass}`}>
                            <EditableText
                                value={data.siteContent.navbarTitle}
                                onSave={(val) => onUpdate('navbarTitle', val)}
                                isAdmin={isAdmin}
                                label="Navbar Title"
                            /> <span className={`${subTextClass} font-medium`}>
                                <EditableText
                                    value={data.siteContent.navbarSubtitle}
                                    onSave={(val) => onUpdate('navbarSubtitle', val)}
                                    isAdmin={isAdmin}
                                    label="Navbar Subtitle"
                                />
                            </span>
                        </span>
                    </button>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => handleNavClick(link.path)}
                                className={`px-4 py-2 text-sm transition-all duration-200 font-medium relative group ${isActive(link.path) ? activeTextClass : textClass
                                    } ${isGameMode ? 'font-mono uppercase tracking-wider' : ''}`}
                            >
                                {link.name}
                                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${isGameMode ? 'bg-[#39ff14]' : 'bg-primary'} ${isActive(link.path) ? 'w-1/2' : 'w-0 group-hover:w-1/2'
                                    }`}></span>
                            </button>
                        ))}

                        {isAdmin ? (
                            <button
                                onClick={() => handleNavClick('/admin')}
                                className={`ml-4 px-5 py-2 text-xs font-semibold rounded-full transition-colors flex items-center gap-2 shadow-lg ${isGameMode ? 'bg-[#39ff14] text-black hover:bg-[#32cd11]' : 'bg-primary text-white hover:bg-primary-dark shadow-blue-500/20'}`}
                            >
                                <LayoutDashboard className="w-3 h-3" /> {isGameMode ? 'CMD' : 'Dashboard'}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleNavClick('/admin')}
                                className={`ml-4 px-4 py-2 text-xs font-semibold border rounded-full transition-all flex items-center gap-2 ${isGameMode
                                    ? 'text-[#39ff14] border-[#39ff14] hover:bg-[#39ff14]/10'
                                    : 'text-secondary border-secondary/30 hover:border-primary hover:text-primary'
                                    }`}
                            >
                                {isGameMode ? 'ADMIN_ACCESS' : 'Admin Access'}
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden z-50">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`focus:outline-none p-2 ${isGameMode ? 'text-[#39ff14]' : 'text-contrast'}`}
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Flight Progress Bar */}
            <div className={`absolute bottom-0 left-0 h-[2px] w-full ${isGameMode ? 'bg-[#39ff14]/20' : 'bg-primary/20'}`}>
                <div
                    className={`h-full transition-all duration-150 ease-out ${progressBarClass}`}
                    style={{ width: `${scrollProgress * 100}%` }}
                />
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 z-40 flex flex-col items-center justify-center space-y-8 transition-all duration-500 md:hidden ${isGameMode ? 'bg-black' : 'bg-white'
                } ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
                }`}>
                <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-50 pointer-events-none"></div>
                {navLinks.map((link, idx) => (
                    <button
                        key={link.name}
                        onClick={() => handleNavClick(link.path)}
                        className={`text-3xl font-light transition-colors transform hover:scale-110 duration-200 ${isGameMode ? 'text-[#39ff14] font-mono' : 'text-contrast hover:text-primary'}`}
                        style={{ transitionDelay: `${idx * 50}ms` }}
                    >
                        {link.name}
                    </button>
                ))}
                {isAdmin ? (
                    <button
                        onClick={() => handleNavClick('/admin')}
                        className={`text-lg mt-8 font-mono border px-6 py-2 rounded-lg flex items-center gap-2 ${isGameMode
                            ? 'text-[#39ff14] border-[#39ff14] hover:bg-[#39ff14]/10'
                            : 'text-primary border-primary'
                            }`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> DASHBOARD
                    </button>
                ) : (
                    <button
                        onClick={() => handleNavClick('/admin')}
                        className={`text-lg mt-8 font-mono border px-6 py-2 rounded-lg flex items-center gap-2 ${isGameMode
                            ? 'text-[#39ff14] border-[#39ff14] hover:bg-[#39ff14]/10'
                            : 'text-primary border-primary'
                            }`}
                    >
                        ADMIN ACCESS
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;