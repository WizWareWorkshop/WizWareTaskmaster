
"use client";

import * as React from "react";
import { useTaskContext } from "@/context/task-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { format, parseISO, isPast, isValid, startOfMonth, endOfMonth, eachDayOfInterval, differenceInCalendarDays, addDays, isToday, startOfDay, endOfDay, isSameMonth, isAfter, addMilliseconds, differenceInMilliseconds } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, Wand2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/ai/schemas/task-schemas";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { getPrioritizedTasks } from "@/app/actions";
import { Rnd } from 'react-rnd';

const getQuadrant = (task: Pick<Task, 'urgency' | 'importance'>): number => {
    if ((task.urgency ?? 0) >= 5 && (task.importance ?? 0) >= 5) return 1; // Do
    if ((task.urgency ?? 0) < 5 && (task.importance ?? 0) >= 5) return 2; // Decide
    if ((task.urgency ?? 0) >= 5 && (task.importance ?? 0) < 5) return 3; // Delegate
    return 4; // Delete
};

const CurrentTimeIndicator = ({ containerHeight, monthStart, daysInMonthCount }: { containerHeight: number, monthStart: Date, daysInMonthCount: number }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const now = new Date();
            const start = startOfDay(now);
            const end = endOfDay(now);
            const total = end.getTime() - start.getTime();
            const current = now.getTime() - start.getTime();
            setProgress((current / total) * 100);
        };

        updateProgress();
        const timer = setInterval(updateProgress, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    const todayIndex = differenceInCalendarDays(new Date(), monthStart);
    if (todayIndex < 0 || todayIndex >= daysInMonthCount) return null;
    
    const leftPosition = `calc(${(todayIndex / daysInMonthCount) * 100}% + (${progress / daysInMonthCount}%))`;

    return (
        <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
                left: leftPosition,
                height: `${containerHeight}px`,
            }}
        >
            <div className="relative w-0.5 h-full bg-teal-400">
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-teal-400/50 flex items-center justify-center">
                   <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
            </div>
        </div>
    );
};


