
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Wand2 } from "lucide-react";
import { useTaskContext } from "@/context/task-context";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { getGeneratedTask } from "@/ai/client";
import type { GenerateTaskOutput } from "@/ai/schemas/task-schemas";
import { DateTimePicker } from "../ui/datetime-picker";

export interface OnTaskGenerated {
  data: GenerateTaskOutput;
  source: 'header' | 'task-creator';
}

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  urgency: z.coerce.number().min(0).max(10).default(5),
  importance: z.coerce.number().min(0).max(10).default(5),
  startDate: z.date().optional().nullable(),
  deadline: z.date().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const TaskCreator = () => {
  const { addTask, activeProject, apiKey, setIsSettingsDialogOpen } = useTaskContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      urgency: 5,
      importance: 5,
      startDate: null,
      deadline: null,
    },
  });
  
  const watchedFields = form.watch(['title', 'description']);
  const hasUserData = watchedFields.some(field => field && field.length > 0);

  const populateForm = (data: GenerateTaskOutput) => {
      form.setValue('title', data.title);
      form.setValue('description', data.description ?? '');
      form.setValue('urgency', data.urgency ?? 5);
      form.setValue('importance', data.importance ?? 5);
      form.setValue('startDate', data.startDate ? new Date(data.startDate) : null);
      form.setValue('deadline', data.deadline ? new Date(data.deadline) : null);
  }

  useEffect(() => {
    const handleTaskGenerated = (event: Event) => {
        const customEvent = event as CustomEvent<OnTaskGenerated>;
        const { data, source } = customEvent.detail;
        if (source === 'header') {
            populateForm(data);
            setIsOpen(true);
        }
    };

    window.addEventListener('onTaskGenerated', handleTaskGenerated);
    return () => {
        window.removeEventListener('onTaskGenerated', handleTaskGenerated);
    };
  }, [form]);


  if (!activeProject) return null;
  const { project, tasks } = activeProject;

  function onSubmit(values: TaskFormValues) {
    addTask({
      ...values,
      startDate: values.startDate ? values.startDate.toISOString() : null,
      deadline: values.deadline ? values.deadline.toISOString() : null,
    });
    toast({
      title: "Task Added!",
      description: `\"${values.title}\" has been added to your task list.`,
    });
    form.reset();
    setIsOpen(false);
  }

  const handleGenerateTask = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please set your Google AI API key in Settings to use this feature.",
      });
      setIsSettingsDialogOpen(true);
      return;
    }

    setIsGenerating(true);
    const partialTask = form.getValues();

    const response = await getGeneratedTask(apiKey, {
      projectDescription: project.description,
      projectDeadline: project.deadline,
      existingTasks: tasks.map(t => t.title),
      partialTask: {
        title: partialTask.title,
        description: partialTask.description,
        urgency: partialTask.urgency,
        importance: partialTask.importance,
        startDate: partialTask.startDate?.toISOString(),
        deadline: partialTask.deadline?.toISOString(),
      }
    });
    setIsGenerating(false);

    if (response.success && response.data) {
      populateForm(response.data);
      
      toast({
        title: hasUserData ? "Task Enhanced!" : "AI Task Generated!",
        description: `Task details have been filled in. Review and add the task.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: response.error || "Could not generate a new task.",
      });
    }
  };

  return (
    <Card className="bg-card/60 p-6 shadow-lg">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold text-accent">Create New Task</CardTitle>
                    <CardDescription>Add a new item to your project plan.</CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {isOpen ? "Collapse" : "Add Task"}
                        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <CardContent className="pt-6 px-0 pb-0">
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Task Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Design main character model" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Description / Action Plan</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Step 1: Gather references. Step 2: Block out the model..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="urgency"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Urgency (0-10)</FormLabel>
                                    <FormControl>
                                    <Input type="number" min="0" max="10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="importance"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Importance (0-10)</FormLabel>
                                    <FormControl>
                                    <Input type="number" min="0" max="10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Task Start Date</FormLabel>
                                    <FormControl>
                                      <DateTimePicker date={field.value ?? undefined} setDate={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deadline"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Task Deadline</FormLabel>
                                    <FormControl>
                                      <DateTimePicker date={field.value ?? undefined} setDate={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button type="button" onClick={handleGenerateTask} disabled={isGenerating} variant="outline">
                            <Wand2 className="mr-2" />
                            {isGenerating ? 'Working...' : (hasUserData ? 'Enhance with AI' : 'Generate with AI')}
                          </Button>
                          <Button type="submit">
                              <PlusCircle className="mr-2" />
                              Add Task
                          </Button>
                        </div>
                    </form>
                    </Form>
                </CardContent>
            </CollapsibleContent>
        </Collapsible>
    </Card>
  );
};

export default TaskCreator;
