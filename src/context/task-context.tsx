
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Task as RawTask } from "@/ai/schemas/task-schemas";
import type { GenerateTaskOutput, GenerateTasksOutput } from '@/ai/schemas/task-schemas';
import { getPrioritizedTasks } from '@/ai/client';
import { useToast } from '@/hooks/use-toast';
import { isValid, parseISO } from 'date-fns';

// Allow deadline to be nullable to gracefully handle data inconsistencies
export interface Task extends Omit<RawTask, 'deadline' | 'startDate'> {
    startDate: string | null;
    deadline: string | null;
    pinned?: boolean;
    lastPosition?: { x: number, y: number };
}

const QUADRANT_COLORS = {
    q1: 'hsl(0 100% 50%)',   // Do: Urgent, Important (Red)
    q2: 'hsl(39 80% 53%)',    // Decide: Not Urgent, Important (Gold)
    q3: 'hsl(153 96% 49%)',  // Delegate: Urgent, Not Important (Teal)
    q4: 'hsl(259 89% 53%)',  // Delete: Not Urgent, Not Important (Purple)
};

const getQuadrant = (task: Pick<Task, 'urgency' | 'importance'>): keyof typeof QUADRANT_COLORS => {
    const urgency = task.urgency ?? 0;
    const importance = task.importance ?? 0;

    if (urgency > 5 && importance > 5) return 'q1';      // Urgent & Important
    if (urgency <= 5 && importance > 5) return 'q2';   // Not Urgent & Important
    if (urgency > 5 && importance <= 5) return 'q3';   // Urgent & Not Important
    return 'q4';                                      // Not Urgent & Not Important
};


interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  tasks: Task[];
}

interface ActiveProjectData {
  project: Project;
  tasks: Task[];
  allProjects: Project[];
}

