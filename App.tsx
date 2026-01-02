import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Mission from './components/Mission';
import Projects from './components/Projects';
import Events from './components/Events';
import Contact from './components/Contact';
import AdminPortal from './components/AdminPortal';
import Footer from './components/Footer';
import { ClubData, SiteContent, Project, Event, Pillar, Officer, TickerItem } from './types';
import { Plane } from 'lucide-react';
import { ARCHIVE_RAW_BASE_URL } from './constants';

// --- Mock Data ---
const INITIAL_DATA: ClubData = {
    projects: [
        {
            id: '1',
            title: 'High-Altitude Rocketry',
            description: 'Design and construction of a Level 1 certification rocket capable of reaching 3,000 ft agl. Features dual-deployment recovery system.',
            status: 'In Progress',
            imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=2070&auto=format&fit=crop',
            specs: [
                { label: 'Apogee', value: '3,200 ft' },
                { label: 'Motor', value: 'H-Class' },
                { label: 'Recovery', value: 'Dual Deploy' }
            ],
            leadEngineer: 'A. Yeager',
            completionDate: 'Q4 2024'
        },
        {
            id: '2',
            title: 'Autonomous Drone Swarm',
            description: 'Programming a fleet of micro-drones for coordinated flight patterns using Python and open-source flight controllers.',
            status: 'Completed',
            imageUrl: 'https://images.unsplash.com/photo-1506947411487-a56738267384?q=80&w=2070&auto=format&fit=crop',
            specs: [
                { label: 'Count', value: '12 Units' },
                { label: 'Network', value: 'Mesh Wi-Fi' },
                { label: 'Runtime', value: '15 mins' }
            ],
            leadEngineer: 'S. Pilot',
            completionDate: 'Completed'
        },
        {
            id: '3',
            title: 'RC Cessna Trainer',
            description: 'Scratch-build of a fixed-wing trainer aircraft for new pilots to learn aerodynamics and control surfaces.',
            status: 'Concept',
            imageUrl: 'https://images.unsplash.com/photo-1559685323-952403666b6c?q=80&w=2070&auto=format&fit=crop',
            specs: [
                { label: 'Wingspan', value: '1.4m' },
                { label: 'Material', value: 'Balsa/Foam' },
                { label: 'Channels', value: '4 (TAER)' }
            ],
            leadEngineer: 'J. Sky',
            completionDate: 'Q1 2025'
        }
    ],
    officers: [
        { id: '1', name: 'Alex Yeager', role: 'President', email: 'alex.y@lahs.edu' },
        { id: '2', name: 'Sam Pilot', role: 'VP of Engineering', email: 'sam.p@lahs.edu' },
        { id: '3', name: 'Jordan Sky', role: 'Treasurer', email: 'jordan.s@lahs.edu' },
    ],
    events: [
        {
            id: '1',
            title: 'Guest Speaker: NASA Engineer',
            date: '2024-10-15',
            time: '15:30',
            location: 'Room 702',
            description: 'A talk about propulsion systems and internship opportunities.',
            imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
        },
        {
            id: '2',
            title: 'Drone Racing Workshop',
            date: '2024-10-22',
            time: '16:00',
            location: 'Football Field',
            description: 'Hands-on practice with FPV drone piloting.',
            imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2070&auto=format&fit=crop'
        }
    ],
    pillars: [
        {
            id: '1',
            imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
            title: 'Avionics',
            description: 'Development of custom flight computers, telemetry systems, and autonomous control logic for UAVs.'
        },
        {
            id: '2',
            imageUrl: 'https://images.unsplash.com/photo-1559067515-bf7d799b6d42?q=80&w=2070&auto=format&fit=crop',
            title: 'Aerodynamics',
            description: 'Utilizing CFD analysis and wind tunnel testing to optimize airframe efficiency and stability.'
        },
        {
            id: '3',
            imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?q=80&w=2070&auto=format&fit=crop',
            title: 'Crew Training',
            description: 'Mentorship programs pairing senior engineers with new members to teach CAD, soldering, and piloting.'
        }
    ],
    tickerItems: [
        { id: '1', label: 'Current Project', value: 'L1 Rocketry', type: 'wind' },
        { id: '2', label: 'Next Launch', value: 'OCT 25', type: 'zap' },
        { id: '3', label: 'Members', value: '45+ Active', type: 'users' }
    ],
    siteContent: {
        homeHeroTitle: 'We Build Things That Fly',
        homeHeroSubtitle: 'Los Altos High School Aviation Club. Designing drones, rockets, and the next generation of aerospace engineers.',
        missionStatement: 'Bridging the gap between theoretical physics and real-world aerospace engineering through hands-on fabrication and flight testing.',
        contactTitle: 'Clear for Takeoff?',
        contactSubtitle: 'We are looking for students passionate about engineering, design, and flight. No prior experience is required—just curiosity.'
    },
    googleCalendarUrl: 'https://calendar.google.com',
    discordUrl: 'https://discord.gg/example'
};

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

