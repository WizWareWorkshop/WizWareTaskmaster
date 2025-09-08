
"use client";

import { useMemo, useState } from "react";
import Countdown from "./countdown";
import { Input } from "@/components/ui/input";
import { useTaskContext } from "@/context/task-context";
import { Label } from "@/components/ui/label";
import { Button } from "../ui/button";
import { Eraser, CheckCircle2, ListTodo, ChevronDown, Plus, Wand2, BookOpenCheck, Loader2, Trash2, Settings } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { getGeneratedTasks } from "@/ai/client";
import { useToast } from "@/hooks/use-toast";
import { DateTimePicker } from "../ui/datetime-picker";


const Header = () => {
  const { activeProject, setActiveProject, addProject, wipeData, deleteProject, updateActiveProject, addTasks, apiKey, setApiKey, setIsSettingsDialogOpen, isSettingsDialogOpen } = useTaskContext();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const { toast } = useToast();

  if (!activeProject) {
    // This can be a loading state or a fallback UI
    return <div>Loading project...</div>;
  }
  const { project, tasks } = activeProject;

  const handleDeadlineChange = (date: Date | undefined) => {
    if (date) {
        updateActiveProject({ deadline: date.toISOString() });
    }
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateActiveProject({ description: e.target.value });
  };

  const handleCreateNewProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName("");
      setIsNewProjectDialogOpen(false);
    }
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    setIsDeleteProjectDialogOpen(false);
    toast({
        title: "Project Deleted",
        description: `"${project.name}" has been deleted.`,
    });
  };

  const handleWipeData = () => {
    wipeData();
    setIsDeleteAllDialogOpen(false);
    toast({
        title: "All Data Wiped",
        description: "All your projects and tasks have been cleared.",
    });
  };

  const handleSaveSettings = () => {
      setApiKey(localApiKey);
      setIsSettingsDialogOpen(false);
      toast({
          title: "API Key Saved",
          description: "Your Google AI API Key has been securely stored in your browser.",
      });
  }

  const { overallProgress, completedTasks, totalTasks } = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return { overallProgress: 0, completedTasks: 0, totalTasks: 0 };
    
    const completed = tasks.filter(t => t.completed).length;
    const progress = (completed / total) * 100;
    
    return { overallProgress: progress, completedTasks: completed, totalTasks: total };
  }, [tasks]);

  const handleGenerateTasksFromDescription = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please set your Google AI API key in Settings before generating tasks.",
      });
      setIsSettingsDialogOpen(true);
      return;
    }
    setIsGenerating(true);
    const response = await getGeneratedTasks(apiKey, {
      projectDescription: project.description,
      projectDeadline: project.deadline,
      goal: project.description,
    });
    setIsGenerating(false);

    if (response.success && response.data) {
        addTasks(response.data);
        toast({
            title: "AI Tasks Generated!",
            description: `${response.data.length} new tasks have been added to your project.`,
        });
    } else {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: response.error || "Could not generate new tasks.",
      });
    }
  };
  
  return (
    <header className="flex flex-col gap-6 rounded-lg border border-border bg-card/60 p-6 shadow-lg">
      <div className="text-center">
        <a 
            href="https://wizware.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block"
        >
            <h1 className="text-2xl sm:text-3xl wiz-title transition-all duration-300 hover:drop-shadow-[0_0_8px_#7D55FF]">
                WizWare Taskmaster
            </h1>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Left Column: Project Info & Description */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0">
                <BookOpenCheck className="absolute bottom-0 right-[-2px] h-9 w-9 text-primary" />
                <Wand2 className="absolute -bottom-1 -left-1 h-8 w-8 -rotate-12 text-accent z-10" fill="currentColor" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tighter text-primary">
                  {project.name}
                </h2>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                        <span className="sr-only">Switch Project</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {activeProject.allProjects.map(p => (
                        <DropdownMenuItem key={p.id} onSelect={() => setActiveProject(p.id)}>
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setIsNewProjectDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setIsDeleteProjectDialogOpen(true)} className="text-destructive" disabled={activeProject.allProjects.length <= 1}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setIsDeleteAllDialogOpen(true)} className="text-destructive">
                          <Eraser className="mr-2 h-4 w-4" />
                          Delete All Projects
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
              <p className="text-sm text-muted-foreground">Current Project</p>
            </div>
             <Button variant="ghost" size="icon" onClick={() => setIsSettingsDialogOpen(true)}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
            </Button>
          </div>
          <div className="space-y-2 flex-grow flex flex-col">
             <div className="flex items-center justify-between">
                <Label htmlFor="project-description" className="text-xs uppercase tracking-wider text-muted-foreground">Project Description</Label>
                 <Button variant="outline" size="sm" onClick={handleGenerateTasksFromDescription} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                    {isGenerating ? 'Generating...' : 'Generate Tasks'}
                </Button>
             </div>
             <Textarea 
               id="project-description"
               value={project.description}
               onChange={handleDescriptionChange}
               placeholder="Describe your project goals here. The AI will use this to generate and prioritize tasks."
               className="bg-background/50 flex-grow"
             />
          </div>
        </div>

        {/* Right Column: Controls & Stats */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center justify-end gap-4 sm:flex-row">
            <div className="flex w-full flex-col sm:w-auto">
                <Label htmlFor="project-deadline" className="text-xs uppercase tracking-wider text-muted-foreground mb-1 text-center sm:text-left">Set Project Deadline</Label>
                <DateTimePicker 
                    date={new Date(project.deadline)}
                    setDate={handleDeadlineChange}
                />
            </div>
            <div className="w-full sm:w-auto">
              <Countdown />
            </div>
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4 h-full flex flex-col justify-center">
              <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-muted-foreground">Overall Completion</span>
                  <span className="font-semibold text-foreground">{overallProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" indicatorClassName="bg-gradient-to-r from-primary to-accent" />
              </div>
              <div className="flex justify-around text-center">
                  <div>
                      <div className="flex items-center gap-2 justify-center">
                          <CheckCircle2 className="text-green-500" />
                          <p className="text-2xl font-bold">{completedTasks}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                      <div className="flex items-center gap-2 justify-center">
                          <ListTodo className="text-blue-400" />
                          <p className="text-2xl font-bold">{totalTasks}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Total Tasks</p>
                  </div>
              </div>
          </div>
        </div>
      </div>

      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Project</DialogTitle>
            <DialogDescription>
              Give your new project a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-project-name" className="text-right">
                Name
              </Label>
              <Input
                id="new-project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
                placeholder="My Awesome New Project"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewProject()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateNewProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your application settings here. Your API key is stored securely in your browser's local storage and is never shared.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">
                Google AI API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
              <p className="text-sm text-muted-foreground">
                Get your key from{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent transition-colors">
                    Google AI Studio
                </a>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveSettings}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteProjectDialogOpen} onOpenChange={setIsDeleteProjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{project.name}" project and all its tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">Yes, delete project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL your projects and tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWipeData} className="bg-destructive hover:bg-destructive/90">Yes, wipe all data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};

export default Header;
