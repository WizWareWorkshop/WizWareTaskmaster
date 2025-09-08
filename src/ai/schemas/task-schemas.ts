
import { z } from 'zod';

/**
 * Defines the structure for a web resource suggested by the AI.
 */
export const ResourceSchema = z.object({
  title: z.string().describe("A concise title for the resource."),
  description: z.string().describe("A brief explanation of why this resource is useful."),
  link: z.string().url().describe("A valid URL to the resource."),
});

export type Resource = z.infer<typeof ResourceSchema>;

/**
 * Defines the complete structure for a single task within a project.
 */
export const TaskSchema = z.object({
  id: z.string().describe("The unique identifier for the task."),
  title: z.string().describe("The main goal of the task."),
  description: z.string().optional().describe("A more detailed description of the task."),
  completed: z.boolean().describe("Whether the task has been completed."),
  deadline: z.string().nullable().describe("The task's due date in ISO format."),
  startDate: z.string().nullable().describe("When work on the task should begin, in ISO format."),
  urgency: z.number().min(1).max(10).optional().describe("AI-evaluated urgency score (1-10)."),
  importance: z.number().min(1).max(10).optional().describe("AI-evaluated importance score (1-10)."),
  color: z.string().optional().describe("A color code associated with the task."),
  pinned: z.boolean().optional().describe("Whether the user has pinned the task."),
  lastPosition: z.object({ x: z.number(), y: z.number() }).optional().describe("The last known UI position."),
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * Schema for the initial brainstorming phase of task generation.
 * The AI will only generate a title and description.
 */
export const BrainstormedTaskSchema = z.object({
    title: z.string().describe("The main goal of the task."),
    description: z.string().optional().describe("A more detailed description of the task."),
});
export const BrainstormedTasksSchema = z.array(BrainstormedTaskSchema);

/**
 * Schema for the analysis phase of task generation.
 * The AI will evaluate the brainstormed task and add metrics.
 */
export const TaskAnalysisSchema = z.object({
    urgency: z.number().min(1).max(10).describe("AI-evaluated urgency score (1-10)."),
    importance: z.number().min(1).max(10).describe("AI-evaluated importance score (1-10)."),
    startDate: z.string().nullable().describe("The task's start date in ISO format."),
    deadline: z.string().nullable().describe("The task's due date in ISO format."),
});

/**
 * Defines the final output for a newly generated task, combining brainstorming and analysis.
 * This is what gets added to the user's project.
 */
export const GenerateTaskOutputSchema = BrainstormedTaskSchema.merge(TaskAnalysisSchema);
export type GenerateTaskOutput = z.infer<typeof GenerateTaskOutputSchema>;

export const GenerateTasksOutputSchema = z.array(GenerateTaskOutputSchema);
export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;
