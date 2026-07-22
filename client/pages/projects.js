import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { projectService } from '../services/api';
import { FaPlus, FaSearch, FaFolder  } from 'react-icons/fa';
import AddProjectModal from '../components/project/AddProjectModal';
import ProjectCard from '../components/project/ProjectCard';
import ProjectsSkeleton from '../components/skeletons/ProjectsSkeleton';
import { useToast } from '../context/ToastContext';
import useSWR from 'swr';

const ProjectsPage = () => {
  const { projects, setProjects, userDetails, loading: globalLoading } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const canManageProjects = userDetails?.role === 'Admin' || userDetails?.role === 'Owner';

  // SWR-based projects overview query
  const { data: projectsData, error: fetchError, mutate } = useSWR(
    userDetails?._id ? '/projects/overview' : null,
    () => projectService.getProjectsOverview(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000 }
  );

  const loading = !projectsData && !fetchError;

  // Sync SWR projectsData with the global context to keep it in sync
  useEffect(() => {
    if (projectsData) {
      setProjects(projectsData);
    }
  }, [projectsData, setProjects]);

  // Filter projects based on search term
  const filteredProjects = (projects || []).filter(project =>
    project.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.Description && project.Description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddProject = async (projectData) => {
    try {
      const newProject = await projectService.addProject(projectData);
      
      // Optimistic cache update or mutate cache directly
      mutate(async (prev) => {
        if (!prev) return [newProject];
        return [...prev, newProject];
      }, { revalidate: true });

      showToast('Project added successfully!', 'success', 5000, {
        description: `Project "${newProject?.Name || projectData?.Name || ''}" has been created.`,
        action: {
          label: 'View',
          onClick: () => router.push(`/project/${newProject.ProjectID || newProject._id}`)
        }
      });
      return newProject;
    } catch (err) {
      if (err.status == 403) {
        showToast(err.message, 'warning');
      } else {
        showToast('Failed to add project', 'error');
      }
    }
  };

  // Auto-open Add Project modal if query param addProject=1 is present
  useEffect(() => {
    if (!router || !router.isReady) return;
    const shouldOpen = router.query?.addProject === '1';
    if (shouldOpen) {
      setIsAddProjectOpen(true);
      // Clean the URL without reloading the page
      const { pathname, query } = router;
      if (query.addProject) {
        const newQuery = { ...query };
        delete newQuery.addProject;
        router.replace({ pathname, query: newQuery }, undefined, { shallow: true });
      }
    }
  }, [router, router.isReady, router.query]);

  if (loading && (!projects || projects.length === 0)) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="mx-auto bg-white dark:bg-dark-bg text-gray-900 dark:text-white">
      {/* Page Header */}
      <div className="mb-4">
        {/* Search Bar */}
        <div className="flex items-center justify-between mt-4">
          <div className="relative max-w-2xl">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-card text-gray-900 dark:text-white"
            />
          </div>
          {userDetails && (
            <button
              onClick={() => setIsAddProjectOpen(true)}
              className={'flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'}
            >
              <FaPlus size={16} />
              New
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-bg">
          <FaFolder className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : canManageProjects
                ? 'Create your first project to get started'
                : 'You are not a member of any projects yet'
            }
          </p>
          {canManageProjects && !searchTerm && (
            <button
              onClick={() => setIsAddProjectOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white"
            >
              <FaPlus size={16} />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.ProjectID || project._id}
              project={project}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {canManageProjects && (
        <AddProjectModal
          isOpen={isAddProjectOpen}
          onClose={() => setIsAddProjectOpen(false)}
          onAddProject={handleAddProject}
          organizationId={userDetails?.organizationID}
          projectOwner={userDetails?._id}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
