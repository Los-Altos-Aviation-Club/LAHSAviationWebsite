import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ClubData, Project } from '../types';
import { ArrowRight, ChevronLeft, Tag, FileText, Layout, Image as ImageIcon, Calendar, X, Maximize2 } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { GITHUB_RAW_BASE_URL, GITHUB_API_BASE_URL, PROJECTS_BASE_PATH } from '../constants';

interface ProjectUpdate {
    id: string;
    date: string;
    title: string;
    description: string;
    media: { name: string, url: string, type: string }[];
}

interface ProjectsProps {
    data: ClubData;
    isAdmin: boolean;
    onUpdateProject: (id: string, field: keyof Project | 'specs', value: any) => void;
}

const Projects: React.FC<ProjectsProps> = ({ data, isAdmin, onUpdateProject }) => {
    const location = useLocation();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeProjectView, setActiveProjectView] = useState<'details' | 'updates'>('details');
    const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
    const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
    const [expandedMedia, setExpandedMedia] = useState<string | null>(null);

    const selectedProject = data?.projects?.find(p => p.id === selectedId);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-');    // Replace multiple - with single -
    };

    useEffect(() => {
        if (selectedId && activeProjectView === 'updates') {
            fetchProjectUpdates(selectedId);
        }
    }, [selectedId, activeProjectView]);

    // Close overlay on route changes to prevent state conflict (e.g. clicking "Projects" in navbar)
    useEffect(() => {
        if (selectedId !== null) {
            setSelectedId(null);
            setActiveProjectView('details');
        }
    }, [location.pathname]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedId(null);
                setActiveProjectView('details');
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const fetchProjectUpdates = async (projectId: string) => {
        setIsLoadingUpdates(true);
        const project = data?.projects?.find(p => p.id === projectId);
        if (!project) {
            setIsLoadingUpdates(false);
            return;
        }
        const slug = slugify(project.title);

        try {
            // Fetch subfolders in /projects/[project-slug]/
            const response = await fetch(`${GITHUB_API_BASE_URL}/${PROJECTS_BASE_PATH}/${slug}`);
            if (response.ok) {
                const contents = await response.json();
                const updateFolders = contents.filter((item: any) => item.type === 'dir');

                const fetchedUpdates = await Promise.all(updateFolders.map(async (folder: any) => {
                    // Fetch desc.txt
                    let description = 'No description available.';
                    try {
                        const descRes = await fetch(`${GITHUB_RAW_BASE_URL}/${PROJECTS_BASE_PATH}/${slug}/${folder.name}/desc.txt`);
                        if (descRes.ok) {
                            description = await descRes.text();
                        }
                    } catch (e) {
                        console.error('Error fetching desc.txt', e);
                    }

                    // Fetch media in subfolder
                    let media: { name: string, url: string, type: string }[] = [];
                    try {
                        const mediaRes = await fetch(`${GITHUB_API_BASE_URL}/${PROJECTS_BASE_PATH}/${slug}/${folder.name}`);
                        if (mediaRes.ok) {
                            const mediaFiles = await mediaRes.json();
                            media = mediaFiles
                                .filter((file: any) => file.type === 'file' && /\.(jpe?g|png|gif|mp4|webm)$/i.test(file.name))
                                .map((file: any) => ({
                                    name: file.name,
                                    url: file.download_url,
                                    type: file.name.match(/\.(mp4|webm)$/i) ? 'video' : 'image'
                                }));
                        }
                    } catch (e) {
                        console.error('Error fetching update media', e);
                    }

                    // Parse folder name for date and title: YYYY-MM-DD-Title
                    let date = 'Undated';
                    let title = folder.name.replace(/-/g, ' ');

                    const dateMatch = folder.name.match(/^(\d{4}-\d{2}-\d{2})-(.*)$/);
                    const exactDateMatch = folder.name.match(/^(\d{4}-\d{2}-\d{2})$/);

                    if (dateMatch) {
                        date = dateMatch[1];
                        title = dateMatch[2].replace(/-/g, ' ');
                    } else if (exactDateMatch) {
                        date = exactDateMatch[1];
                        title = 'Project Update';
                    }

                    return {
                        id: folder.name,
                        date,
                        title,
                        description,
                        media
                    };
                }));

                // Sort updates chronologically (newest first)
                setProjectUpdates(fetchedUpdates.sort((a, b) => b.date.localeCompare(a.date)));
            } else {
                setProjectUpdates([]);
            }
        } catch (error) {
            console.error('Error fetching project updates:', error);
            setProjectUpdates([]);
        } finally {
            setIsLoadingUpdates(false);
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
            {selectedId && (
                <div
                    className={`fixed inset-0 z-50 bg-white/40 backdrop-blur-sm overflow-y-auto transition-all duration-500 ease-in-out ${selectedId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedId(null);
                            setActiveProjectView('details');
                        }
                    }}
                >
                    <div
                        className={`min-h-screen bg-white transition-transform duration-500 ease-in-out ${selectedId ? 'translate-y-0' : 'translate-y-full'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedProject ? (
                            <>
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
                                            <Layout className="w-3.5 h-3.5" /> Overview
                                        </button>
                                        <button
                                            onClick={() => setActiveProjectView('updates')}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeProjectView === 'updates' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-contrast'}`}
                                        >
                                            <Calendar className="w-3.5 h-3.5" /> Project Progress
                                        </button>
                                    </div>

                                    <div className="font-mono text-xs text-gray-400">PROJ-ID: {selectedProject.id}</div>
                                </div>

                                <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                                    {activeProjectView === 'details' ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-fade-in">
                                            {/* Image Column */}
                                            <div className="space-y-8">
                                                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-100 aspect-[4/3]">
                                                    <EditableImage
                                                        src={selectedProject?.imageUrl || ''}
                                                        onSave={(val) => onUpdateProject(selectedProject?.id || '', 'imageUrl', val)}
                                                        isAdmin={isAdmin}
                                                        alt={selectedProject?.title || 'Project Image'}
                                                    />
                                                </div>

                                                {/* Specs Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {(selectedProject?.specs || []).map((spec, idx) => (
                                                        <div key={idx} className="bg-surface p-6 rounded-2xl border border-gray-100">
                                                            <div className="text-xs font-mono text-gray-400 uppercase mb-1">
                                                                <EditableText
                                                                    value={spec.label}
                                                                    onSave={(val) => updateSpec(selectedProject?.id || '', idx, 'label', val)}
                                                                    isAdmin={isAdmin}
                                                                    label="Spec Label"
                                                                />
                                                            </div>
                                                            <div className="text-lg font-bold text-contrast">
                                                                <EditableText
                                                                    value={spec.value}
                                                                    onSave={(val) => updateSpec(selectedProject?.id || '', idx, 'value', val)}
                                                                    isAdmin={isAdmin}
                                                                    label="Spec Value"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Content Column */}
                                            <div className="space-y-10">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Tag className="w-4 h-4 text-primary" />
                                                        <span className="font-mono text-xs text-primary uppercase tracking-widest">Engineering Report</span>
                                                    </div>
                                                    <h1 className="text-5xl font-bold text-contrast mb-6 leading-tight">
                                                        <EditableText
                                                            value={selectedProject?.title || ''}
                                                            onSave={(val) => onUpdateProject(selectedProject?.id || '', 'title', val)}
                                                            isAdmin={isAdmin}
                                                            label="Project Title"
                                                        />
                                                    </h1>
                                                    <div className="prose prose-blue max-w-none text-secondary text-lg leading-relaxed">
                                                        <EditableText
                                                            value={selectedProject?.description || ''}
                                                            onSave={(val) => onUpdateProject(selectedProject?.id || '', 'description', val)}
                                                            isAdmin={isAdmin}
                                                            label="Project Description"
                                                            multiline
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-gray-100">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                            <Layout className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-mono text-gray-400 uppercase mb-1">Current Status</p>
                                                            <p className="font-bold text-contrast">{selectedProject?.status}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-mono text-gray-400 uppercase mb-1">Operational Status</p>
                                                            <p className="font-bold text-contrast">{selectedProject?.operationalStatus}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-4xl mx-auto animate-fade-in">
                                            <div className="flex items-center justify-between mb-12">
                                                <div>
                                                    <h2 className="text-4xl font-bold text-contrast mb-2">{selectedProject.title} Development Updates</h2>
                                                    <p className="text-secondary font-mono text-sm">ARCHIVE_TYPE: NESTED_TIMELINE_REPOSITORY</p>
                                                </div>
                                                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                    <Calendar className="w-6 h-6" />
                                                </div>
                                            </div>

                                            {isLoadingUpdates ? (
                                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-secondary font-mono text-xs">SYNCHRONIZING TIMELINE...</p>
                                                </div>
                                            ) : projectUpdates.length > 0 ? (
                                                <div className="relative border-l-2 border-gray-100 ml-4 md:ml-8 pl-8 md:pl-12 space-y-16 py-4">
                                                    {projectUpdates.map((update, idx) => (
                                                        <div key={update.id || idx} className="relative">
                                                            {/* Timeline Dot */}
                                                            <div className="absolute -left-[41px] md:-left-[57px] top-0 w-4 h-4 rounded-full bg-white border-4 border-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10"></div>

                                                            <div className="space-y-4">
                                                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                                                    <span className="font-mono text-sm text-primary font-bold bg-primary/5 px-3 py-1 rounded-full w-fit">
                                                                        {update.date || 'No Date'}
                                                                    </span>
                                                                    <h3 className="text-2xl font-bold text-contrast capitalize">{update.title || 'Untitled Update'}</h3>
                                                                </div>

                                                                <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                                                                    <div className="prose prose-blue max-w-none prose-p:text-secondary prose-p:leading-relaxed text-lg whitespace-pre-wrap font-sans">
                                                                        {update.description || 'No details provided for this update.'}
                                                                    </div>

                                                                    {(update.media && update.media.length > 0) && (
                                                                        <div className={`mt-8 grid gap-4 ${update.media.length === 1 ? 'grid-cols-1' :
                                                                            update.media.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                                                                                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                                                            }`}>
                                                                            {update.media.map((item, mIdx) => (
                                                                                <div
                                                                                    key={mIdx}
                                                                                    className={`group relative bg-surface rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md ${item.type === 'image' ? 'cursor-zoom-in' : ''
                                                                                        } ${update.media.length === 1 ? 'aspect-video max-h-[500px]' : 'aspect-square'}`}
                                                                                    onClick={() => item.type === 'image' && setExpandedMedia(item.url)}
                                                                                >
                                                                                    {item.type === 'image' ? (
                                                                                        <>
                                                                                            <img src={item.url} alt={item.name || 'Update image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                                <div className="bg-white/90 p-2 rounded-full text-primary transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                                                                    <Maximize2 className="w-5 h-5" />
                                                                                                </div>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <div className="w-full h-full relative">
                                                                                            <video
                                                                                                src={item.url}
                                                                                                className="w-full h-full object-cover"
                                                                                                controls
                                                                                                playsInline
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-20 text-center">
                                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <h3 className="text-lg font-medium text-contrast">No updates found</h3>
                                                    <p className="text-secondary mt-2">No documentation or progress updates have been recorded for this project yet.</p>
                                                </div>
                                            )}

                                            {/* Back Button in Updates View */}
                                            <div className="mt-16 pt-12 border-t border-gray-100 flex justify-center">
                                                <button
                                                    onClick={() => { setSelectedId(null); setActiveProjectView('details'); }}
                                                    className="group flex items-center gap-3 px-8 py-4 bg-surface hover:bg-white text-secondary hover:text-primary rounded-2xl border border-gray-100 transition-all font-mono text-sm uppercase tracking-widest shadow-sm hover:shadow-md"
                                                >
                                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                    Back to Projects
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-screen">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-secondary font-mono text-xs">LOADING PROJECT DATA...</p>
                                <button onClick={() => setSelectedId(null)} className="mt-4 text-primary text-sm font-mono">CANCEL</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                    {data?.projects?.map((project, index) => (
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

                                        <div className="flex flex-col gap-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[200px]">
                                            <button
                                                onClick={() => { setSelectedId(project.id); setActiveProjectView('details'); }}
                                                className="w-full bg-white text-black px-6 py-2 font-mono font-bold uppercase hover:bg-primary hover:text-white transition-colors"
                                            >
                                                View Project
                                            </button>
                                            <button
                                                disabled
                                                className="w-full bg-black/60 backdrop-blur-md text-white/50 border border-white/10 px-6 py-2 font-mono font-bold uppercase cursor-not-allowed text-center"
                                                title="Technical data pending..."
                                            >
                                                Schematics Pending
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Text Content (Preview) */}
                            <div className="w-full lg:w-2/5 space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className={`h-2 w-2 rounded-full ${project.operationalStatus === 'Completed' || project.status === 'Completed' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
                                        project.status === 'In Progress' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' :
                                            project.status === 'Concept' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' :
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
                                            <div className="text-sm font-medium">
                                                <EditableText
                                                    value={project.leadEngineer || 'TBD'}
                                                    onSave={(val) => onUpdateProject(project.id, 'leadEngineer', val)}
                                                    isAdmin={isAdmin}
                                                    label="Lead Engineer"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-mono text-gray-400 uppercase">Est. Completion</p>
                                            <div className="text-sm font-medium">
                                                <EditableText
                                                    value={project.estCompletion || 'TBD'}
                                                    onSave={(val) => onUpdateProject(project.id, 'estCompletion', val)}
                                                    isAdmin={isAdmin}
                                                    label="Completion Date"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setSelectedId(project.id); setActiveProjectView('details'); }}
                                    className="text-primary font-medium flex items-center gap-2 hover:gap-3 transition-all group-hover:text-primary-dark pt-2"
                                >
                                    View Project <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Media Lightbox */}
            {expandedMedia && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setExpandedMedia(null)}
                >
                    <button
                        onClick={() => setExpandedMedia(null)}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={expandedMedia}
                        alt="Expanded view"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default Projects;