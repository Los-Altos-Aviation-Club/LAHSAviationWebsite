import React, { useState } from 'react';
import { ClubData, Project, Event } from '../types';
import { LogOut, Plus, Trash2, ChevronLeft, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, RefreshCw, Github, FolderPlus, Save, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ARCHIVE_REPO, ARCHIVE_GITHUB_API_BASE_URL, PROJECTS_BASE_PATH } from '../constants';

interface AdminPortalProps {
    data: ClubData;
    updateData: (newData: Partial<ClubData>) => void;
    isAdmin: boolean;
    setIsAdmin: (value: boolean) => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ data, updateData, isAdmin, setIsAdmin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'projects' | 'events' | 'settings'>('projects');
    const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('gh_pat') || '');
    const [initStatus, setInitStatus] = useState<Record<string, 'loading' | 'success' | 'error' | 'none'>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [saveError, setSaveError] = useState('');

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-');    // Replace multiple - with single -
    };

    const handleTokenChange = (token: string) => {
        setGithubToken(token);
        localStorage.setItem('gh_pat', token);
    };

    async function hashPassword(password: string) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    const handleSaveToGitHub = async () => {
        if (!githubToken) {
            alert('Please add a GitHub Personal Access Token in the Settings tab first.');
            setActiveTab('settings');
            return;
        }

        setSaveStatus('loading');
        setSaveError('');

        try {
            const headers = {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            };

            // 1. Get the current SHA of metadata.json from ARCHIVE
            const getRes = await fetch(`${ARCHIVE_GITHUB_API_BASE_URL}/metadata.json`, { headers });
            if (!getRes.ok) throw new Error('Failed to fetch metadata.json from Archive Repository');
            const fileData = await getRes.json();
            const currentSha = fileData.sha;

            // 2. Prepare the new content
            const content = btoa(JSON.stringify(data, null, 2));

            // 3. Update the file in ARCHIVE
            const updateRes = await fetch(`${ARCHIVE_GITHUB_API_BASE_URL}/metadata.json`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    message: `Update metadata.json from Admin Portal [${new Date().toISOString()}]`,
                    content: content,
                    sha: currentSha
                })
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                throw new Error(errorData.message || 'Failed to update metadata.json');
            }

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 5000);

        } catch (err: any) {
            console.error('Save error:', err);
            setSaveStatus('error');
            setSaveError(err.message || 'An unknown error occurred while saving.');
        }
    };

    const initializeArchiveFolders = async (project: Project) => {
        if (!githubToken) {
            alert('Please add a GitHub Personal Access Token in the Settings tab first.');
            setActiveTab('settings');
            return;
        }

        const slug = slugify(project.title);
        const date = new Date().toISOString().split('T')[0];
        const initialFolderPath = `${PROJECTS_BASE_PATH}/${slug}/${date}-Project-Initialized`;

        setInitStatus(prev => ({ ...prev, [project.id]: 'loading' }));

        try {
            const headers = {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            };

            const filesToCreate = [
                { path: `${PROJECTS_BASE_PATH}/${slug}/.gitkeep`, content: '' },
                { path: `${initialFolderPath}/desc.txt`, content: 'Project initialized.' }
            ];

            for (const file of filesToCreate) {
                // Check if file exists in ARCHIVE
                const checkRes = await fetch(`${ARCHIVE_GITHUB_API_BASE_URL}/${file.path}`, { headers });

                if (checkRes.status === 404) {
                    // Create placeholder file to "create" the folder in ARCHIVE
                    const content = btoa(file.content);

                    const createRes = await fetch(`${ARCHIVE_GITHUB_API_BASE_URL}/${file.path}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                            message: `Initialize project archive for ${slug}`,
                            content: content
                        })
                    });

                    if (!createRes.ok) throw new Error(`Failed to create ${file.path}`);
                }
            }

            setInitStatus(prev => ({ ...prev, [project.id]: 'success' }));
            setTimeout(() => {
                setInitStatus(prev => ({ ...prev, [project.id]: 'none' }));
            }, 3000);

        } catch (err) {
            console.error('Initialization error:', err);
            setInitStatus(prev => ({ ...prev, [project.id]: 'error' }));
            alert('Error initializing folders. Check console and verify your PAT permissions.');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setIsLoading(true);
        setError('');

        const adminHash = import.meta.env.VITE_ADMIN_HASH;

        if (!adminHash) {
            console.error('VITE_ADMIN_HASH is not defined in the environment.');
            setError('System configuration error: Hash missing.');
            setIsLoading(false);
            return;
        }

        try {
            const hashedInput = await hashPassword(password);

            // Simulate network verification delay for UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (hashedInput === adminHash) {
                setIsSuccess(true);
                setTimeout(() => {
                    setIsAdmin(true);
                    // Reset login state for next time
                    setIsSuccess(false);
                    setPassword('');
                    setIsLoading(false);
                }, 1000);
            } else {
                setError('Incorrect password');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Hashing error:', err);
            setError('An error occurred during verification.');
            setIsLoading(false);
        }
    };

    const handleDeleteProject = (id: string) => {
        updateData({ projects: data.projects.filter(p => p.id !== id) });
    };

    const handleAddProject = () => {
        const newProject: Project = {
            id: Date.now().toString(),
            title: 'New Project',
            description: 'Project description goes here.',
            status: 'In Progress',
            imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=2070&auto=format&fit=crop'
        };
        updateData({ projects: [...data.projects, newProject] });
    };

    const handleDeleteEvent = (id: string) => {
        updateData({ events: data.events.filter(e => e.id !== id) });
    };

    const handleAddEvent = () => {
        const newEvent: Event = {
            id: Date.now().toString(),
            title: 'New Event',
            date: new Date().toISOString().split('T')[0],
            time: '12:00',
            location: 'TBD',
            description: 'Event details here.'
        };
        updateData({ events: [...data.events, newEvent] });
    };

    // Login Screen
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-4">
                <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-2xl shadow-soft">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold text-contrast tracking-tight">Pilot Access</h1>
                        <p className="text-sm text-secondary mt-2">Please enter the flight command passkey.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                disabled={isLoading || isSuccess}
                                className={`w-full bg-surface border rounded-lg px-4 py-3 text-contrast placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-center ${error ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-primary/50'
                                    } ${isSuccess ? 'border-green-300 bg-green-50 text-green-700' : ''}`}
                            />
                        </div>

                        {/* Status Feedback Area */}
                        <div className="h-6 flex items-center justify-center">
                            {isLoading && !isSuccess && !error && (
                                <div className="flex items-center gap-2 text-secondary text-xs font-mono animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" /> VERIFYING CREDENTIALS...
                                </div>
                            )}
                            {isSuccess && (
                                <div className="flex items-center gap-2 text-green-600 text-xs font-mono font-bold animate-fade-in">
                                    <CheckCircle className="w-3 h-3" /> ACCESS GRANTED
                                </div>
                            )}
                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
                                    <AlertCircle className="w-3 h-3" /> {error}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isSuccess}
                            className={`w-full font-medium rounded-lg py-3 transition-all flex items-center justify-center gap-2 ${isSuccess
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                                : 'bg-contrast text-white hover:bg-black/90 shadow-lg shadow-gray-500/20'
                                } ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">Processing...</span>
                            ) : isSuccess ? (
                                <span className="flex items-center gap-2">Entering</span>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <Link to="/" className="text-secondary text-xs hover:text-primary transition-colors inline-flex items-center gap-1 group">
                                <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Home
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Dashboard
    return (
        <div className="min-h-screen bg-surface pt-28 px-6 pb-12">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-semibold text-contrast">Website Control</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSaveToGitHub}
                            disabled={saveStatus === 'loading'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${saveStatus === 'success' ? 'bg-green-500 text-white shadow-green-500/20' :
                                saveStatus === 'error' ? 'bg-red-500 text-white shadow-red-500/20' :
                                    'bg-primary text-white hover:bg-blue-600 shadow-primary/20'
                                } ${saveStatus === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {saveStatus === 'loading' ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Transmitting...</>
                            ) : saveStatus === 'success' ? (
                                <><CheckCircle className="w-4 h-4" /> Changes Saved</>
                            ) : saveStatus === 'error' ? (
                                <><AlertCircle className="w-4 h-4" /> Transmission Failed</>
                            ) : (
                                <><Send className="w-4 h-4" /> Save to GitHub</>
                            )}
                        </button>
                        <button
                            onClick={() => setIsAdmin(false)}
                            className="text-sm text-secondary hover:text-contrast flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" /> Sign out
                        </button>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-primary flex flex-col gap-3">
                    <div className="flex gap-2 items-start">
                        <div className="font-bold shrink-0">Centralized Data:</div>
                        <div>
                            All site data (projects, events, and content) is now managed through the <strong>Archive Repository</strong>. The local <code>metadata.json</code> is only used as a fallback.
                        </div>
                    </div>
                    <div className="flex gap-2 items-start">
                        <div className="font-bold shrink-0">Info:</div>
                        <div>
                            To edit website text (Hero titles, mission statements), simply <strong>Right-Click</strong> on the text directly on the website while logged in.
                        </div>
                    </div>
                    {saveStatus === 'error' && (
                        <div className="flex gap-2 items-start p-2 bg-red-50 border border-red-100 rounded text-red-800 text-xs animate-shake">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <div>
                                <strong>Save Error:</strong> {saveError}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 items-start p-2 bg-amber-50 border border-amber-100 rounded text-amber-800 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <div>
                            <strong>Critical Workflow:</strong> Changes made here are saved to your <strong>local session only</strong>. You must click the <strong>"Save to GitHub"</strong> button above to persist these changes permanently to the website.
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8 space-x-8 overflow-x-auto">
                    {(['projects', 'events', 'settings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap px-2 ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-secondary hover:text-contrast'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="space-y-8 animate-fade-in">

                    {/* Projects */}
                    {activeTab === 'projects' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button onClick={handleAddProject} className="bg-white hover:bg-gray-50 text-contrast border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                                    <Plus className="w-4 h-4" /> Add Project
                                </button>
                            </div>
                            {data.projects.map((project, index) => (
                                <div key={project.id} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row gap-6 shadow-sm">
                                    <div className="w-full md:w-48 h-32 flex-shrink-0 relative group">
                                        <img src={project.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 bg-black/20 rounded-xl transition-opacity">
                                            <ImageIcon className="text-white w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex-grow space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <textarea
                                                className="w-full bg-transparent text-xl font-medium text-contrast placeholder-gray-300 focus:outline-none resize-none"
                                                rows={1}
                                                value={project.title}
                                                onChange={(e) => {
                                                    const newProjects = [...data.projects];
                                                    newProjects[index].title = e.target.value;
                                                    updateData({ projects: newProjects });
                                                }}
                                                placeholder="Project Title"
                                            />
                                            <div className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
                                                ID: {slugify(project.title)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 p-2 rounded-lg">
                                            <ImageIcon className="w-4 h-4 shrink-0" />
                                            <input
                                                className="w-full bg-transparent text-xs text-secondary focus:outline-none"
                                                value={project.imageUrl || ''}
                                                onChange={(e) => {
                                                    const newProjects = [...data.projects];
                                                    newProjects[index].imageUrl = e.target.value;
                                                    updateData({ projects: newProjects });
                                                }}
                                                placeholder="Image URL (https://...)"
                                            />
                                        </div>
                                        <textarea
                                            className="w-full bg-transparent text-secondary text-sm focus:outline-none resize-y min-h-[5rem]"
                                            value={project.description}
                                            onChange={(e) => {
                                                const newProjects = [...data.projects];
                                                newProjects[index].description = e.target.value;
                                                updateData({ projects: newProjects });
                                            }}
                                            placeholder="Description"
                                        />
                                        <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                                            <p className="text-[10px] text-blue-700 font-medium flex items-center gap-1">
                                                <Github className="w-3 h-3" /> PROJECT ARCHIVE PATH:
                                            </p>
                                            <code className="text-[10px] text-blue-800 break-all">
                                                /{PROJECTS_BASE_PATH}/{slugify(project.title)}/
                                            </code>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                            <select
                                                className="bg-transparent text-xs text-secondary focus:outline-none cursor-pointer"
                                                value={project.status}
                                                onChange={(e) => {
                                                    const newProjects = [...data.projects];
                                                    newProjects[index].status = e.target.value as any;
                                                    updateData({ projects: newProjects });
                                                }}
                                            >
                                                <option value="Concept">Concept</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                            <button onClick={() => handleDeleteProject(project.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${initStatus[project.id] === 'success' ? 'bg-green-500' :
                                                    initStatus[project.id] === 'error' ? 'bg-red-500' :
                                                        initStatus[project.id] === 'loading' ? 'bg-yellow-500 animate-pulse' :
                                                            'bg-gray-300'
                                                    }`} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                                    {initStatus[project.id] === 'success' ? 'Archive Synced' :
                                                        initStatus[project.id] === 'error' ? 'Sync Failed' :
                                                            initStatus[project.id] === 'loading' ? 'Initializing...' :
                                                                'Archive Status Unknown'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => initializeArchiveFolders(project)}
                                                disabled={initStatus[project.id] === 'loading'}
                                                className="text-[10px] font-bold uppercase tracking-wider bg-surface hover:bg-gray-100 text-contrast px-3 py-1.5 rounded-md border border-gray-200 transition-colors flex items-center gap-1.5"
                                            >
                                                {initStatus[project.id] === 'loading' ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <FolderPlus className="w-3 h-3" />
                                                )}
                                                Initialize Archive
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Events */}
                    {activeTab === 'events' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button onClick={handleAddEvent} className="bg-white hover:bg-gray-50 text-contrast border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                                    <Plus className="w-4 h-4" /> Add Event
                                </button>
                            </div>
                            {data.events.map((event, index) => (
                                <div key={event.id} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <textarea
                                            className="bg-transparent text-lg font-medium text-contrast placeholder-gray-300 focus:outline-none w-full resize-none"
                                            rows={1}
                                            value={event.title}
                                            onChange={(e) => {
                                                const newEvents = [...data.events];
                                                newEvents[index].title = e.target.value;
                                                updateData({ events: newEvents });
                                            }}
                                            placeholder="Event Title"
                                        />
                                        <button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 hover:text-red-700 transition-colors shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="date"
                                            className="bg-gray-50 rounded px-3 py-2 text-sm text-secondary focus:outline-none"
                                            value={event.date}
                                            onChange={(e) => {
                                                const newEvents = [...data.events];
                                                newEvents[index].date = e.target.value;
                                                updateData({ events: newEvents });
                                            }}
                                        />
                                        <input
                                            type="time"
                                            className="bg-gray-50 rounded px-3 py-2 text-sm text-secondary focus:outline-none"
                                            value={event.time}
                                            onChange={(e) => {
                                                const newEvents = [...data.events];
                                                newEvents[index].time = e.target.value;
                                                updateData({ events: newEvents });
                                            }}
                                        />
                                    </div>

                                    <input
                                        className="bg-transparent text-sm text-secondary focus:outline-none border-b border-gray-100 pb-2"
                                        value={event.location}
                                        onChange={(e) => {
                                            const newEvents = [...data.events];
                                            newEvents[index].location = e.target.value;
                                            updateData({ events: newEvents });
                                        }}
                                        placeholder="Location"
                                    />
                                    <textarea
                                        className="bg-transparent text-sm text-secondary focus:outline-none resize-y min-h-[3rem]"
                                        value={event.description}
                                        onChange={(e) => {
                                            const newEvents = [...data.events];
                                            newEvents[index].description = e.target.value;
                                            updateData({ events: newEvents });
                                        }}
                                        placeholder="Brief Description"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Settings */}
                    {activeTab === 'settings' && (
                        <div className="max-w-xl space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-secondary uppercase tracking-wide">Google Calendar URL</label>
                                <input
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-contrast focus:outline-none focus:border-primary transition-colors shadow-sm"
                                    value={data.googleCalendarUrl}
                                    onChange={(e) => updateData({ googleCalendarUrl: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-secondary uppercase tracking-wide">Discord Invite URL</label>
                                <input
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-contrast focus:outline-none focus:border-primary transition-colors shadow-sm"
                                    value={data.discordUrl}
                                    onChange={(e) => updateData({ discordUrl: e.target.value })}
                                />
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-contrast mb-4 flex items-center gap-2">
                                    <Github className="w-4 h-4" /> External Content Strategy
                                </h3>
                                <div className="bg-surface rounded-xl p-6 border border-gray-100 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-contrast">Archive Repository (Single Source of Truth)</p>
                                            <p className="text-xs text-secondary mt-1">Currently linked to: <code className="bg-gray-100 px-1 rounded">{ARCHIVE_REPO}</code></p>
                                        </div>
                                        <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Active</div>
                                    </div>

                                    <div className="text-xs text-secondary leading-relaxed bg-white p-4 rounded-lg border border-gray-50">
                                        <p className="font-bold mb-2 flex items-center gap-1 text-primary">
                                            <RefreshCw className="w-3 h-3" /> Sync Instructions:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-2">
                                            <li>Create a folder for each update: <code className="text-primary">/projects/[project-slug]/YYYY-MM-DD-Title/</code></li>
                                            <li>Inside each update folder, add a <code className="text-primary">desc.txt</code> for the log text.</li>
                                            <li>Add images/videos to the same update folder for the gallery.</li>
                                        </ol>
                                    </div>

                                    <p className="text-[10px] text-gray-400 italic">
                                        Note: To change the repository, update the <code>ARCHIVE_REPO</code> constant in <code>constants.ts</code>.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-contrast mb-4 flex items-center gap-2">
                                    <Github className="w-4 h-4" /> Personal Access Token
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-xs text-secondary">
                                        Enter a GitHub Personal Access Token (PAT) with <code>repo</code> permissions to enable "Self-Healing" folder creation. This token is stored only in your browser's <code>localStorage</code>.
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            className="flex-grow bg-white border border-gray-200 rounded-lg p-3 text-sm text-contrast focus:outline-none focus:border-primary transition-colors shadow-sm"
                                            value={githubToken}
                                            onChange={(e) => handleTokenChange(e.target.value)}
                                            placeholder="ghp_xxxxxxxxxxxx"
                                        />
                                        {githubToken && (
                                            <button
                                                onClick={() => handleTokenChange('')}
                                                className="px-4 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AdminPortal;