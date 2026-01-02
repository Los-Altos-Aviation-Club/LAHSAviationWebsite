import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClubData, SiteContent, TickerItem } from '../types';
import { ArrowRight, Wind, Zap, Users, Play, Box, ChevronLeft, Power } from 'lucide-react';
import FlightGame from './FlightGame';
import ModelViewer from './ModelViewer';
import EditableText from './EditableText';

interface HomeProps {
  data: ClubData;
  isAdmin: boolean;
  onUpdate: (key: keyof SiteContent, value: string) => void;
  onUpdateTicker: (id: string, field: keyof TickerItem, value: string) => void;
  setGameMode: (isGame: boolean) => void;
}

type ViewState = 'default' | 'selection' | 'game' | 'model';

const Home: React.FC<HomeProps> = ({ data, isAdmin, onUpdate, onUpdateTicker, setGameMode }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [viewState, setViewState] = useState<ViewState>('default');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update parent App game mode state when view changes
  useEffect(() => {
    if (viewState === 'selection' || viewState === 'game' || viewState === 'model') {
        setGameMode(true);
    } else {
        setGameMode(false);
    }
    // Cleanup on unmount
    return () => setGameMode(false);
  }, [viewState, setGameMode]);

  const handleStartEngines = () => {
    setIsTransitioning(true);
    setTimeout(() => {
        setViewState('selection');
        setIsTransitioning(false);
    }, 800); // Match animation duration
  };

  const handleReturn = () => {
    setIsTransitioning(true);
    setViewState('default');
    setTimeout(() => {
        setIsTransitioning(false);
    }, 100);
  };

  const handleExitInteractive = () => {
      setViewState('selection');
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'wind': return <Wind className="w-3 h-3 text-primary" />;
          case 'zap': return <Zap className="w-3 h-3 text-yellow-400" />;
          case 'users': return <Users className="w-3 h-3 text-green-400" />;
          default: return <Wind className="w-3 h-3" />;
      }
  };

  // Render Interactive Components
  if (viewState === 'game') return <FlightGame onExit={handleExitInteractive} />;
  if (viewState === 'model') return <ModelViewer onExit={handleExitInteractive} />;

  return (
    <div className="w-full bg-background text-contrast overflow-x-hidden relative min-h-screen">
      
      {/* SELECTION SCREEN OVERLAY */}
      {viewState === 'selection' && (
         <div className="fixed inset-0 z-40 bg-slate-900 flex items-center justify-center animate-land">
            <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none"></div>
            
            <div className="max-w-4xl w-full px-6 relative z-10">
                <button 
                    onClick={handleReturn}
                    className="absolute -top-16 left-6 text-white/50 hover:text-white flex items-center gap-2 font-mono text-sm transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> ABORT MISSION
                </button>
                
                <h2 className="text-white text-center font-mono text-2xl mb-12 uppercase tracking-[0.2em] animate-pulse">Select Flight System</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Game Card */}
                    <button 
                        onClick={() => setViewState('game')}
                        className="group relative bg-slate-800 border border-slate-700 p-8 rounded-3xl hover:bg-slate-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 text-left overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 fill-current" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Flight Training</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Initialize simulation protocol. Navigate through turbulence and collect telemetry data packets.
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Ready
                        </div>
                    </button>

                    {/* Model Card */}
                    <button 
                         onClick={() => setViewState('model')}
                        className="group relative bg-slate-800 border border-slate-700 p-8 rounded-3xl hover:bg-slate-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-400/20 text-left overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                            <Box className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Schematic Viewer</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Access classified blueprints. Interactive 3D wireframe analysis of experimental airframes.
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Online
                        </div>
                    </button>
                </div>
            </div>
         </div>
      )}

      {/* HERO SECTION */}
      <section 
        id="home" 
        className={`relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20 overflow-hidden transition-all duration-1000 ${isTransitioning ? 'animate-takeoff' : ''}`}
        style={{ display: viewState === 'default' || isTransitioning ? 'flex' : 'none' }}
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
          <div className="flex justify-center">
            <button 
                onClick={handleStartEngines}
                className="inline-flex items-center gap-2 py-2 px-6 rounded-full bg-surface border border-gray-200 text-xs font-mono text-secondary uppercase tracking-wider shadow-sm hover:border-primary hover:text-primary hover:scale-105 transition-all cursor-pointer group bg-white/80 backdrop-blur-sm"
            >
              <Power className="w-3 h-3 group-hover:text-green-500 transition-colors" />
              Initialize Flight Systems
            </button>
          </div>
          
          <div className="text-6xl md:text-8xl font-bold tracking-tighter leading-none pb-4">
            <EditableText 
              value={data.siteContent.homeHeroTitle} 
              onSave={(val) => onUpdate('homeHeroTitle', val)}
              isAdmin={isAdmin}
              label="Hero Title"
              className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-sky-400 pb-2 inline-block"
            />
            <div className="h-4"></div> {/* Spacer */}
            <div className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-400 to-sky-300 relative text-5xl md:text-7xl">
              . . .
            </div>
          </div>
          
          <div className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto font-light leading-relaxed">
            <EditableText 
              value={data.siteContent.homeHeroSubtitle}
              onSave={(val) => onUpdate('homeHeroSubtitle', val)}
              isAdmin={isAdmin}
              label="Hero Subtitle"
              multiline
            />
          </div>
          
          <div className="pt-8 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link to="/projects" className="group relative px-8 py-3.5 bg-contrast text-white font-medium rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <span className="relative z-10 flex items-center gap-2">Explore Hangar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/></span>
              <div className="absolute inset-0 bg-primary transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            </Link>
            <Link to="/mission" className="px-8 py-3.5 bg-white text-contrast border border-gray-200 font-medium rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2">
              Mission Briefing
            </Link>
          </div>
        </div>
      </section>

      {/* INFINITE TICKER - Only show on default view */}
      {viewState === 'default' && (
        <div className="w-full bg-contrast py-3 overflow-hidden border-y border-white/10 relative z-20">
            <div className="flex animate-ticker whitespace-nowrap">
            {[...Array(4)].map((_, repeatIdx) => (
                <div key={repeatIdx} className="flex">
                    {data.tickerItems.map((item) => (
                        <div key={`${repeatIdx}-${item.id}`} className="flex items-center gap-8 mx-4">
                            <span className="text-white/80 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
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
                        </div>
                    ))}
                </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Home;