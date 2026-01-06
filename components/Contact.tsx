import React from 'react';
import { ClubData, SiteContent, Officer } from '../types';
import { Mail, MessageSquare, User, Users } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface ContactProps {
    data: ClubData;
    isAdmin: boolean;
    onUpdate: (key: keyof SiteContent, value: string) => void;
    onUpdateOfficer: (id: string, field: keyof Officer, value: string) => void;
}

const Contact: React.FC<ContactProps> = ({ data, isAdmin, onUpdate, onUpdateOfficer }) => {
    const primaryContactEmail = data.officers?.[0]?.email || 'aviation@lahs.edu';
    return (
        <div className="min-h-screen pt-32 pb-20 bg-white text-contrast relative overflow-hidden">

            <div className="max-w-4xl mx-auto px-6 relative z-10 w-full">
                <div className="text-center space-y-8 mb-16">
                    <div className="inline-block px-3 py-1 rounded-full border border-primary/20 bg-blue-50 text-xs font-mono tracking-widest text-primary uppercase">
                        Communications: Open
                    </div>
                    <div className="text-6xl md:text-7xl font-bold tracking-tight">
                        <EditableText
                            value={data.siteContent.contactTitle}
                            onSave={(val) => onUpdate('contactTitle', val)}
                            isAdmin={isAdmin}
                            label="Contact Header"
                            className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-sky-400 !text-primary"
                        />
                    </div>
                    <div className="text-xl text-secondary max-w-2xl mx-auto font-light">
                        <EditableText
                            value={data.siteContent.contactSubtitle}
                            onSave={(val) => onUpdate('contactSubtitle', val)}
                            isAdmin={isAdmin}
                            label="Contact Subtitle"
                            multiline
                        />
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                    <a
                        href={data.discordUrl}
                        className="group p-8 rounded-3xl bg-[#5865F2] hover:bg-[#4752C4] transition-all duration-300 shadow-lg hover:shadow-[#5865f2]/50 hover:-translate-y-1 relative overflow-hidden text-white"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">Join the Discord</h3>
                                <p className="text-white/80">Daily updates, build logs, and chat.</p>
                            </div>
                            <span className="inline-flex items-center font-bold text-sm bg-white/20 self-start px-4 py-2 rounded-lg backdrop-blur-sm">
                                Connect Now
                            </span>
                        </div>
                    </a>

                    <a
                        href={`mailto:${primaryContactEmail}`}
                        className="group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-contrast transform group-hover:scale-110 transition-transform">
                            <Mail className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2 text-contrast">General Inquiry</h3>
                                <p className="text-secondary">Partnerships, press, and questions.</p>
                            </div>
                            <span className="inline-flex items-center font-bold text-sm bg-contrast text-white self-start px-4 py-2 rounded-lg">
                                Send Message
                            </span>
                        </div>
                    </a>
                </div>

                {/* Officer Directory */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px flex-grow bg-gray-200"></div>
                        <h2 className="text-lg font-mono font-bold text-secondary uppercase tracking-widest">Officer Directory</h2>
                        <div className="h-px flex-grow bg-gray-200"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(data.officers || []).map((officer) => (
                            <div key={officer.id} className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-primary/50 transition-all hover:shadow-xl flex flex-col gap-4 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-surface flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm shrink-0">
                                        {officer.imageUrl ? (
                                            <EditableImage
                                                src={officer.imageUrl}
                                                alt={officer.name}
                                                onSave={(val) => onUpdateOfficer(officer.id, 'imageUrl', val)}
                                                isAdmin={isAdmin}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Users className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest truncate">
                                            <EditableText
                                                value={officer.role}
                                                onSave={(val) => onUpdateOfficer(officer.id, 'role', val)}
                                                isAdmin={isAdmin}
                                                label="Officer Role"
                                            />
                                        </p>
                                        <h3 className="text-lg font-bold text-contrast truncate">
                                            <EditableText
                                                value={officer.name}
                                                onSave={(val) => onUpdateOfficer(officer.id, 'name', val)}
                                                isAdmin={isAdmin}
                                                label="Officer Name"
                                            />
                                        </h3>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50 mt-auto">
                                    <a
                                        href={`mailto:${officer.email}`}
                                        className="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-2 group/link"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover/link:bg-primary/10 transition-colors">
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <EditableText
                                                value={officer.email}
                                                onSave={(val) => onUpdateOfficer(officer.id, 'email', val)}
                                                isAdmin={isAdmin}
                                                label="Officer Email"
                                            />
                                        </div>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">
                        Los Altos High School &bull; 201 Almond Ave, Los Altos, CA 94022
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Contact;