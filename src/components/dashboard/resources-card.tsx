
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, ChevronDown, Loader2, Wand2 } from "lucide-react";
import { Button } from "../ui/button";
import { useTaskContext } from "@/context/task-context";
import { useToast } from "@/hooks/use-toast";
import { getGeneratedResources } from "@/app/actions";
import { useState } from "react";
import type { Resource, Task } from "@/ai/schemas/task-schemas";
import { Skeleton } from "../ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";


const SkeletonResourceCard = () => (
    <div className="rounded-lg p-4 bg-background/50 border border-border flex flex-col justify-between">
        <div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6 mb-3" />
        </div>
        <Skeleton className="h-5 w-28 mt-2" />
    </div>
);

const ResourcesCard = () => {
    const { activeProject, apiKey, setIsSettingsDialogOpen } = useTaskContext();
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [generationContext, setGenerationContext] = useState<string>("project");
    const { toast } = useToast();

    if (!activeProject) return null;

    const { project, tasks } = activeProject;

    const handleGenerateResources = async (task?: Task) => {
        if (!apiKey) {
            toast({
                variant: "destructive",
                title: "API Key Required",
                description: "Please set your Google AI API key in Settings to use this feature.",
            });
            setIsSettingsDialogOpen(true);
            return;
        }

        setIsLoading(true);
        setResources([]);
        setGenerationContext(task ? `task: ${task.title}` : 'project');

        const response = await getGeneratedResources(apiKey, {
            projectDescription: project.description,
            projectDeadline: project.deadline,
            taskContext: task ? { title: task.title, description: task.description || '' } : undefined,
        });
        setIsLoading(false);

        if (response.success && response.data) {
            setResources(response.data);
            toast({
                title: "Resources Generated!",
                description: `AI has found some resources for ${task ? `the task "${task.title}"` : "your project"}.`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Generation Failed",
                description: response.error || "Could not generate resources at this time.",
            });
        }
    };

    const cardTitle = () => {
        if(generationContext.startsWith('task:')) {
            const taskTitle = generationContext.replace('task: ', '');
            return `Resources for "${taskTitle.substring(0, 30)}${taskTitle.length > 30 ? '...' : ''}"`;
        }
        return "Essential Resources";
    }

  return (
    <Card className="bg-card/60 p-6 shadow-lg h-full">
      <CardHeader className="p-0 flex flex-row items-start justify-between">
        <div>
            <CardTitle className="text-lg font-semibold text-accent">{cardTitle()}</CardTitle>
            <CardDescription>AI-powered suggestions based on your chosen context.</CardDescription>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                    Generate Resources
                    <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleGenerateResources()}>
                    For Entire Project
                </DropdownMenuItem>
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        For a Specific Task...
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-0">
                        <ScrollArea className="h-72">
                         {tasks.map(task => (
                            <DropdownMenuItem key={task.id} onClick={() => handleGenerateResources(task)}>
                                {task.title}
                            </DropdownMenuItem>
                         ))}
                         {tasks.length === 0 && <DropdownMenuItem disabled>No tasks in project</DropdownMenuItem>}
                        </ScrollArea>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0 mt-6">
        <div className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 h-full",
            resources.length > 2 && "lg:grid-cols-3",
            resources.length > 3 && "lg:grid-cols-4",
            )}>
          {isLoading ? (
            <>
                <SkeletonResourceCard />
                <SkeletonResourceCard />
                <SkeletonResourceCard />
                <SkeletonResourceCard />
            </>
          ) : resources.length > 0 ? (
            resources.map((resource) => (
                <a 
                key={resource.link} 
                href={resource.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group rounded-lg p-4 bg-background/50 hover:bg-primary/10 transition-colors border border-border hover:border-primary/50 flex flex-col justify-between"
                >
                <div>
                    <h3 className="font-semibold text-foreground">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">{resource.description}</p>
                </div>
                <div className="text-sm font-semibold text-primary group-hover:text-accent flex items-center gap-1">
                    Visit Resource <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
                </a>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <Wand2 className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">Generate personalized resources</p>
                <p className="text-sm">Use the "Generate Resources" button to get AI-powered suggestions.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourcesCard;
