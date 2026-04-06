'use client'

import { useState } from 'react'
import { Folder, Plus, Search, MoreVertical, Calendar, Users, Eye } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  members: number
  views: number
  status: 'active' | 'paused' | 'archived'
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Q1 2024 Campaign',
    description: 'Spring product launch campaign',
    createdAt: '2024-01-15',
    members: 5,
    views: 324,
    status: 'active',
  },
  {
    id: '2',
    name: 'Summer Sale Push',
    description: 'Seasonal promotion for summer products',
    createdAt: '2024-02-20',
    members: 3,
    views: 156,
    status: 'active',
  },
  {
    id: '3',
    name: 'Black Friday Prep',
    description: 'Preparing for Black Friday 2024',
    createdAt: '2023-11-10',
    members: 8,
    views: 892,
    status: 'paused',
  },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  })

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      const project: Project = {
        id: String(Date.now()),
        name: newProject.name,
        description: newProject.description,
        createdAt: new Date().toISOString().split('T')[0],
        members: 1,
        views: 0,
        status: 'active',
      }
      setProjects([project, ...projects])
      setNewProject({ name: '', description: '' })
      setIsCreateModalOpen(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success'
      case 'paused':
        return 'bg-warning/10 text-warning'
      case 'archived':
        return 'bg-text-tertiary/10 text-text-tertiary'
      default:
        return 'bg-info/10 text-info'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Folder size={32} />
            Projects
          </h1>
          <p className="text-text-secondary mt-2">
            Yaratuvchi proyektlarini yaratish va boshqarish
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="p-6 rounded-lg border border-border bg-surface-2 hover:border-border-hover transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">{project.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm mb-4">{project.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-text-tertiary">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      {project.members} members
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye size={16} />
                      {project.views} views
                    </div>
                  </div>
                </div>

                <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-3 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 border border-border rounded-lg text-text-primary font-medium hover:bg-surface-3 transition-colors text-sm">
                  View Details
                </button>
                <button className="flex-1 px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90 transition-all text-sm">
                  Edit Project
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-lg border border-border bg-surface-2">
          <Folder size={48} className="text-text-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-text-tertiary mb-2">
            {searchQuery ? 'Hech qanday proyekt topilmadi' : 'Hozircha proyektlar yo\'q'}
          </p>
          {!searchQuery && (
            <p className="text-text-secondary text-sm mb-4">
              Yangi proyekt yaratish uchun yuqorida "New Project" tugmasini bosing
            </p>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">Create New Project</h2>
              <p className="text-text-secondary text-sm mt-1">Yangi proyekt yaratish</p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q1 2024 Campaign"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Proyekt haqida qisqacha ma'lumot"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  newProject.name.trim()
                    ? 'bg-text-primary text-surface hover:opacity-90'
                    : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
                }`}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
