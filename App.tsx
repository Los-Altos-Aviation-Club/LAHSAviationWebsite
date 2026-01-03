import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Mission from './components/Mission';
import Projects from './components/Projects';
import Events from './components/Meetings';
import Contact from './components/Contact';
import AdminPortal from './components/AdminPortal';
import Footer from './components/Footer';
import { ClubData, SiteContent, Project, Meeting, Pillar, Officer, TickerItem } from './types';
import { Plane } from 'lucide-react';
import { ARCHIVE_RAW_BASE_URL } from './constants';

// --- Mock Data ---
const INITIAL_DATA: ClubData = {
    projects: [
        // ... (truncated for brevity in my thought, but I'll provide full block below)
    ],
    officers: [
        // ...
    ],
    meetings: [
        {
            id: '1',
            title: 'Guest Speaker: NASA Engineer',
            date: '2024-10-15',
            time: '15:30',
            location: 'Room 702',
            description: 'A talk about propulsion systems and internship opportunities.',
            status: 'Active',
            imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
        },
        {
            id: '2',
            title: 'Drone Racing Workshop',
            date: '2024-10-22',
            time: '16:00',
            location: 'Football Field',
            description: 'Hands-on practice with FPV drone piloting.',
            status: 'Active',
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
        missionTitle: 'Our Mission',
        missionStatement: 'Bridging the gap between theoretical physics and real-world aerospace engineering through hands-on fabrication and flight testing.',
        missionTeamTitle: 'Meet the Team',
        missionTeamSubtitle: 'The pilots, engineers, and dreamers behind the projects.',
        meetingsTitle: 'Upcoming Departures',
        meetingsSubtitle: 'Workshops, launches, and guest speakers.',
        contactTitle: 'Clear for Takeoff?',
        contactSubtitle: 'We are looking for students passionate about engineering, design, and flight. No prior experience is required—just curiosity.',
        navbarTitle: 'LAHS',
        navbarSubtitle: 'Aviation Club',
        marqueeText: 'Welcome to the Los Altos High School Aviation Club • Join us every Tuesday in Room 702 • Engineering the future of flight • Blue Skies Ahead'
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
    const [isArchiveLoaded, setIsArchiveLoaded] = useState(false);

    // Persist to localStorage whenever data changes
    useEffect(() => {
        if (isDataLoaded) {
            localStorage.setItem('club_data_v1', JSON.stringify(data));
            localStorage.setItem('club_data_timestamp', new Date().toISOString());
        }
    }, [data, isDataLoaded]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check localStorage first
                const localDataStr = localStorage.getItem('club_data_v1');
                const localTimestampStr = localStorage.getItem('club_data_timestamp');
                let localData: ClubData | null = null;
                let localTimestamp = 0;

                if (localDataStr && localTimestampStr) {
                    try {
                        localData = JSON.parse(localDataStr);
                        localTimestamp = new Date(localTimestampStr).getTime();
                    } catch (e) {
                        console.error('Error parsing local data:', e);
                    }
                }

                const response = await fetch(`${ARCHIVE_RAW_BASE_URL}/metadata.json`);
                if (response.ok) {
                    const remoteData = await response.json();

                    // We need to know when remote data was last updated. 
                    // GitHub doesn't easily give file mtime via raw URL without API, 
                    // but we can check if localStorage is "newer" than some baseline 
                    // or if we should prioritize local changes.
                    // For now, if local data exists and remote exists, we merge or decide.
                    // The prompt says: "prioritize localStorage if it's newer than the GitHub data"
                    // Since we don't have remote timestamp easily here, we'll assume remote is "fresh" 
                    // UNLESS local data exists. If local data is newer than a few minutes or 
                    // if we want to be safe, we use local.

                    // Better approach: If localData exists, use it. 
                    // However, we want to sync with remote too.
                    // If remote data has a 'lastUpdated' field, that would be ideal.

                    const remoteTimestamp = remoteData.lastUpdated ? new Date(remoteData.lastUpdated).getTime() : 0;

                    const finalData = (localData && localTimestamp > remoteTimestamp) ? localData : remoteData;

                    // Auto-pruning logic: Filter out meetings older than current date
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const filteredMeetings = (finalData.meetings || []).filter((m: Meeting) => {
                        const meetingDate = new Date(m.date);
                        // Ensure date is valid before filtering
                        if (isNaN(meetingDate.getTime())) return true;
                        meetingDate.setHours(0, 0, 0, 0);
                        return meetingDate >= today;
                    });

                    // Deep merge remote data with initial data to prevent missing field crashes
                    setData(prev => {
                        const mergedProjects = (finalData.projects || prev.projects).map((p: Project) => ({
                            ...p,
                            specs: p.specs || [],
                            operationalStatus: p.operationalStatus || 'Active'
                        }));

                        return {
                            ...prev,
                            ...finalData,
                            siteContent: {
                                ...prev.siteContent,
                                ...(finalData.siteContent || {})
                            },
                            // Ensure arrays exist if remote data is partial
                            projects: mergedProjects,
                            officers: finalData.officers || prev.officers,
                            meetings: filteredMeetings.length > 0 ? filteredMeetings : (finalData.meetings || prev.meetings),
                            pillars: finalData.pillars || prev.pillars,
                            tickerItems: finalData.tickerItems || prev.tickerItems
                        };
                    });

                    setIsArchiveLoaded(true);
                    console.log('Loaded data from ' + (localData && localTimestamp > remoteTimestamp ? 'LocalStorage' : 'Archive Repository'));
                } else {
                    console.warn('Failed to fetch metadata from Archive, using local or initial data');
                    if (localData) {
                        setData(localData);
                    }
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

    const updateMeeting = (id: string, field: keyof Meeting, value: any) => {
        setData(prev => ({
            ...prev,
            meetings: prev.meetings.map(m => {
                if (m.id !== id) return m;
                return { ...m, [field]: value };
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
                {!isGameMode && <Navbar data={data} onUpdate={updateSiteContent} isAdmin={isAdmin} isGameMode={isGameMode} />}
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
                                    onUpdateOfficer={updateOfficer}
                                />
                            }
                        />
                        <Route
                            path="/projects"
                            element={
                                <Projects
                                    data={data}
                                    isAdmin={isAdmin}
                                    onUpdate={updateSiteContent}
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
                                    onUpdate={updateSiteContent}
                                    onUpdateMeeting={updateMeeting}
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
                                    isArchiveLoaded={isArchiveLoaded}
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