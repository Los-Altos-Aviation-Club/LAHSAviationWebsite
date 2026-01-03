import React from 'react';
import { ClubData, SiteContent, Pillar, Officer, MissionCard } from '../types';
import { User, Plane, Wrench, Navigation, Rocket, Shield, Cpu, Globe, Zap, Layout, Image as ImageIcon } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface MissionProps {
    data: ClubData;
    isAdmin: boolean;
    onUpdate: (key: keyof SiteContent, value: string) => void;
    onUpdateMissionCard: (id: string, field: keyof MissionCard, value: string) => void;
    onUpdatePillar: (id: string, field: keyof Pillar, value: string) => void;
    onUpdateOfficer: (id: string, field: keyof Officer, value: string) => void;
}

const iconMap: { [key: string]: any } = {
    Plane,
    Wrench,
    Navigation,
    Rocket,
    Shield,
    Cpu,
    Globe,
    Zap,
    Layout
};

const Mission: React.FC<MissionProps> = ({ data, isAdmin, onUpdate, onUpdateMissionCard, onUpdatePillar, onUpdateOfficer }) => {
    return (
        <div className="min-h-screen pt-20 bg-surface relative overflow-hidden">
            {/* Blueprint Grid Background */}
            <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 bg-white border-b border-gray-100 py-16 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-sky-400">
                        <EditableText
                            value={data.siteContent.missionTitle || 'Our Mission'}
                            onSave={(val) => onUpdate('missionTitle', val)}
                            isAdmin={isAdmin}
                            label="Mission Header"
                            className="!text-primary"
                        />
                    </h1>
                    <div className="text-xl text-secondary max-w-2xl mx-auto font-light">
                        <EditableText
                            value={data.siteContent.missionStatement || ''}
                            onSave={(val) => onUpdate('missionStatement', val)}
                            isAdmin={isAdmin}
                            label="Mission Statement"
                            multiline
                        />
                    </div>
                </div>
            </div>

            {/* Unified Mission Cards Section */}
            <section className="py-20 px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(data.missionCards || []).map((card) => {
                            if (card.type === 'icon') {
                                const IconComponent = iconMap[card.icon || ''] || Plane;
                                return (
                                    <div key={card.id} className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-2 flex flex-col h-full">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                            <IconComponent className="w-7 h-7 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4 font-mono text-contrast">
                                            <EditableText
                                                value={card.title}
                                                onSave={(val) => onUpdateMissionCard(card.id, 'title', val)}
                                                isAdmin={isAdmin}
                                                label="Card Title"
                                            />
                                        </h3>
                                        <div className="text-secondary leading-relaxed flex-grow">
                                            <EditableText
                                                value={card.description}
                                                onSave={(val) => onUpdateMissionCard(card.id, 'description', val)}
                                                isAdmin={isAdmin}
                                                label="Card Description"
                                                multiline
                                            />
                                        </div>
                                        <div className="mt-8 w-12 h-1 bg-primary/20 rounded-full group-hover:w-full transition-all duration-500"></div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={card.id} className="group rounded-3xl bg-white border border-gray-100 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-2 overflow-hidden flex flex-col h-full">
                                        {/* Image Area */}
                                        <div className="h-48 w-full overflow-hidden relative">
                                            <EditableImage
                                                src={card.imageUrl || ''}
                                                alt={card.title}
                                                onSave={(val) => onUpdateMissionCard(card.id, 'imageUrl', val)}
                                                isAdmin={isAdmin}
                                                className="w-full h-full"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 pointer-events-none"></div>
                                        </div>

                                        <div className="p-8 flex-grow flex flex-col">
                                            <div className="text-2xl font-bold mb-4 font-mono text-contrast">
                                                <EditableText
                                                    value={card.title}
                                                    onSave={(val) => onUpdateMissionCard(card.id, 'title', val)}
                                                    isAdmin={isAdmin}
                                                    label="Card Title"
                                                />
                                            </div>
                                            <div className="text-secondary leading-relaxed flex-grow">
                                                <EditableText
                                                    value={card.description}
                                                    onSave={(val) => onUpdateMissionCard(card.id, 'description', val)}
                                                    isAdmin={isAdmin}
                                                    label="Card Description"
                                                    multiline
                                                />
                                            </div>
                                            <div className="mt-8 w-full h-1 bg-gray-100 relative overflow-hidden rounded-full">
                                                <div className="absolute inset-0 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
            </section>

            {/* Mission Section (Image & Banner) */}
            <section className="py-20 px-6 lg:px-8 bg-surface border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="w-full rounded-3xl overflow-hidden shadow-2xl relative group bg-gray-200 h-[400px]">
                        <EditableImage
                            src={data.siteContent.missionBannerUrl || "https://images.unsplash.com/photo-1464746109676-23191284eb3b?q=80&w=2072&auto=format&fit=crop"}
                            alt="Aviation Club"
                            onSave={(val) => onUpdate('missionBannerUrl', val)}
                            isAdmin={isAdmin}
                            className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 flex flex-col items-center justify-end pb-12 pointer-events-none">
                            <p className="text-white/80 font-mono text-sm uppercase tracking-widest mb-2">LAHS Aviation Club</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Meet the Team Section */}
            <section className="py-20 px-6 lg:px-8 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-contrast mb-4">
                            <EditableText
                                value={data.siteContent.missionTeamTitle}
                                onSave={(val) => onUpdate('missionTeamTitle', val)}
                                isAdmin={isAdmin}
                                label="Team Section Header"
                            />
                        </h2>
                        <p className="text-secondary max-w-2xl mx-auto">
                            <EditableText
                                value={data.siteContent.missionTeamSubtitle}
                                onSave={(val) => onUpdate('missionTeamSubtitle', val)}
                                isAdmin={isAdmin}
                                label="Team Section Subtitle"
                                multiline
                            />
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {(data.officers || []).map((officer) => (
                            <div key={officer.id} className="group relative">
                                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                    <EditableImage
                                        src={officer.imageUrl || 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=2070&auto=format&fit=crop'}
                                        alt={officer.name}
                                        onSave={(val) => onUpdateOfficer(officer.id, 'imageUrl', val)}
                                        isAdmin={isAdmin}
                                        className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 pointer-events-none">
                                        <p className="text-white/80 text-xs font-mono uppercase tracking-widest">{officer.role}</p>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-contrast">
                                    <EditableText
                                        value={officer.name}
                                        onSave={(val) => onUpdateOfficer(officer.id, 'name', val)}
                                        isAdmin={isAdmin}
                                        label="Officer Name"
                                    />
                                </h3>
                                <p className="text-primary font-mono text-xs uppercase tracking-wider mb-2">
                                    <EditableText
                                        value={officer.role}
                                        onSave={(val) => onUpdateOfficer(officer.id, 'role', val)}
                                        isAdmin={isAdmin}
                                        label="Officer Role"
                                    />
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Mission;
