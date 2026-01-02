import React, { useState, useEffect } from 'react';
import { ClubData, Project } from '../types';
import { ArrowRight, ChevronLeft, Tag, FileText, Layout, Image as ImageIcon } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { GITHUB_RAW_BASE_URL, GITHUB_API_BASE_URL } from '../constants';

interface ProjectsProps {
    data: ClubData;
    isAdmin: boolean;
    onUpdateProject: (id: string, field: keyof Project | 'specs', value: any) => void;
}

const Projects: React.FC<ProjectsProps> = ({ data, isAdmin, onUpdateProject }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeProjectView, setActiveProjectView] = useState<'details' | 'logs' | 'media'>('details');
    const [logContent, setLogContent] = useState<string>('');
    const [isLoadingLog, setIsLoadingLog] = useState(false);
    const [projectMedia, setProjectMedia] = useState<{ name: string, url: string, type: string }[]>([]);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);

    const selectedProject = data.projects.find(p => p.id === selectedId);

    useEffect(() => {
        if (selectedId) {
            if (activeProjectView === 'logs') {
                fetchLogContent(selectedId);
            } else if (activeProjectView === 'media') {
                fetchProjectMedia(selectedId);
            }
        }
    }, [selectedId, activeProjectView]);

    const fetchLogContent = async (projectId: string) => {
        setIsLoadingLog(true);
        try {
            // 1. Attempt local fetch
            let response = await fetch(`/logs/${projectId}.md`);

            // 2. If local fails, attempt external repo fetch
            if (!response.ok) {
                response = await fetch(`${GITHUB_RAW_BASE_URL}/logs/${projectId}.md`);
            }

            if (response.ok) {
                const text = await response.text();
                setLogContent(text);
            } else {
                setLogContent('No documentation found for this project yet. Stay tuned for updates from the engineering team.');
            }
        } catch (error) {
            setLogContent('Error loading project logs.');
        } finally {
            setIsLoadingLog(false);
        }
    };

    const fetchProjectMedia = async (projectId: string) => {
        setIsLoadingMedia(true);
        try {
            // Fetch file list from GitHub Contents API
            const response = await fetch(`${GITHUB_API_BASE_URL}/media/${projectId}`);
            if (response.ok) {
                const files = await response.json();
                const mediaItems = files
                    .filter((file: any) => file.type === 'file' && /\.(jpe?g|png|gif|mp4|webm)$/i.test(file.name))
                    .map((file: any) => ({
                        name: file.name,
                        url: file.download_url,
                        type: file.name.match(/\.(mp4|webm)$/i) ? 'video' : 'image'
                    }));
                setProjectMedia(mediaItems);
            } else {
                setProjectMedia([]);
            }
        } catch (error) {
            console.error('Error fetching project media:', error);
            setProjectMedia([]);
        } finally {
            setIsLoadingMedia(false);
        }
    };

    const updateSpec = (projectId: string, index: number, field: 'label' | 'value', newValue: string) => {
        if (!selectedProject || !selectedProject.specs) return;
        const newSpecs = [...selectedProject.specs];
        newSpecs[index] = { ...newSpecs[index], [field]: newValue };
        onUpdateProject(projectId, 'specs', newSpecs);
    };

    return (
        <div className="min-h-screen pt-20 bg-white relative">

            {/* Full Screen Project Detail Overlay */}
            <div className={`fixed inset-0 z-50 bg-white overflow-y-auto transition-transform duration-500 ease-in-out ${selectedProject ? 'translate-y-0' : 'translate-y-full'}`}>
                {selectedProject && (
                    <div className="min-h-screen relative">
                        {/* Close Button / Header */}
                        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <button
                                onClick={() => { setSelectedId(null); setActiveProjectView('details'); }}
                                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-mono text-sm uppercase tracking-wider"
                            >
                                <ChevronLeft className="w-4 h-4" /> Return to Projects
                            </button>

                            <div className="flex items-center bg-surface p-1 rounded-xl border border-gray-100">
                                <button
                                    onClick={() => setActiveProjectView('details')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeProjectView === 'details' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-contrast'}`}
                                >
                                    <Layout className="w-3.5 h-3.5" /> Specifications
                                </button>
                                <button
                                    onClick={() => setActiveProjectView('logs')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeProjectView === 'logs' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-contrast'}`}
                                >
                                    <FileText className="w-3.5 h-3.5" /> Project Logs
                                </button>
                                <button
                                    onClick={() => setActiveProjectView('media')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeProjectView === 'media' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-contrast'}`}
                                >
                                    <ImageIcon className="w-3.5 h-3.5" /> Media Gallery
                                </button>
                            </div>

                            <div className="font-mono text-xs text-gray-400">PROJ-ID: {selectedProject.id}</div>
                        </div>

                        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                            {activeProjectView === 'details' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-fade-in">
                                    {/* ... image and text content ... */}
                                    {/* (Rest of details view remains the same) */}
                                </div>
                            ) : activeProjectView === 'logs' ? (
                                <div className="max-w-4xl mx-auto animate-fade-in">
                                    <div className="flex items-center justify-between mb-12">
                                        <div>
                                            <h2 className="text-4xl font-bold text-contrast mb-2">{selectedProject.title} Engineering Log</h2>
                                            <p className="text-secondary font-mono text-sm">ARCHIVE_TYPE: MARKDOWN_DOCUMENTATION</p>
                                        </div>
                                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                    </div>

                                    {isLoadingLog ? (
                                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-secondary font-mono text-xs">DECRYPTING ARCHIVES...</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm min-h-[400px]">
                                            <div className="prose prose-blue max-w-none prose-headings:text-contrast prose-p:text-secondary prose-strong:text-contrast">
                                                {/* In a real app, we would use a markdown library like react-markdown */}
                                                <pre className="whitespace-pre-wrap font-sans text-lg leading-relaxed">
                                                    {logContent}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="max-w-6xl mx-auto animate-fade-in">
                                    <div className="flex items-center justify-between mb-12">
                                        <div>
                                            <h2 className="text-4xl font-bold text-contrast mb-2">{selectedProject.title} Media Gallery</h2>
                                            <p className="text-secondary font-mono text-sm">ARCHIVE_TYPE: EXTERNAL_CONTENT_REPOSITORY</p>
                                        </div>
                                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                    </div>

                                    {isLoadingMedia ? (
                                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-secondary font-mono text-xs">INDEXING REMOTE ASSETS...</p>
                                        </div>
                                    ) : projectMedia.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {projectMedia.map((item, idx) => (
                                                <div key={idx} className="group relative bg-surface rounded-2xl overflow-hidden border border-gray-100 aspect-video shadow-sm hover:shadow-md transition-all">
                                                    {item.type === 'image' ? (
                                                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                                    ) : (
                                                        <video src={item.url} className="w-full h-full object-cover" controls />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                        <p className="text-white font-mono text-[10px] truncate">{item.name}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-20 text-center">
                                            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-contrast">No media found</h3>
                                            <p className="text-secondary mt-2">Add assets to the /media/{selectedProject.id} folder in the content repository.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Header (Background for List View) */}
            <div className="bg-surface border-b border-gray-100 py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-sm font-mono text-primary mb-2 uppercase tracking-widest">/// Project Access</h2>
                    <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-sky-400">Active Development</h1>
                    <p className="text-xl text-secondary mt-4 max-w-2xl font-light">
                        Current engineering efforts in rocketry, fixed-wing aircraft, and multi-rotor systems.
                    </p>
                </div>
            </div>

            {/* Project List */}
            <section className="py-20 px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-32">
                    {data.projects.map((project, index) => (
                        <div key={project.id} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center group`}>

                            {/* Image Container with HUD Overlay */}
                            <div className="w-full lg:w-3/5 relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/5 bg-gray-100">
                                <img
                                    src={project.imageUrl}
                                    alt={project.title}
                                    className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
                                />

                                {/* HUD Overlay (Visible on Hover) */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="border border-white/30 p-8 w-[90%] h-[90%] relative">
                                        {/* Corners */}
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>

                                        <div className="text-white font-mono text-sm space-y-2 absolute bottom-4 left-4">
                                            <p>STATUS: {project.status.toUpperCase()}</p>
                                            <p>ID: PROJ-{project.id.padStart(3, '0')}</p>
                                            <p>SYS: ONLINE</p>
                                        </div>

                                        <button
                                            onClick={() => setSelectedId(project.id)}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black px-6 py-2 font-mono font-bold uppercase hover:bg-primary hover:text-white transition-colors"
                                        >
                                            Access Schematics
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Text Content (Preview) */}
                            <div className="w-full lg:w-2/5 space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className={`h-2 w-2 rounded-full ${project.status === 'Completed' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
                                        project.status === 'In Progress' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' :
                                            'bg-gray-400'
                                        }`}></span>
                                    <span className="font-mono text-xs text-secondary uppercase tracking-widest">
                                        {project.status}
                                    </span>
                                </div>

                                <h3 className="text-4xl font-bold text-contrast leading-tight">{project.title}</h3>
                                <p className="text-lg text-secondary leading-relaxed font-light line-clamp-3">
                                    {project.description}
                                </p>

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-mono text-gray-400 uppercase">Lead Engineer</p>
                                            <p className="text-sm font-medium">
                                                <EditableText
                                                    value={project.leadEngineer || 'TBD'}
                                                    onSave={(val) => onUpdateProject(project.id, 'leadEngineer', val)}
                                                    isAdmin={isAdmin}
                                                    label="Lead Engineer"
                                                />
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-mono text-gray-400 uppercase">Est. Completion</p>
                                            <p className="text-sm font-medium">
                                                <EditableText
                                                    value={project.completionDate || 'TBD'}
                                                    onSave={(val) => onUpdateProject(project.id, 'completionDate', val)}
                                                    isAdmin={isAdmin}
                                                    label="Completion Date"
                                                />
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedId(project.id)}
                                    className="text-primary font-medium flex items-center gap-2 hover:gap-3 transition-all group-hover:text-primary-dark pt-2"
                                >
                                    View Specs <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Projects;