import React, { useState } from 'react';
import { ClubData, Project } from '../types';
import { ArrowRight, ChevronLeft, Tag } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface ProjectsProps {
  data: ClubData;
  isAdmin: boolean;
  onUpdateProject: (id: string, field: keyof Project | 'specs', value: any) => void;
}

const Projects: React.FC<ProjectsProps> = ({ data, isAdmin, onUpdateProject }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProject = data.projects.find(p => p.id === selectedId);

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
                        onClick={() => setSelectedId(null)}
                        className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-mono text-sm uppercase tracking-wider"
                    >
                        <ChevronLeft className="w-4 h-4" /> Return to Hangar
                    </button>
                    <div className="font-mono text-xs text-gray-400">PROJ-ID: {selectedProject.id}</div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Image Section */}
                        <div className="space-y-8">
                            <div className="rounded-3xl overflow-hidden shadow-2xl bg-gray-100 relative aspect-[4/3] group">
                                <EditableImage 
                                    src={selectedProject.imageUrl} 
                                    alt={selectedProject.title} 
                                    onSave={(val) => onUpdateProject(selectedProject.id, 'imageUrl', val)}
                                    isAdmin={isAdmin}
                                    className="w-full h-full"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none"></div>
                                <div className="absolute bottom-6 left-6 text-white font-mono text-xs pointer-events-none">
                                    FIG 1.1 - PROTOTYPE VISUALIZATION
                                </div>
                            </div>
                            
                            {/* Technical Grid (Editable Specs) */}
                            <div className="grid grid-cols-2 gap-4">
                                {selectedProject.specs && selectedProject.specs.map((spec, i) => (
                                    <div key={i} className="p-4 bg-surface rounded-xl border border-gray-100 flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg text-primary">
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <div className="w-full">
                                            <div className="text-xs text-secondary uppercase font-mono mb-1">
                                                <EditableText 
                                                    value={spec.label} 
                                                    onSave={(val) => updateSpec(selectedProject.id, i, 'label', val)}
                                                    isAdmin={isAdmin}
                                                    label="Spec Label"
                                                />
                                            </div>
                                            <div className="font-bold text-contrast">
                                                 <EditableText 
                                                    value={spec.value} 
                                                    onSave={(val) => updateSpec(selectedProject.id, i, 'value', val)}
                                                    isAdmin={isAdmin}
                                                    label="Spec Value"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isAdmin && selectedProject.specs && selectedProject.specs.length < 6 && (
                                    <button 
                                        onClick={() => {
                                            const newSpecs = [...(selectedProject.specs || []), { label: 'New Spec', value: 'Value' }];
                                            onUpdateProject(selectedProject.id, 'specs', newSpecs);
                                        }}
                                        className="p-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-sm text-secondary hover:border-primary hover:text-primary transition-colors"
                                    >
                                        + Add Spec
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-8">
                            <div>
                                <div className="inline-block px-3 py-1 mb-4 bg-primary/10 text-primary text-xs font-mono font-bold rounded uppercase tracking-widest">
                                    Status: {selectedProject.status}
                                </div>
                                <div className="text-5xl md:text-6xl font-bold text-contrast tracking-tight mb-6">
                                    <EditableText 
                                        value={selectedProject.title}
                                        onSave={(val) => onUpdateProject(selectedProject.id, 'title', val)}
                                        isAdmin={isAdmin}
                                        label="Project Title"
                                    />
                                </div>
                                <div className="text-xl text-secondary leading-relaxed font-light">
                                    <EditableText 
                                        value={selectedProject.description}
                                        onSave={(val) => onUpdateProject(selectedProject.id, 'description', val)}
                                        isAdmin={isAdmin}
                                        label="Description"
                                        multiline
                                    />
                                </div>
                            </div>

                            <div className="prose prose-lg text-secondary">
                                <h3 className="text-contrast font-bold">Project Overview</h3>
                                <p>
                                    This project represents a significant leap in our club's engineering capabilities. 
                                    Utilizing advanced composite materials and custom-designed avionics, the 
                                    <span className="font-semibold text-primary"> {selectedProject.title} </span> 
                                    aims to push the boundaries of what high school students can achieve.
                                </p>
                                <p>
                                    Key challenges include thermal management, structural integrity under high-G loads, 
                                    and real-time telemetry integration.
                                </p>
                            </div>
                            
                            <div className="pt-8 border-t border-gray-100">
                                <h4 className="font-mono text-sm uppercase text-gray-400 mb-4">Engineering Team</h4>
                                <div className="flex gap-2">
                                    {['A. Yeager', 'S. Pilot', 'J. Sky'].map((name, idx) => (
                                        <div key={idx} className="h-10 w-10 rounded-full bg-surface border border-white shadow-sm flex items-center justify-center text-xs font-bold text-secondary" title={name}>
                                            {name.split(' ')[1][0]}
                                        </div>
                                    ))}
                                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                        +5
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Header (Background for List View) */}
      <div className="bg-surface border-b border-gray-100 py-16 px-6">
        <div className="max-w-7xl mx-auto">
            <h2 className="text-sm font-mono text-primary mb-2 uppercase tracking-widest">/// Hangar Access</h2>
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
                    <span className={`h-2 w-2 rounded-full ${
                      project.status === 'Completed' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
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