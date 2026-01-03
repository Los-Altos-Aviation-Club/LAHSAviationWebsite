import React, { useState } from 'react';
import { ClubData, Event } from '../types';
import { MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface EventsProps {
    data: ClubData;
    isAdmin: boolean;
    onUpdateEvent: (id: string, field: keyof Event, value: string) => void;
}

const Events: React.FC<EventsProps> = ({ data, isAdmin, onUpdateEvent }) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    return (
        <div className="min-h-screen pt-28 bg-surface relative">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">

                {/* Header */}
                <div className="mb-16 text-center">
                    <h2 className="text-sm font-mono text-primary mb-2 uppercase tracking-widest">/// Logbook</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-sky-400 pb-2">Upcoming Departures</h3>
                    <p className="mt-4 text-secondary">Workshops, launches, and guest speakers.</p>
                </div>

                <div className="grid gap-8">
                    {data.events.length > 0 ? (
                        data.events.map((event) => (
                            <div key={event.id} className="bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col md:flex-row border border-gray-100 hover:shadow-hover transition-all duration-300 group">

                                {/* Image Section (New) */}
                                <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative bg-gray-100">
                                    <EditableImage
                                        src={event.imageUrl}
                                        alt={event.title}
                                        onSave={(val) => onUpdateEvent(event.id, 'imageUrl', val)}
                                        isAdmin={isAdmin}
                                        className="w-full h-full"
                                    />
                                    {/* Overlay Date for Mobile/Desktop unification */}
                                    <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100">
                                        <EditableText
                                            value={event.date}
                                            onSave={(val) => onUpdateEvent(event.id, 'date', val)}
                                            isAdmin={isAdmin}
                                            label="Event Date"
                                            inputType="date"
                                        >
                                            <div className="text-center">
                                                <span className="block text-[10px] font-bold text-secondary uppercase font-mono leading-none">
                                                    {isNaN(new Date(event.date).getTime()) ? 'DATE' : new Date(event.date).toLocaleString('default', { month: 'short' })}
                                                </span>
                                                <span className="block text-2xl font-bold text-contrast leading-none">
                                                    {isNaN(new Date(event.date).getTime()) ? '--' : new Date(event.date).getDate()}
                                                </span>
                                            </div>
                                        </EditableText>
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="p-8 flex-grow flex flex-col justify-center gap-4 relative">

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-1 bg-blue-50 text-primary text-[10px] font-bold uppercase tracking-wider rounded">Confirmed</span>
                                            <div className="text-xs text-secondary font-mono flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                <EditableText
                                                    value={event.location}
                                                    onSave={(val) => onUpdateEvent(event.id, 'location', val)}
                                                    isAdmin={isAdmin}
                                                    label="Location"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-contrast">
                                            <EditableText
                                                value={event.title}
                                                onSave={(val) => onUpdateEvent(event.id, 'title', val)}
                                                isAdmin={isAdmin}
                                                label="Event Title"
                                            />
                                        </div>
                                        <div className="text-secondary max-w-xl">
                                            <EditableText
                                                value={event.description}
                                                onSave={(val) => onUpdateEvent(event.id, 'description', val)}
                                                isAdmin={isAdmin}
                                                label="Description"
                                                multiline
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Divider (Dashed Line) */}
                                <div className="hidden md:flex relative w-px border-l border-dashed border-gray-300 my-8 items-center justify-center">
                                    <div className="absolute -top-3 w-6 h-6 bg-surface rounded-full -left-[11px]"></div>
                                    <div className="absolute -bottom-3 w-6 h-6 bg-surface rounded-full -left-[11px]"></div>
                                </div>

                                {/* Right: Ticket Stub Action */}
                                <div className="p-6 md:p-8 bg-gray-50 flex flex-col justify-center items-center gap-4 min-w-[200px] border-t md:border-t-0 border-gray-100">
                                    <div className="text-center w-full">
                                        <p className="text-xs font-mono text-gray-400 uppercase mb-1">Boarding Time</p>
                                        <div className="text-xl font-bold text-contrast font-mono">
                                            <EditableText
                                                value={event.time}
                                                onSave={(val) => onUpdateEvent(event.id, 'time', val)}
                                                isAdmin={isAdmin}
                                                label="Time"
                                                inputType="time"
                                            />
                                        </div>
                                    </div>
                                    <a
                                        href={data.googleCalendarUrl}
                                        target="_blank"
                                        className="w-full py-2 px-4 bg-white border border-gray-200 text-contrast text-sm font-medium rounded-lg hover:border-primary hover:text-primary transition-colors text-center shadow-sm"
                                        rel="noreferrer"
                                    >
                                        Add to Calendar
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-contrast">No upcoming events scheduled at this time</h3>
                            <p className="text-secondary mt-2">Check back later or join our Discord for updates.</p>
                        </div>
                    )}

                    {/* Calendar Drop-down Section */}
                    <div className="mt-12 w-full">
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="w-full py-6 flex flex-col items-center justify-center gap-2 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-2 text-contrast font-semibold">
                                <Calendar className="w-5 h-5 text-primary" />
                                Mission Control Schedule
                                {isCalendarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                            <p className="text-xs text-secondary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                {isCalendarOpen ? 'Collapse View' : 'Expand Calendar'}
                            </p>
                        </button>

                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCalendarOpen ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                            <div className="w-full h-[600px] bg-white rounded-3xl border border-gray-200 shadow-soft overflow-hidden relative">
                                <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-center p-8">
                                    <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                                    <p className="text-secondary font-medium">Calendar Feed Offline</p>
                                    <p className="text-sm text-gray-400 max-w-md mt-2">
                                        System unable to retrieve live telemetry. Click "Add to Calendar" on individual events to sync manually.
                                    </p>
                                    <a
                                        href={data.googleCalendarUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-6 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-dark transition-colors"
                                    >
                                        Open External Schedule
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Empty state footer */}
                    <div className="text-center py-12">
                        <p className="text-gray-400 font-mono text-sm uppercase">End of Scheduled Flights</p>
                        <a href={data.discordUrl} className="text-primary text-sm hover:underline mt-2 inline-block">Check Discord for ad-hoc meetups</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Events;