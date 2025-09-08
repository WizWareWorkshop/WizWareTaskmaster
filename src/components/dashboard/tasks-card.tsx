
"use client";

import { useState, useRef, useEffect } from "react";
import { useTaskContext } from "@/context/task-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wand2, Trash2, Edit, Pin, PinOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import TaskCreator from "./task-creator";
import type { Task } from "@/context/task-context";
import { ScrollArea } from "../ui/scroll-area";
import { getPrioritizedTasks } from "@/ai/client";
import { DateTimePicker } from "../ui/datetime-picker";

const TasksCard = () => {
  const { activeProject, updateTask, deleteTask, apiKey, setIsSettingsDialogOpen } = useTaskContext();
  const [isLoading, setIsLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const { toast } = useToast();
  const editingTaskRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editingTaskRef.current && !editingTaskRef.current.contains(event.target as Node)) {
        setEditingTaskId(null);
      }
    }
    if (editingTaskId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingTaskId]);

  if (!activeProject) return null;

  const { tasks, project } = activeProject;

  const handlePrioritize = async () => {
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
    const nonCompletedTasks = tasks.filter(t => !t.completed);
    const response = await getPrioritizedTasks(apiKey, {
        tasks: nonCompletedTasks,
        projectDeadline: project.deadline,
        projectDescription: project.description
    });
    setIsLoading(false);

    if (response.success && response.data) {
        const updatedTaskMap = new Map(response.data.map(t => [t.id, t]));
        tasks.forEach(originalTask => {
            const updatedTask = updatedTaskMap.get(originalTask.id);
            if (updatedTask) {
                updateTask(originalTask.id, {
                    ...updatedTask,
                    pinned: originalTask.pinned,
                });
            }
        })
      toast({
        title: "Tasks Re-Prioritized!",
        description: "AI has suggested new urgency and importance scores.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.error || "Could not prioritize tasks.",
      });
    }
  };
  
  const handleEditClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setEditingTaskId(prevId => (prevId === taskId ? null : taskId));
  };
  
  const handleInputChange = (taskId: string, field: keyof Task, value: any) => {
    let finalValue = value;
    
    if (['urgency', 'importance'].includes(field)) {
      finalValue = value === '' ? null : Number(value);
    }
    
    if ((field === 'startDate' || field === 'deadline') && value instanceof Date) {
        finalValue = value.toISOString();
    }
    
    updateTask(taskId, { [field]: finalValue });
  };
  
  const handlePinToggle = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      updateTask(task.id, { pinned: !task.pinned });
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; // Pinned tasks first
    const scoreA = (a.urgency || 0) + (a.importance || 0);
    const scoreB = (b.urgency || 0) + (b.importance || 0);
    if (scoreA !== scoreB) return scoreB - scoreA;
    if (a.deadline && b.deadline && isValid(parseISO(a.deadline)) && isValid(parseISO(b.deadline))) {
        return parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime();
    }
    if (a.deadline && isValid(parseISO(a.deadline))) return -1;
    if (b.deadline && isValid(parseISO(b.deadline))) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <Card className="bg-card/60 p-6 shadow-lg">
      <TaskCreator />
      <CardHeader className="p-0 mt-6 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-accent">Tasks</CardTitle>
          <CardDescription>Your project task list. Pin tasks to move them to the focus area above.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrioritize} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            AI Prioritize
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-6">
        <ScrollArea className="h-[450px] pr-4">
          <ul className="space-y-3">
            {sortedTasks.map((task) => {
              const isEditing = editingTaskId === task.id;

              return (
                <li
                  key={task.id}
                  ref={isEditing ? editingTaskRef : null}
                  onClick={() => !isEditing && setEditingTaskId(task.id)}
                  className={cn(`p-3 rounded-lg border-l-4 bg-background/50 transition-all`,
                    task.completed ? "border-green-700 opacity-60" : task.color,
                    isEditing ? "ring-2 ring-accent" : "cursor-pointer"
                  )}
                  style={{ borderLeftColor: task.completed ? 'hsl(140 70% 40%)' : task.color || 'hsl(var(--muted))' }}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(checked) => {
                        if (editingTaskId === task.id) {
                          setEditingTaskId(null);
                        }
                        updateTask(task.id, { completed: !!checked })
                      }}
                      className="mt-1"
                      aria-label={`Mark ${task.title} as complete`}
                    />
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="grid gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input placeholder="Task Title" value={task.title} onChange={(e) => handleInputChange(task.id, 'title', e.target.value)} />
                          <Textarea
                            placeholder="Task Description"
                            className="h-24 resize-y"
                            value={task.description || ''}
                            onChange={(e) => handleInputChange(task.id, 'description', e.target.value)}
                          />
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <Input type="number" min="0" max="10" value={task.urgency ?? ''} onChange={(e) => handleInputChange(task.id, 'urgency', e.target.value)} placeholder="Urgency" />
                            <Input type="number" min="0" max="10" value={task.importance ?? ''} onChange={(e=> handleInputChange(task.id, 'importance', e.target.value))} placeholder="Importance" />
                            <DateTimePicker date={task.startDate ? new Date(task.startDate) : undefined} setDate={(date) => handleInputChange(task.id, 'startDate', date)} />
                            <DateTimePicker date={task.deadline ? new Date(task.deadline) : undefined} setDate={(date) => handleInputChange(task.id, 'deadline', date)} />
                          </div>
                        </div>
                      ) : (
                        <div className={cn("grid gap-2", task.completed ? 'line-through' : '')}>
                          <div className="flex items-center gap-2">
                            {task.pinned && <Pin className="h-4 w-4 text-accent" />}
                            <label htmlFor={`task-${task.id}`} className={cn("font-medium leading-none", task.completed ? '' : 'cursor-pointer')}>
                                {task.title}
                            </label>
                          </div>
                          <ScrollArea className="max-h-24 rounded-md border bg-muted/30 p-2">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description || "No description provided."}</p>
                          </ScrollArea>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                            <p><span className="font-semibold text-muted-foreground">Urgency:</span> {task.urgency}/10</p>
                            <p><span className="font-semibold text-muted-foreground">Importance:</span> {task.importance}/10</p>
                            <p>
                              <span className="font-semibold text-primary">Start:</span> {task.startDate && isValid(parseISO(task.startDate)) ? format(parseISO(task.startDate), 'MMM d, h:mm a') : 'Not set'}
                            </p>
                            <p>
                              <span className="font-semibold text-accent">Due:</span> {task.deadline && isValid(parseISO(task.deadline)) ? format(parseISO(task.deadline), 'MMM d, h:mm a') : 'Not set'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                       <Button size="icon" variant="ghost" onClick={(e) => handlePinToggle(e, task)} disabled={task.completed}>
                         {task.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </Button>
                       <Button size="icon" variant="ghost" onClick={(e) => handleEditClick(e, task.id)} disabled={task.completed}>
                         <Edit className="h-4 w-4" />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive-foreground hover:bg-destructive" disabled={task.completed} onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                          <div className="flex flex-col gap-2 items-center">
                            <p>Are you sure?</p>
                            <Button variant="destructive" size="sm" onClick={() => deleteTask(task.id)}>Yes, delete</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
        {tasks.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No tasks yet. Add one above to get started!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TasksCard;