const TimelineView = () => {
    const { activeProject, updateTask, apiKey, setIsSettingsDialogOpen } = useTaskContext();
    const [reEvalTaskId, setReEvalTaskId] = useState<string | null>(null);
    const [isBulkReevaluating, setIsBulkReevaluating] = useState(false);
    const { toast } = useToast();
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [isClient, setIsClient] = useState(false);
    const [containerHeight, setContainerHeight] = useState(500);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dayWidthRef = useRef(48);
    const [taskLanes, setTaskLanes] = useState(new Map<string, number>());


    useEffect(() => {
        setIsClient(true);
    }, []);
    
    if (!activeProject) return null;
    
    const {project, tasks} = activeProject;

    const overdueTasks = useMemo(() => {
        return tasks.filter(task => 
            !task.completed && task.deadline && isValid(parseISO(task.deadline)) && isPast(parseISO(task.deadline))
        );
    }, [tasks]);
    
    const checkApiKey = () => {
      if (!apiKey) {
        toast({
          variant: "destructive",
          title: "API Key Required",
          description: "Please set your Google AI API key in Settings to use this feature.",
        });
        setIsSettingsDialogOpen(true);
        return false;
      }
      return true;
    }

    const handleReEvaluate = async (task: Task) => {
        if (!checkApiKey() || !apiKey) return;
        setReEvalTaskId(task.id);
         const response = await getPrioritizedTasks(apiKey, {
            tasks: [{...task, deadline: task.deadline || new Date().toISOString() }],
            projectDeadline: project.deadline,
            projectDescription: project.description
        });

        if (response.success && response.data && response.data.length > 0) {
            updateTask(task.id, response.data[0]);
            toast({
                title: "Task Re-evaluated!",
                description: `AI has updated plans for "${task.title}".`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: response.error || `Could not re-evaluate task "${task.title}".`,
            });
        }
        setReEvalTaskId(null);
    };

    const handleBulkReEvaluate = async () => {
        if (!checkApiKey() || !apiKey) return;
        setIsBulkReevaluating(true);
        const response = await getPrioritizedTasks(apiKey, {
            tasks: overdueTasks,
            projectDeadline: project.deadline,
            projectDescription: project.description
        });

        if (response.success && response.data) {
             response.data.forEach(updatedTask => {
                updateTask(updatedTask.id, updatedTask);
            });
            toast({
                title: "Tasks Re-evaluated!",
                description: `AI has updated plans for all overdue tasks.`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: response.error || "Could not re-evaluate overdue tasks.",
            });
        }
        setIsBulkReevaluating(false);
    }

    const { sortedTasksForTimeline, monthOptions, daysInMonth, monthStart } = useMemo(() => {
        const sorted = tasks
            .filter(task => task.deadline && isValid(parseISO(task.deadline)) && task.startDate && isValid(parseISO(task.startDate)))
            .sort((a, b) => {
                const startA = parseISO(a.startDate!).getTime();
                const startB = parseISO(b.startDate!).getTime();
                if(startA !== startB) return startA - startB;

                const quadrantA = getQuadrant(a);
                const quadrantB = getQuadrant(b);
                if (quadrantA !== quadrantB) return quadrantA - quadrantB;
                
                return (b.urgency ?? 0) + (b.importance ?? 0) - ((a.urgency ?? 0) + (a.importance ?? 0));
            });

        const options = new Map<string, number>();
        const allTaskDates = tasks.flatMap(t => [
            t.startDate && isValid(parseISO(t.startDate)) ? parseISO(t.startDate) : null,
            t.deadline && isValid(parseISO(t.deadline)) ? parseISO(t.deadline) : null
        ]).filter(Boolean) as Date[];

        if (allTaskDates.length > 0) {
            const earliestTaskDate = new Date(Math.min(...allTaskDates.map(d => d.getTime())));
            const latestTaskDate = new Date(Math.max(...allTaskDates.map(d => d.getTime())));

            let start = startOfMonth(earliestTaskDate);
            const end = startOfMonth(latestTaskDate);

            while (start <= end) {
                const monthKey = format(start, 'yyyy-MM');
                options.set(monthKey, 0);
                start = addDays(start, 32); 
                start = startOfMonth(start);
            }
        }
        
        tasks.forEach(task => {
            if (task.deadline && isValid(parseISO(task.deadline))) {
                const monthKey = format(startOfMonth(parseISO(task.deadline)), 'yyyy-MM');
                options.set(monthKey, (options.get(monthKey) || 0) + 1);
            }
        });
        
        const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM');
        if (!options.has(currentMonthKey)) options.set(currentMonthKey, 0);

        const sortedOptions = Array.from(options.keys()).sort().map(key => ([`${key}-01`, options.get(key) ?? 0]));

        const mStart = startOfMonth(currentMonth);
        const mEnd = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start: mStart, end: mEnd });

        return { 
            sortedTasksForTimeline: sorted,
            monthOptions: sortedOptions,
            daysInMonth: days,
            monthStart: mStart
        };

    }, [currentMonth, tasks]);
    
    useEffect(() => {
        const updateLayout = () => {
            if (scrollContainerRef.current) {
                const visibleTasks = sortedTasksForTimeline.filter(task => {
                  const taskStart = parseISO(task.startDate!);
                  const taskEnd = parseISO(task.deadline!);
                  const viewStart = startOfMonth(currentMonth);
                  const viewEnd = endOfMonth(currentMonth);
                  return (taskStart <= viewEnd && taskEnd >= viewStart);
                });

                const newLanes = new Map<number, Date>();
                const newTskLanes = new Map<string, number>();

                visibleTasks.forEach(task => {
                    const taskStart = parseISO(task.startDate!);
                    let assignedLane = -1;
                    
                    for (const [lane, endDate] of newLanes.entries()) {
                        if (taskStart >= endDate) {
                            assignedLane = lane;
                            break;
                        }
                    }

                    if (assignedLane === -1) {
                        assignedLane = newLanes.size;
                    }
                    
                    const taskEnd = parseISO(task.deadline!);
                    newLanes.set(assignedLane, taskEnd);
                    newTskLanes.set(task.id, assignedLane);
                });

                setTaskLanes(newTskLanes);
                
                const taskRowHeight = 52;
                const headerHeight = 60;
                const neededHeight = (newLanes.size > 0 ? newLanes.size * taskRowHeight : 100) + headerHeight;
                setContainerHeight(neededHeight);
            }
        };
        
        updateLayout();
        window.addEventListener('resize', updateLayout);
        
        const timeoutId = setTimeout(updateLayout, 100);

        return () => {
            window.removeEventListener('resize', updateLayout);
            clearTimeout(timeoutId);
        };
    }, [sortedTasksForTimeline, daysInMonth.length, currentMonth]);
    

    const pixelsToMs = useCallback((pixels: number) => {
        if (dayWidthRef.current === 0) return 0;
        const days = pixels / dayWidthRef.current;
        return days * 24 * 60 * 60 * 1000;
    }, []);

    const handleDragStop = useCallback((taskId: string, d: { x: number, y: number }) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.startDate || !task.deadline) return;

        const durationMs = differenceInMilliseconds(parseISO(task.deadline), parseISO(task.startDate));
        const startOffsetMs = pixelsToMs(d.x);

        const newStartDate = addMilliseconds(monthStart, startOffsetMs);
        const newDeadline = addMilliseconds(newStartDate, durationMs);
        
        updateTask(taskId, {
            startDate: newStartDate.toISOString(),
            deadline: newDeadline.toISOString(),
        });
    }, [tasks, monthStart, pixelsToMs, updateTask]);


    const handleResizeStop = useCallback((_e: any, _dir: any, ref: HTMLElement, _delta: any, position: { x: number, y: number }, taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.startDate || !task.deadline) return;

        const startOffsetMs = pixelsToMs(position.x);
        const newStartDate = addMilliseconds(monthStart, startOffsetMs);

        const newDurationMs = pixelsToMs(ref.offsetWidth);
        const newEndDate = addMilliseconds(newStartDate, newDurationMs);

        updateTask(taskId, {
            startDate: newStartDate.toISOString(),
            deadline: newEndDate.toISOString(),
        });

    }, [tasks, monthStart, pixelsToMs, updateTask]);
    
    if (!isClient) return <div className="h-[500px]" />;

    return (
        <Card className="bg-card/60 p-6 shadow-lg">
            <CardHeader className="p-0 mb-6 flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-lg font-semibold text-accent">Task Timeline</CardTitle>
                    <CardDescription>Drag to reschedule, resize to change duration. Dates update on drop.</CardDescription>
                </div>
                <div className="flex gap-2">
                    {overdueTasks.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleBulkReEvaluate} disabled={isBulkReevaluating}>
                             {isBulkReevaluating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                            Re-evaluate All Overdue ({overdueTasks.length})
                        </Button>
                    )}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {format(currentMonth, 'MMMM yyyy')}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <ScrollArea className="h-60">
                                {monthOptions.map(([monthKey, count]) => (
                                    <DropdownMenuItem key={monthKey} onSelect={() => setCurrentMonth(new Date(monthKey))}>
                                        <span className="flex-1">{format(new Date(monthKey), 'MMMM yyyy')}</span>
                                        <span className="text-xs text-muted-foreground ml-4">{Number(count) > 0 ? count : ''}</span>
                                    </DropdownMenuItem>
                                ))}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="max-h-[500px]" ref={scrollContainerRef}>
                    <div 
                        className="relative" 
                        style={{
                            width: `${daysInMonth.length * dayWidthRef.current}px`,
                            height: `${containerHeight}px`
                        }}
                    >
                        <div className="grid sticky top-0 z-10 bg-card/60 backdrop-blur-sm" style={{ gridTemplateColumns: `repeat(${daysInMonth.length}, ${dayWidthRef.current}px)` }}>
                            {daysInMonth.map((day, i) => (
                                <div key={i} className={cn("text-center border-r border-border py-2", isToday(day) && "bg-teal-400/10")}>
                                    <p className="text-[10px] text-muted-foreground">{format(day, 'EEE')}</p>
                                    <p className="text-base font-semibold">{format(day, 'd')}</p>
                                </div>
                            ))}
                        </div>

                        <div className="absolute top-[52px] bottom-0 left-0 right-0">
                            {sortedTasksForTimeline.map((task) => {
                                const taskLane = taskLanes.get(task.id);
                                if (taskLane === undefined) return null;

                                const taskStart = parseISO(task.startDate!);
                                const taskEnd = parseISO(task.deadline!);
                                const viewStart = monthStart;
                                const viewEnd = endOfMonth(currentMonth);

                                if (taskEnd < viewStart || taskStart > viewEnd) return null;

                                const clampedStart = taskStart < viewStart ? viewStart : taskStart;
                                const clampedEnd = taskEnd > viewEnd ? viewEnd : taskEnd;

                                if (!isAfter(clampedEnd, clampedStart)) return null;
                                
                                const startOffsetDays = differenceInCalendarDays(clampedStart, viewStart);
                                const durationDays = differenceInCalendarDays(clampedEnd, clampedStart);
                                
                                if (dayWidthRef.current === 0) return null; 

                                const left = startOffsetDays * dayWidthRef.current;
                                const width = (durationDays + 1) * dayWidthRef.current - 4; // -4 for gap
                                
                                if (width <= 0) return null;
                                const deadlineIsPast = isPast(taskEnd) && !task.completed;

                                return (
                                    <Rnd
                                        key={task.id}
                                        className={cn("rounded-lg flex items-center text-xs font-bold text-primary-foreground overflow-hidden group cursor-move z-30 border-2 border-transparent focus:border-accent focus:z-40", task.completed && "opacity-50")}
                                        style={{ backgroundColor: task.color || 'hsl(var(--primary))' }}
                                        bounds="parent"
                                        size={{ width, height: 36 }}
                                        position={{ x: left, y: taskLane * 52 }}
                                        onDragStop={(_e, d) => handleDragStop(task.id, d)}
                                        onResizeStop={(e, dir, ref, delta, position) => handleResizeStop(e, dir, ref, delta, position, task.id)}
                                        dragGrid={[dayWidthRef.current, 52]}
                                        resizeGrid={[dayWidthRef.current, 1]}
                                        minWidth={dayWidthRef.current - 4}
                                        enableResizing={{
                                            top:false, right:true, bottom:false, left:true,
                                            topRight:false, bottomRight:false, bottomLeft:false, topLeft:false
                                        }}
                                    >
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className="w-full h-full px-2 flex items-center">
                                                    <span className="whitespace-nowrap truncate">{task.title}</span>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 z-50">
                                                <div className="grid gap-4">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium leading-none" style={{color: task.color || 'hsl(var(--primary))'}}>{task.title}</h4>
                                                        <div className="text-sm text-muted-foreground space-y-1.5 whitespace-pre-wrap">
                                                            {task.description}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground pt-2">Start: {format(taskStart, 'MMM d, yyyy')}</p>
                                                        <p className="text-xs text-muted-foreground">Due: {format(taskEnd, 'MMM d, yyyy h:mm a')}</p>
                                                    </div>
                                                    {deadlineIsPast && (
                                                        <div className="mt-2 pt-2 border-t">
                                                            <p className="text-red-500 font-bold mb-2 text-xs flex items-center gap-1"><AlertCircle className="h-3 w-3" />This task is overdue!</p>
                                                            <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-auto py-1 px-2 text-xs"
                                                            onClick={() => handleReEvaluate(task)}
                                                            disabled={reEvalTaskId === task.id}
                                                            >
                                                                {reEvalTaskId === task.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Wand2 className="mr-2 h-3 w-3"/>}
                                                                AI Re-evaluate
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </Rnd>
                                );
                            })}
                        </div>
                        {isClient && isSameMonth(new Date(), currentMonth) && <CurrentTimeIndicator containerHeight={containerHeight} monthStart={monthStart} daysInMonthCount={daysInMonth.length} />}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default TimelineView;