interface TaskContextType {
  activeProject: ActiveProjectData | null;
  setActiveProject: (projectId: string) => void;
  addProject: (projectName: string) => void;
  deleteProject: (projectId: string) => void;
  updateActiveProject: (updatedProject: Partial<Omit<Project, 'tasks' | 'id'>>) => void;
  
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<GenerateTaskOutput, 'id' | 'completed' | 'color'>) => void;
  addTasks: (tasks: GenerateTasksOutput) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updatedTask: Partial<Task>) => void;
  
  getPrioritized: (tasksToProcess: Task[]) => Promise<boolean>;
  wipeData: () => void;
  
  apiKey: string | null;
  setApiKey: (key: string) => void;

  isSettingsDialogOpen: boolean;
  setIsSettingsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const createInitialProject = (): Project => {
    return {
        id: crypto.randomUUID(),
        name: "My First Project",
        description: "",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tasks: []
    };
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const { toast } = useToast();

   useEffect(() => {
    try {
        const savedProjects = localStorage.getItem('wizware_projects');
        const savedActiveProjectId = localStorage.getItem('wizware_activeProjectId');
        const savedApiKey = localStorage.getItem('wizware_apiKey');
        
        let loadedProjects: Project[] = [];
        if (savedProjects) {
            loadedProjects = JSON.parse(savedProjects);
        }

        if (loadedProjects.length > 0) {
            setProjects(loadedProjects);
            if (savedActiveProjectId && loadedProjects.some(p => p.id === savedActiveProjectId)) {
                setActiveProjectId(savedActiveProjectId);
            } else {
                setActiveProjectId(loadedProjects[0].id);
            }
        } else {
            const initialProject = createInitialProject();
            setProjects([initialProject]);
            setActiveProjectId(initialProject.id);
        }

        if (savedApiKey) {
            setApiKey(savedApiKey);
        }
    } catch (error) {
        console.error("Failed to load from localStorage", error);
        const initialProject = createInitialProject();
        setProjects([initialProject]);
        setActiveProjectId(initialProject.id);
    } finally {
        setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
        try {
            localStorage.setItem('wizware_projects', JSON.stringify(projects));
            if(activeProjectId) {
                localStorage.setItem('wizware_activeProjectId', activeProjectId);
            }
            if (apiKey) {
                localStorage.setItem('wizware_apiKey', apiKey);
            } else {
                localStorage.removeItem('wizware_apiKey');
            }
        } catch (error) {
            console.error("Failed to save to localStorage", error);
        }
    }
  }, [projects, activeProjectId, apiKey, isInitialLoad]);

  const updateProjects = (updateFn: (prevProjects: Project[]) => Project[]) => {
      setProjects(updateFn);
  };

  const addTask = useCallback((taskData: Omit<GenerateTaskOutput, 'id' | 'completed' | 'color'>) => {
    const newTask: Task = {
        ...taskData,
        startDate: taskData.startDate || null,
        deadline: taskData.deadline || null,
        id: crypto.randomUUID(),
        completed: false,
        pinned: false,
        color: QUADRANT_COLORS[getQuadrant(taskData)],
    };
    updateProjects(prev => prev.map(p => 
        p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
    ));
  }, [activeProjectId]);

  const addTasks = useCallback((tasksData: GenerateTasksOutput) => {
    const newTasks: Task[] = tasksData.map(taskData => ({
        ...taskData,
        startDate: taskData.startDate || null,
        deadline: taskData.deadline || null,
        id: crypto.randomUUID(),
        completed: false,
        pinned: false,
        color: QUADRANT_COLORS[getQuadrant(taskData)],
    }));
    updateProjects(prev => prev.map(p => 
        p.id === activeProjectId ? { ...p, tasks: [...p.tasks, ...newTasks] } : p
    ));
  }, [activeProjectId]);


  const deleteTask = useCallback((taskId: string) => {
    updateProjects(prev => prev.map(p => 
        p.id === activeProjectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
    ));
  }, [activeProjectId]);

  const updateTask = useCallback((taskId: string, updatedTaskData: Partial<Task>) => {
    updateProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            const updatedTasks = p.tasks.map(task => {
                if (task.id === taskId) {
                    const mergedTask = { ...task, ...updatedTaskData };
                    
                    if (mergedTask.deadline) {
                        const parsedDate = parseISO(mergedTask.deadline);
                         if (!isValid(parsedDate)) {
                            mergedTask.deadline = null; // Set to null if date is invalid
                        }
                    }
                    if (mergedTask.startDate) {
                        const parsedDate = parseISO(mergedTask.startDate);
                         if (!isValid(parsedDate)) {
                            mergedTask.startDate = null; // Set to null if date is invalid
                        }
                    }
                    
                    return { ...mergedTask, color: QUADRANT_COLORS[getQuadrant(mergedTask)] };
                }
                return task;
            });
            return { ...p, tasks: updatedTasks };
        }
        return p;
    }));
  }, [activeProjectId]);

  const setTasks = useCallback((newTasks: Task[] | ((prevTasks: Task[]) => Task[])) => {
     updateProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            const tasksToUpdate = typeof newTasks === 'function' ? newTasks(p.tasks) : newTasks;
            return { ...p, tasks: tasksToUpdate };
        }
        return p;
     }));
  }, [activeProjectId]);
  
  const addProject = (projectName: string) => {
    const newProject: Project = {
        id: crypto.randomUUID(),
        name: projectName,
        description: ``,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tasks: [],
    };
    const newProjects = [...projects, newProject];
    setProjects(newProjects);
    setActiveProjectId(newProject.id);
  };
  
  const deleteProject = (projectId: string) => {
    const remainingProjects = projects.filter(p => p.id !== projectId);

    if (remainingProjects.length > 0) {
        setProjects(remainingProjects);
        // If the active project was deleted, switch to the first remaining project
        if (activeProjectId === projectId) {
            setActiveProjectId(remainingProjects[0].id);
        }
    } else {
        // If no projects are left, create a new initial one
        wipeData();
    }
  };

  const updateActiveProject = (updatedProjectData: Partial<Omit<Project, 'tasks' | 'id'>>) => {
      updateProjects(prev => prev.map(p => 
        p.id === activeProjectId ? { ...p, ...updatedProjectData } : p
      ));
  };
  
  const getPrioritized = async (tasksToProcess: Task[]): Promise<boolean> => {
    if (!apiKey) return false;
    const active = projects.find(p => p.id === activeProjectId);
    if (!active || tasksToProcess.length === 0) return false;

    const response = await getPrioritizedTasks(apiKey, {
      tasks: tasksToProcess.map(t => ({...t, startDate: t.startDate, deadline: t.deadline || new Date().toISOString() })),
      projectDeadline: active.deadline,
      projectDescription: active.description,
    });
    
    if (response.success && response.data) {
        response.data.forEach(ut => {
          const originalTask = active.tasks.find(t => t.id === ut.id);
          const pinned = originalTask?.pinned || false;
          updateTask(ut.id, {...ut, pinned});
        });
        return true;
    }
    toast({
        variant: "destructive",
        title: "Prioritization Failed",
        description: response.error,
    })
    return false;
  };

  const wipeData = () => {
    try {
        localStorage.removeItem('wizware_projects');
        localStorage.removeItem('wizware_activeProjectId');
        localStorage.removeItem('wizware_apiKey');
        const initialProject = createInitialProject();
        setProjects([initialProject]);
        setActiveProjectId(initialProject.id);
        setApiKey(null);
    } catch (error) {
        console.error("Failed to wipe data", error);
    }
  }

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    try {
      if (key) {
        localStorage.setItem('wizware_apiKey', key);
      } else {
        localStorage.removeItem('wizware_apiKey');
      }
    } catch (error) {
      console.error("Failed to save API key to localStorage", error);
    }
  };

  const activeProject = useMemo(() => {
    if (!activeProjectId || projects.length === 0) return null;
    const project = projects.find(p => p.id === activeProjectId);
    if (!project) return null;
    return {
        project,
        tasks: project.tasks,
        allProjects: projects
    };
  }, [projects, activeProjectId]);

  if (isInitialLoad) {
    return (
        <div className="fixed inset-0 bg-background flex items-center justify-center">
            <p>Loading Project Dashboard...</p>
        </div>
    );
  }

  return (
    <TaskContext.Provider value={{ 
      activeProject,
      setActiveProject: setActiveProjectId,
      addProject,
      deleteProject,
      updateActiveProject,
      tasks: activeProject?.tasks || [],
      setTasks,
      addTask,
      addTasks,
      deleteTask,
      updateTask,
      getPrioritized,
      wipeData,
      apiKey,
      setApiKey: handleSetApiKey,
      isSettingsDialogOpen,
      setIsSettingsDialogOpen
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
