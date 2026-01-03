import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClubData, SiteContent, TickerItem } from '../types';
import { ArrowRight, Wind, Zap, Users, Plane, Wrench, Navigation, Layout } from 'lucide-react';
import EditableText from './EditableText';

interface HomeProps {
    data: ClubData;
    isAdmin: boolean;
    onUpdate: (key: keyof SiteContent, value: string) => void;
    onUpdateTicker: (id: string, field: keyof TickerItem, value: string) => void;
    setGameMode: (val: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ data, isAdmin, onUpdate, onUpdateTicker, setGameMode }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'wind': return <Wind className="w-3 h-3 text-primary" />;
            case 'zap': return <Zap className="w-3 h-3 text-yellow-400" />;
            case 'users': return <Users className="w-3 h-3 text-green-400" />;
            default: return <Wind className="w-3 h-3" />;
        }
    };

    return (
        <div className="w-full bg-background text-contrast overflow-x-hidden relative min-h-screen">

            {/* HERO SECTION */}
            <section
                id="home"
                className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20 overflow-hidden transition-all duration-1000"
            >

                {/* Interactive Background Elements (Blobs) - Z Index -10 */}
                <div
                    className="absolute top-[20%] left-[20%] w-72 h-72 bg-blue-100/50 rounded-full blur-[80px] -z-10 transition-transform duration-100 ease-out"
                    style={{ transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px)` }}
                ></div>
                <div
                    className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-sky-50/80 rounded-full blur-[100px] -z-10 transition-transform duration-100 ease-out"
                    style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
                ></div>

                {/* Main Content - Z Index 10 */}
                <div className="relative z-10 max-w-5xl mx-auto space-y-8 fade-in">
                    <div className="text-6xl md:text-8xl font-bold tracking-tighter leading-none pb-4">
                        <EditableText
                            value={data.siteContent.homeHeroTitle || 'We Build Things That Fly'}
                            onSave={(val) => onUpdate('homeHeroTitle', val)}
                            isAdmin={isAdmin}
                            label="Hero Title"
                            className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-sky-400 pb-2 inline-block !text-primary"
                        />
                        <div className="h-4"></div> {/* Spacer */}
                        <div className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-400 to-sky-300 relative text-5xl md:text-7xl">
                            <button
                                onContextMenu={(e) => {
                                    if (isAdmin) {
                                        e.preventDefault();
                                        setGameMode(true);
                                    }
                                }}
                                className="cursor-default"
                            >
                                . . .
                            </button>
                        </div>
                    </div>

                    <div className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto font-light leading-relaxed">
                        <EditableText
                            value={data.siteContent.homeHeroSubtitle || 'Los Altos High School Aviation Club.'}
                            onSave={(val) => onUpdate('homeHeroSubtitle', val)}
                            isAdmin={isAdmin}
                            label="Hero Subtitle"
                            multiline
                        />
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row gap-5 justify-center items-center">
                        <Link to="/projects" className="group relative px-8 py-3.5 bg-contrast text-white font-medium rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all">
                            <span className="relative z-10 flex items-center gap-2">Projects <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                            <div className="absolute inset-0 bg-primary transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        </Link>
                        <Link to="/mission" className="px-8 py-3.5 bg-white text-contrast border border-gray-200 font-medium rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2">
                            Our Mission
                        </Link>
                    </div>
                </div>
            </section>

            {/* STATIC FEATURE BOXES SECTION */}
            <section className="py-24 bg-white relative z-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Static Box 1 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Plane className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-contrast">Design</h3>
                            <p className="text-secondary leading-relaxed">
                                Learn the principles of aeronautics and use CAD software to design your own airframes and systems.
                            </p>
                        </div>
                        {/* Static Box 2 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Wrench className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-contrast">Build</h3>
                            <p className="text-secondary leading-relaxed">
                                Get hands-on experience with composite materials, electronics, and precision mechanical assembly.
                            </p>
                        </div>
                        {/* Static Box 3 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Navigation className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-contrast">Fly</h3>
                            <p className="text-secondary leading-relaxed">
                                Take your creations to the skies and analyze real-time flight data to improve performance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* INFINITE TICKER */}
            <div className="w-full bg-contrast py-3 overflow-hidden border-y border-white/10 relative z-20">
                <div className="flex animate-ticker whitespace-nowrap hover:[animation-play-state:paused]">
                    {[...Array(4)].map((_, repeatIdx) => (
                        <div key={repeatIdx} className="flex items-center">
                            <span className="text-white/80 font-mono text-sm uppercase tracking-widest flex items-center gap-8 mx-4">
                                <EditableText
                                    value={data.siteContent.marqueeText}
                                    onSave={(val) => onUpdate('marqueeText', val)}
                                    isAdmin={isAdmin}
                                    label="Marquee Text"
                                    className="hover:text-white"
                                />
                                {data.tickerItems.map((item) => (
                                    <React.Fragment key={`${repeatIdx}-${item.id}`}>
                                        <span className="flex items-center gap-2">
                                            {getIcon(item.type)}
                                            <EditableText
                                                value={item.label}
                                                onSave={(val) => onUpdateTicker(item.id, 'label', val)}
                                                isAdmin={isAdmin}
                                                label="Ticker Label"
                                                className="hover:text-white"
                                            />:
                                            <EditableText
                                                value={item.value}
                                                onSave={(val) => onUpdateTicker(item.id, 'value', val)}
                                                isAdmin={isAdmin}
                                                label="Ticker Value"
                                                className="hover:text-white"
                                            />
                                        </span>
                                        <span className="mx-4 text-white/20">•</span>
                                    </React.Fragment>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
