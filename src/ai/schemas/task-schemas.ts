
import { z } from 'zod';

// Base schema for a single task, used for prioritization
const TaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task'),
  title: z.string().describe('The title of the task.'),
  description: z.string().describe('A brief description of the task.'),
  urgency: z
    .number()
    .min(0)
    .max(10)
    .describe('The urgency of the task from 0 to 10.'),
  importance: z
    .number()
    .min(0)
    .max(10)
    .describe('The importance of the task from 0 to 10.'),
  startDate: z
    .string()
    .optional()
    .describe('The start date of the task in ISO format.')
    .nullable(),
  deadline: z.string().describe('The due date of the task in ISO format.'),
  duration: z
    .number()
    .optional()
    .describe('The estimated duration in hours.')
    .nullable(),
  completed: z
    .boolean()
    .default(false)
    .describe('Whether the task is completed or not.'),
  color: z.string().optional().describe('The color associated with the task.'),
  pinned: z.boolean().optional().describe('Whether the user has pinned the task.'),
});

export type Task = z.infer<typeof TaskSchema>;

// Schema for prioritizing tasks
export const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of tasks to prioritize.'),
  projectDeadline: z.string().describe('The project deadline in ISO format.'),
  projectDescription: z
    .string()
    .describe('The overall description of the project goals.'),
  currentDate: z.string().describe('The current date in ISO format, for reference.'),
});

export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

export const PrioritizeTasksOutputSchema = z.array(TaskSchema.omit({pinned: true}));

export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;


// Schema for generating tasks
const PartialTaskSchema = z.object({
  title: z.string().optional().describe('The title of the task, if provided.'),
  description: z.string().optional().describe('The description of the task, if provided.'),
  urgency: z.coerce.number().optional().describe('The urgency of the task, if provided.'),
  importance: z.coerce.number().optional().describe('The importance of the task, if provided.'),
  startDate: z.string().optional().nullable().describe('The start date of the task, if provided.'),
  deadline: z.string().optional().nullable().describe('The deadline of the task, if provided.'),
  duration: z.coerce.number().optional().nullable().describe('The duration of the task, if provided.'),
});

export const GenerateTaskInputSchema = z.object({
  projectDescription: z.string().describe('The description of the project.'),
  projectDeadline: z.string().describe('The project deadline in ISO format.'),
  existingTasks: z.array(z.string()).describe('A list of titles of existing tasks to avoid duplication.'),
  currentDate: z.string().describe("The current date in ISO format, for reference."),
  partialTask: PartialTaskSchema.optional().nullable().describe('Partially entered task data to be completed or enhanced by the AI.'),
});

export type GenerateTaskInput = z.infer<typeof GenerateTaskInputSchema>;

const GeneratedTaskSchema = z.object({
  title: z.string().describe('The generated title of the task.'),
  description: z.string().describe('A detailed, step-by-step action plan for the task.'),
  urgency: z.number().min(0).max(10).describe('The estimated urgency of the task from 0 to 10.'),
  importance: z.number().min(0).max(10).describe('The estimated importance of the task from 0 to 10.'),
  startDate: z.string().optional().describe('An estimated start date for the task in ISO format.').nullable(),
  deadline: z.string().describe('An estimated due date for the task in ISO format, considering the project deadline.'),
  duration: z.number().optional().describe('An estimated duration in hours to complete the task.').nullable(),
});

export const GenerateTaskOutputSchema = GeneratedTaskSchema;
export const GenerateTasksOutputSchema = z.array(GeneratedTaskSchema);

export type GenerateTaskOutput = z.infer<typeof GenerateTaskOutputSchema>;
export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;

// Schema for generating resources
export const GenerateResourcesInputSchema = z.object({
  projectDescription: z.string().describe('The description of the project.'),
  projectDeadline: z.string().describe('The project deadline in ISO format.'),
  taskContext: z.object({
    title: z.string(),
    description: z.string(),
  }).optional().describe('The specific task to generate resources for.'),
});

export type GenerateResourcesInput = z.infer<typeof GenerateResourcesInputSchema>;

const ResourceSchema = z.object({
    title: z.string().describe("The title of the resource."),
    description: z.string().describe("A short, one-sentence summary of why the resource is useful for the project."),
    link: z.string().url().describe("A valid URL for the resource."),
});

export const GenerateResourcesOutputSchema = z.array(ResourceSchema);
export type GenerateResourcesOutput = z.infer<typeof GenerateResourcesOutputSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
