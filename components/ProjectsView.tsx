import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2, CheckCircle2, Circle, ChevronRight, ArrowLeft } from 'lucide-react';
import { Project, ProjectTask, ProjectMilestone, QuarterlyGoal, generateId } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  quarterlyGoals: QuarterlyGoal[];
  selectedProjectId?: string;
  onSave: (project: Project) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelectProject: (id: string) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  quarterlyGoals,
  selectedProjectId,
  onSave,
  onDelete,
  onSelectProject,
}) => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'on_hold'>('active');

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const createNewProject = (): Project => ({
    id: generateId(),
    title: '',
    description: '',
    status: 'active',
    milestones: [],
    tasks: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = async () => {
    if (!editingProject || !editingProject.title.trim()) {
      alert('Please enter a project title');
      return;
    }
    await onSave(editingProject);
    setEditingProject(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this project?')) {
      await onDelete(id);
      if (selectedProjectId === id) {
        onSelectProject('');
      }
    }
  };

  const getProgress = (project: Project) => {
    if (project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.completed).length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Project Detail View
  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        quarterlyGoals={quarterlyGoals}
        onSave={onSave}
        onBack={() => onSelectProject('')}
      />
    );
  }

  // Projects List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-amber-200 pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-amber-700" />
            Projects
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Track your projects and their tasks
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProject(createNewProject());
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors touch-manipulation"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['active', 'on_hold', 'completed', 'all'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation ${
              filter === status
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map(project => {
            const progress = getProgress(project);
            return (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="planner-card p-4 text-left hover:shadow-lg transition-shadow touch-manipulation"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">{project.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm opacity-60 line-clamp-2 mb-3">{project.description}</p>
                )}

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="opacity-60">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs opacity-50">
                    <span>{project.tasks.filter(t => t.completed).length}/{project.tasks.length} tasks</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Projects</h3>
          <p className="opacity-60 mb-6">
            {filter === 'all' ? 'Create your first project' : `No ${filter.replace('_', ' ')} projects`}
          </p>
          <button
            onClick={() => {
              setEditingProject(createNewProject());
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        </div>
      )}

      {/* New Project Modal */}
      {showForm && editingProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">New Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Project Title *</label>
                <input
                  type="text"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="Project name"
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Link to Goal</label>
                <select
                  value={editingProject.linkedGoalId || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, linkedGoalId: e.target.value || undefined })}
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                >
                  <option value="">No linked goal</option>
                  {quarterlyGoals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      Q{goal.rank}: {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Start Date</label>
                  <input
                    type="date"
                    value={editingProject.startDate || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Target Date</label>
                  <input
                    type="date"
                    value={editingProject.targetDate || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, targetDate: e.target.value })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingProject(null);
                }}
                className="px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Project Detail Component
const ProjectDetail: React.FC<{
  project: Project;
  quarterlyGoals: QuarterlyGoal[];
  onSave: (project: Project) => Promise<void>;
  onBack: () => void;
}> = ({ project, quarterlyGoals, onSave, onBack }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    const newTask: ProjectTask = {
      id: generateId(),
      title: newTaskTitle,
      completed: false,
    };
    await onSave({ ...project, tasks: [...project.tasks, newTask] });
    setNewTaskTitle('');
  };

  const toggleTask = async (taskId: string) => {
    const tasks = project.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed, completedDate: !t.completed ? new Date().toISOString() : undefined } : t
    );
    await onSave({ ...project, tasks });
  };

  const deleteTask = async (taskId: string) => {
    await onSave({ ...project, tasks: project.tasks.filter(t => t.id !== taskId) });
  };

  const updateStatus = async (status: Project['status']) => {
    await onSave({
      ...project,
      status,
      completedDate: status === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  const progress = project.tasks.length > 0
    ? Math.round((project.tasks.filter(t => t.completed).length / project.tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-amber-200 pb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation mt-1"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="opacity-70 mt-1">{project.description}</p>
          )}
        </div>

        <select
          value={project.status}
          onChange={(e) => updateStatus(e.target.value as Project['status'])}
          className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 font-medium"
        >
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Progress */}
      <div className="planner-card p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Progress</span>
          <span className="text-2xl font-bold text-amber-700">{progress}%</span>
        </div>
        <div className="h-4 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm opacity-60 mt-2">
          {project.tasks.filter(t => t.completed).length} of {project.tasks.length} tasks completed
        </div>
      </div>

      {/* Tasks */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Tasks</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 focus:border-amber-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <button
            onClick={addTask}
            className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
          >
            Add
          </button>
        </div>

        {project.tasks.length > 0 ? (
          <div className="space-y-2">
            {project.tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 group p-2 hover:bg-amber-50 rounded-lg">
                <button onClick={() => toggleTask(task.id)} className="touch-manipulation">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-amber-400" />
                  )}
                </button>
                <span className={`flex-1 ${task.completed ? 'line-through opacity-50' : ''}`}>
                  {task.title}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 opacity-50">No tasks yet</p>
        )}
      </div>

      {/* Notes */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Project Notes</h2>
        <textarea
          value={project.notes}
          onChange={(e) => onSave({ ...project, notes: e.target.value })}
          placeholder="Additional notes, ideas, links..."
          className="w-full min-h-[150px] bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-y"
        />
      </div>
    </div>
  );
};

export default ProjectsView;
