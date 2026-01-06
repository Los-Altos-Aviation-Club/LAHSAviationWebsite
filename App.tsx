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
import { ClubData, SiteContent, Project, Meeting, Pillar, Officer, TickerItem, MissionCard } from './types';
import { Plane } from 'lucide-react';
import { MAIN_RAW_BASE_URL } from './constants';
import metadataImport from './metadata.json';

// --- Mock Data ---
const INITIAL_DATA: ClubData = metadataImport as unknown as ClubData;

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

// --- Helper: Secure HTTPS Upgrade ---
const secureUrl = (url: string): string => {
    if (typeof url !== 'string') return url;
    return url.replace(/^http:\/\//i, 'https://');
};

const sanitizeClubData = (data: ClubData): ClubData => {
    return {
        ...data,
        projects: (data.projects || []).map(p => ({
            ...p,
            imageUrl: secureUrl(p.imageUrl)
        })),
        officers: (data.officers || []).map(o => ({
            ...o,
            imageUrl: secureUrl(o.imageUrl)
        })),
        meetings: (data.meetings || []).map(m => ({
            ...m,
            imageUrl: secureUrl(m.imageUrl)
        })),
        pillars: (data.pillars || []).map(p => ({
            ...p,
            imageUrl: secureUrl(p.imageUrl)
        })),
        missionCards: (data.missionCards || []).map(c => ({
            ...c,
            imageUrl: secureUrl(c.imageUrl || '')
        })),
        googleCalendarUrl: secureUrl(data.googleCalendarUrl || ''),
        discordUrl: secureUrl(data.discordUrl || '')
    };
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

                // Initial data from metadata.json (now via INITIAL_DATA)
                const metaTimestamp = INITIAL_DATA.lastUpdated ? new Date(INITIAL_DATA.lastUpdated).getTime() : 0;

                let remoteData: ClubData | null = null;
                let remoteTimestamp = 0;

                try {
                    const response = await fetch(`${MAIN_RAW_BASE_URL}/metadata.json`);
                    if (response.ok) {
                        remoteData = await response.json();
                        if (remoteData) {
                            remoteData = sanitizeClubData(remoteData);
                            remoteTimestamp = remoteData.lastUpdated ? new Date(remoteData.lastUpdated).getTime() : 0;
                        }
                    }
                } catch (e) {
                    console.warn('Failed to fetch from Main Repo, using local or initial data');
                }

                // Prioritization: Most recent of (LocalStorage, Main Repo, metadata.json)
                let finalData: ClubData = INITIAL_DATA;
                let finalTimestamp = metaTimestamp;
                let source = 'metadata.json';

                if (remoteData && remoteTimestamp > finalTimestamp) {
                    finalData = remoteData;
                    finalTimestamp = remoteTimestamp;
                    source = 'Main Repo';
                }

                if (localData && localTimestamp > finalTimestamp) {
                    finalData = localData;
                    finalTimestamp = localTimestamp;
                    source = 'LocalStorage';
                }

                // Auto-pruning logic: Filter out meetings older than current date
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const filteredMeetings = (finalData.meetings || []).filter((m: Meeting) => {
                    const meetingDate = new Date(m.date);
                    if (isNaN(meetingDate.getTime())) return true;
                    meetingDate.setHours(0, 0, 0, 0);
                    return meetingDate >= today;
                });

                // Deep merge with initial data to prevent missing field crashes
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
                        projects: mergedProjects,
                        officers: finalData.officers || prev.officers,
                        meetings: filteredMeetings.length > 0 ? filteredMeetings : (finalData.meetings || prev.meetings),
                        pillars: finalData.pillars || prev.pillars,
                        tickerItems: finalData.tickerItems || prev.tickerItems,
                        missionCards: finalData.missionCards || prev.missionCards || []
                    };
                });

                if (source === 'Main Repo') {
                    setIsArchiveLoaded(true);
                }
                console.log(`Loaded data from ${source}`);

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

    const updateMissionCard = (id: string, field: keyof MissionCard, value: string) => {
        setData(prev => ({
            ...prev,
            missionCards: (prev.missionCards || []).map(b => {
                if (b.id !== id) return b;
                return { ...b, [field]: value };
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
                                    onUpdateMissionCard={updateMissionCard}
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