// --- Main Content Wrapper ---
const MainContent: React.FC = () => {
    const [data, setData] = useState<ClubData>(INITIAL_DATA);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isGameMode, setIsGameMode] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${ARCHIVE_RAW_BASE_URL}/metadata.json`);
                if (response.ok) {
                    const remoteData = await response.json();

                    // Deep merge remote data with initial data to prevent missing field crashes
                    setData(prev => ({
                        ...prev,
                        ...remoteData,
                        siteContent: {
                            ...prev.siteContent,
                            ...(remoteData.siteContent || {})
                        },
                        // Ensure arrays exist if remote data is partial
                        projects: remoteData.projects || prev.projects,
                        officers: remoteData.officers || prev.officers,
                        events: remoteData.events || prev.events,
                        pillars: remoteData.pillars || prev.pillars,
                        tickerItems: remoteData.tickerItems || prev.tickerItems
                    }));

                    console.log('Loaded data from Archive Repository');
                } else {
                    console.warn('Failed to fetch metadata from Archive, using initial data');
                }
            } catch (error) {
                console.error('Error fetching metadata:', error);
            } finally {
                setIsDataLoaded(true);
            }
        };
        fetchData();
    }, []);

    const updateData = (newData: Partial<ClubData>) => {
        setData(prev => ({ ...prev, ...newData }));
    };

    const updateSiteContent = (key: keyof SiteContent, value: string) => {
        setData(prev => ({
            ...prev,
            siteContent: {
                ...prev.siteContent,
                [key]: value
            }
        }));
    };

    const updateProject = (id: string, field: keyof Project | 'specs', value: any) => {
        setData(prev => ({
            ...prev,
            projects: prev.projects.map(p => {
                if (p.id !== id) return p;
                return { ...p, [field]: value };
            })
        }));
    };

    const updateEvent = (id: string, field: keyof Event, value: string) => {
        setData(prev => ({
            ...prev,
            events: prev.events.map(e => {
                if (e.id !== id) return e;
                return { ...e, [field]: value };
            })
        }));
    };

    const updatePillar = (id: string, field: keyof Pillar, value: string) => {
        setData(prev => ({
            ...prev,
            pillars: prev.pillars.map(p => {
                if (p.id !== id) return p;
                return { ...p, [field]: value };
            })
        }));
    };

    const updateOfficer = (id: string, field: keyof Officer, value: string) => {
        setData(prev => ({
            ...prev,
            officers: prev.officers.map(o => {
                if (o.id !== id) return o;
                return { ...o, [field]: value };
            })
        }));
    };

    const updateTicker = (id: string, field: keyof TickerItem, value: string) => {
        setData(prev => ({
            ...prev,
            tickerItems: prev.tickerItems.map(t => {
                if (t.id !== id) return t;
                return { ...t, [field]: value };
            })
        }));
    };

    return (
        <>
            <ScrollToTop />
            <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${isGameMode ? 'bg-black text-[#39ff14]' : 'bg-background text-contrast'} selection:bg-primary/20 selection:text-primary-dark`}>
                {!isGameMode && <Navbar isAdmin={isAdmin} isGameMode={isGameMode} />}
                <main className="flex-grow">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Home
                                    data={data}
                                    isAdmin={isAdmin}
                                    onUpdate={updateSiteContent}
                                    onUpdateTicker={updateTicker}
                                    setGameMode={setIsGameMode}
                                />
                            }
                        />
                        <Route
                            path="/mission"
                            element={
                                <Mission
                                    data={data}
                                    isAdmin={isAdmin}
                                    onUpdate={updateSiteContent}
                                    onUpdatePillar={updatePillar}
                                />
                            }
                        />
                        <Route
                            path="/projects"
                            element={
                                <Projects
                                    data={data}
                                    isAdmin={isAdmin}
                                    onUpdateProject={updateProject}
                                />
                            }
                        />
                        <Route
                            path="/events"
                            element={
                                <Events
                                    data={data}
                                    isAdmin={isAdmin}
                                    onUpdateEvent={updateEvent}
                                />
                            }
                        />
                        <Route
                            path="/contact"
                            element={
                                <Contact
                                    data={data}
                                    isAdmin={isAdmin}
                                    onUpdate={updateSiteContent}
                                    onUpdateOfficer={updateOfficer}
                                />
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <AdminPortal
                                    data={data}
                                    updateData={updateData}
                                    isAdmin={isAdmin}
                                    setIsAdmin={setIsAdmin}
                                />
                            }
                        />
                    </Routes>
                </main>
                {!isGameMode && <Footer />}
            </div>
        </>
    );
};

// --- App Root ---
const App: React.FC = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500); // Quick but enough to see animation
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
                <div className="relative">
                    {/* Runway/Pulse Effect */}
                    <Plane className="w-12 h-12 text-primary animate-pulse-fast mb-4 relative z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/10 rounded-full animate-ping"></div>
                </div>
                <div className="flex gap-2 mt-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <p className="mt-4 font-mono text-xs tracking-widest text-secondary uppercase">Pre-Flight Check</p>
            </div>
        );
    }

    return (
        <Router>
            <MainContent />
        </Router>
    );
};

export default App;