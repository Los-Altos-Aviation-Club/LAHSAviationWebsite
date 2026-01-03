import React, { useState } from 'react';
import { ClubData, Meeting, SiteContent } from '../types';
import { MapPin, Calendar, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface MeetingsProps {
    data: ClubData;
    isAdmin: boolean;
    onUpdate: (key: keyof SiteContent, value: string) => void;
    onUpdateMeeting: (id: string, field: keyof Meeting, value: any) => void;
}

const Meetings: React.FC<MeetingsProps> = ({ data, isAdmin, onUpdate, onUpdateMeeting }) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    return (
        <div className="min-h-screen pt-28 bg-surface relative">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">

                {/* Header */}
                <div className="mb-16 text-center">
                    <h2 className="text-sm font-mono text-primary mb-2 uppercase tracking-widest">/// Logbook</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-sky-400 pb-2">
                        <EditableText
                            value={data.siteContent.meetingsTitle}
                            onSave={(val) => onUpdate('meetingsTitle', val)}
                            isAdmin={isAdmin}
                            label="Meetings Header"
                        />
                    </h3>
                    <p className="mt-4 text-secondary">
                        <EditableText
                            value={data.siteContent.meetingsSubtitle}
                            onSave={(val) => onUpdate('meetingsSubtitle', val)}
                            isAdmin={isAdmin}
                            label="Meetings Subtitle"
                            multiline
                        />
                    </p>
                </div>

                <div className="grid gap-8">
                    {data.meetings.length > 0 ? (
                        data.meetings.map((meeting) => (
                            <div key={meeting.id} className={`bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col md:flex-row border border-gray-100 hover:shadow-hover transition-all duration-300 group ${meeting.status === 'Cancelled' ? 'opacity-75 grayscale-[0.5]' : ''}`}>

                                {/* Image Section */}
                                <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative bg-gray-100">
                                    <EditableImage
                                        src={meeting.imageUrl}
                                        alt={meeting.title}
                                        onSave={(val) => onUpdateMeeting(meeting.id, 'imageUrl', val)}
                                        isAdmin={isAdmin}
                                        className="w-full h-full"
                                    />
                                    {/* Overlay Date */}
                                    <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100">
                                        <EditableText
                                            value={meeting.date}
                                            onSave={(val) => onUpdateMeeting(meeting.id, 'date', val)}
                                            isAdmin={isAdmin}
                                            label="Meeting Date"
                                            inputType="date"
                                        >
                                            <div className="text-center">
                                                <span className="block text-[10px] font-bold text-secondary uppercase font-mono leading-none">
                                                    {isNaN(new Date(meeting.date).getTime()) ? 'DATE' : new Date(meeting.date).toLocaleString('default', { month: 'short' })}
                                                </span>
                                                <span className="block text-2xl font-bold text-contrast leading-none">
                                                    {isNaN(new Date(meeting.date).getTime()) ? '--' : new Date(meeting.date).getDate()}
                                                </span>
                                            </div>
                                        </EditableText>
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="p-8 flex-grow flex flex-col justify-center gap-4 relative">

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            {meeting.status === 'Cancelled' ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> CANCELLED
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-blue-50 text-primary text-[10px] font-bold uppercase tracking-wider rounded">Confirmed</span>
                                            )}
                                            <div className="text-xs text-secondary font-mono flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                <EditableText
                                                    value={meeting.location}
                                                    onSave={(val) => onUpdateMeeting(meeting.id, 'location', val)}
                                                    isAdmin={isAdmin}
                                                    label="Location"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-contrast">
                                            <EditableText
                                                value={meeting.title}
                                                onSave={(val) => onUpdateMeeting(meeting.id, 'title', val)}
                                                isAdmin={isAdmin}
                                                label="Meeting Title"
                                            />
                                        </div>
                                        <div className="text-secondary max-w-xl">
                                            <EditableText
                                                value={meeting.description}
                                                onSave={(val) => onUpdateMeeting(meeting.id, 'description', val)}
                                                isAdmin={isAdmin}
                                                label="Description"
                                                multiline
                                            />
                                        </div>

                                        {meeting.status === 'Cancelled' && meeting.cancellationReason && (
                                            <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
                                                <p className="text-xs font-bold text-red-600 uppercase mb-1">Cancellation Reason:</p>
                                                <p className="text-sm text-red-800 italic">
                                                    <EditableText
                                                        value={meeting.cancellationReason}
                                                        onSave={(val) => onUpdateMeeting(meeting.id, 'cancellationReason', val)}
                                                        isAdmin={isAdmin}
                                                        label="Cancellation Reason"
                                                    />
                                                </p>
                                            </div>
                                        )}
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
                                                value={meeting.time}
                                                onSave={(val) => onUpdateMeeting(meeting.id, 'time', val)}
                                                isAdmin={isAdmin}
                                                label="Time"
                                                inputType="time"
                                            />
                                        </div>
                                    </div>
                                    {meeting.status !== 'Cancelled' && (
                                        <a
                                            href={data.googleCalendarUrl}
                                            target="_blank"
                                            className="w-full py-2 px-4 bg-white border border-gray-200 text-contrast text-sm font-medium rounded-lg hover:border-primary hover:text-primary transition-colors text-center shadow-sm"
                                            rel="noreferrer"
                                        >
                                            Add to Calendar
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-contrast">No upcoming meetings scheduled at this time</h3>
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
                                        System unable to retrieve live telemetry. Click "Add to Calendar" on individual meetings to sync manually.
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

export default Meetings;