
'use client';

import { useTaskContext } from "@/context/task-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
import { Pin, PinOff } from "lucide-react";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";

const getQuadrantInfo = (task: { urgency?: number | null; importance?: number | null; }) => {
    const urgency = task.urgency ?? 0;
    const importance = task.importance ?? 0;

    if (urgency >= 5 && importance >= 5) return { name: 'Urgent & Important', color: 'hsl(0 100% 50%)' }; // Do
    if (urgency < 5 && importance >= 5) return { name: 'Not Urgent & Important', color: 'hsl(39 80% 53%)' }; // Decide
    if (urgency >= 5 && importance < 5) return { name: 'Urgent & Not Important', color: 'hsl(153 96% 49%)' }; // Delegate
    return { name: 'Not Urgent & Not Important', color: 'hsl(259 89% 53%)' }; // Delete
};


const PinnedTasksCard = () => {
    const { activeProject, updateTask } = useTaskContext();

    const pinnedTasks = useMemo(() => {
        if (!activeProject) return [];
        const { tasks } = activeProject;
        return tasks.filter(task => task.pinned && !task.completed);
    }, [activeProject]);

    if (!activeProject) {
        return null;
    }
    
    return (
        <Card className="bg-card/60 p-6 shadow-lg">
            <CardHeader className="p-0">
                <CardTitle className="text-lg font-semibold text-accent flex items-center gap-2">
                    <Pin className="h-5 w-5"/>
                    Pinned Tasks
                </CardTitle>
                <CardDescription>Your hand-picked tasks to focus on. Pin tasks from the main list below.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-6">
                {pinnedTasks.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {pinnedTasks.map(task => {
                            const quadrant = getQuadrantInfo(task);
                            return (
                                <div key={task.id} className={cn("p-4 rounded-lg bg-background/50 border border-border flex flex-col gap-3 relative group", task.completed && "opacity-50")}>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => updateTask(task.id, { pinned: false })}
                                            disabled={task.completed}
                                        >
                                            <PinOff className="h-4 w-4" />
                                            <span className="sr-only">Unpin Task</span>
                                        </Button>
                                    </div>
                                    
                                   <div className="flex items-center gap-3 pr-8">
                                       <Checkbox
                                            id={`pinned-task-${task.id}`}
                                            checked={task.completed}
                                            onCheckedChange={(checked) => updateTask(task.id, { completed: !!checked })}
                                            aria-label={`Mark ${task.title} as complete`}
                                       />
                                       <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: quadrant.color }} />
                                       <h3 className={cn("font-bold text-base text-foreground truncate", task.completed && "line-through")}>{task.title}</h3>
                                   </div>

                                   <ScrollArea className="h-24 w-full rounded-md border bg-muted/30 p-2">
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description || "No description provided."}</p>
                                    </ScrollArea>

                                   <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-auto pt-3 border-t border-border">
                                        <div>
                                            <p className="font-semibold text-muted-foreground">Urgency</p>
                                            <p className="font-bold text-primary">{task.urgency}/10</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-muted-foreground">Importance</p>
                                            <p className="font-bold text-primary">{task.importance}/10</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-muted-foreground">Duration</p>
                                            <p>{task.duration ? `${task.duration} hr(s)` : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-muted-foreground">Due Date</p>
                                            {task.deadline && isValid(parseISO(task.deadline)) ? (
                                                <p className="font-semibold text-accent/90" title={format(parseISO(task.deadline), 'PPpp')}>
                                                    {formatDistanceToNow(parseISO(task.deadline), { addSuffix: true })}
                                                </p>
                                               ) : <p>Not set</p>}
                                        </div>
                                   </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                        <Pin className="mx-auto h-8 w-8 mb-2" />
                        <p className="font-semibold">No pinned tasks</p>
                        <p className="text-sm">Click the pin icon on a task in the list below to add it here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PinnedTasksCard;
