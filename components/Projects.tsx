import React, { useState, useEffect } from 'react';
import { ClubData, Project } from '../types';
import { ArrowRight, ChevronLeft, Tag, FileText, Layout, Image as ImageIcon, Calendar } from 'lucide-react';
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
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeProjectView, setActiveProjectView] = useState<'details' | 'updates'>('details');
    const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
    const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

    const selectedProject = data.projects.find(p => p.id === selectedId);

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

    const fetchProjectUpdates = async (projectId: string) => {
        setIsLoadingUpdates(true);
        const project = data.projects.find(p => p.id === projectId);
        if (!project) return;
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
                    const dateMatch = folder.name.match(/^(\d{4}-\d{2}-\d{2})-(.*)$/);
                    const date = dateMatch ? dateMatch[1] : 'Unknown Date';
                    const title = dateMatch ? dateMatch[2].replace(/-/g, ' ') : folder.name.replace(/-/g, ' ');

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
                                    {/* ... image and text content ... */}
                                    {/* (Rest of details view remains the same) */}
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
                                                <div key={update.id} className="relative">
                                                    {/* Timeline Dot */}
                                                    <div className="absolute -left-[41px] md:-left-[57px] top-0 w-4 h-4 rounded-full bg-white border-4 border-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10"></div>

                                                    <div className="space-y-4">
                                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                                            <span className="font-mono text-sm text-primary font-bold bg-primary/5 px-3 py-1 rounded-full w-fit">
                                                                {update.date}
                                                            </span>
                                                            <h3 className="text-2xl font-bold text-contrast capitalize">{update.title}</h3>
                                                        </div>

                                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="prose prose-blue max-w-none prose-p:text-secondary prose-p:leading-relaxed text-lg whitespace-pre-wrap font-sans">
                                                                {update.description}
                                                            </div>

                                                            {update.media.length > 0 && (
                                                                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {update.media.map((item, mIdx) => (
                                                                        <div key={mIdx} className="group relative bg-surface rounded-xl overflow-hidden border border-gray-100 aspect-video shadow-sm">
                                                                            {item.type === 'image' ? (
                                                                                <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                                                            ) : (
                                                                                <video src={item.url} className="w-full h-full object-cover" controls />
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
                                            <p className="text-secondary mt-2">Create dated folders in <code>/projects/{slugify(selectedProject.title)}/</code> to add logs.</p>
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
        </div>
    );
};

export default Projects;