
/*
 * ==============================================================================
 * DISABLED FOR STATIC EXPORT
 * ==============================================================================
 * The entire content of this file has been commented out to allow the project
 * to be exported as a static site, which is required for deployment on
 * GitHub Pages.
 *
 * The original code used Next.js Server Actions ('use server'), which are
 * not compatible with a static build (`output: 'export'`). The AI-powered
 * features that relied on these server actions will be disabled until a
 * new implementation that is compatible with static sites is developed.
 * ==============================================================================
 */

// 'use server';
// /**
//  * @fileOverview Server actions for AI-powered features.
//  * This file implements the server-side logic for interacting with the Genkit
//  * AI flows. It provides functions to generate tasks, prioritize tasks, and
// * find relevant resources based on project context. All functions in this file
//  * use a shared, configured 'ai' object from '@ai/genkit'.
//  */
// import {
//   GenerateTaskInputSchema,
//   GenerateTasksOutputSchema,
//   GenerateTaskOutputSchema,
//   PrioritizeTasksInputSchema,
//   PrioritizeTasksOutputSchema,
//   GenerateResourcesInputSchema,
//   GenerateResourcesOutputSchema,
//   type GenerateTaskInput,
//   type GenerateTaskOutput,
//   type GenerateTasksOutput,
//   type PrioritizeTasksInput,
//   type PrioritizeTasksOutput,
//   type GenerateResourcesInput,
//   type GenerateResourcesOutput,
// } from '@/ai/schemas/task-schemas';
// import { ai } from '@/ai/genkit';
// import { googleAI } from '@genkit-ai/googleai';
// import { configureGenkit } from 'genkit';
//
// /**
//  * Executes a Genkit operation with a temporary, user-provided API key.
//  * This function dynamically configures Genkit for a single operation and then
//  * reverts to the default configuration.
//  * @param apiKey The user's Google AI API key.
//  * @param fn The asynchronous Genkit function to execute.
//  * @returns A promise that resolves with the success status, data, or an error message.
//  */
// async function runWithApiKey<T>(apiKey: string, fn: () => Promise<T>): Promise<{ success: boolean; data?: T; error?: string }> {
//   if (!apiKey) {
//     return { success: false, error: 'API key is missing.' };
//   }
//   try {
//     configureGenkit({
//       plugins: [googleAI({ apiKey })],
//     });
//     const data = await fn();
//     return { success: true, data };
//   } catch (error) {
//     console.error('AI Operation Error:', error);
//     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the AI operation.';
//     return { success: false, error: errorMessage };
//   } finally {
//     // Revert to the default, server-configured Genkit instance.
//     configureGenkit({
//       plugins: [googleAI()],
//     });
//   }
// }
//
// // Define the prompt for prioritizing tasks.
// const prioritizeTasksPrompt = ai.definePrompt({
//   name: 'prioritizeTasksPrompt',
//   input: { schema: PrioritizeTasksInputSchema },
//   output: { schema: PrioritizeTasksOutputSchema },
//   model: googleAI.model('gemini-1.5-flash-latest'),
//   prompt: `You are an expert project manager. Your task is to re-evaluate a list of tasks based on a project's goals and deadlines.
//
// The current date is: {{{currentDate}}}
//
// CRITICAL RULE: ALL dates you output for 'startDate' and 'deadline' MUST be in the future (i.e., after {{{currentDate}}}). This is non-negotiable.
// CRITICAL RULE 2: Do NOT modify the 'pinned' status of any task. Return the tasks without the 'pinned' field.
//
// SPECIFIC INSTRUCTIONS:
// 1.  **Handle Overdue Tasks**: If any task's 'deadline' is before the 'currentDate', it is overdue. You MUST assign it a new, realistic 'startDate' and 'deadline' that are both in the future and before the 'projectDeadline'.
// 2.  **Actionable Descriptions**: Rewrite task 'description' fields to be clear, step-by-step action plans. Each step MUST be on a new line. For example: '1. First step.\\n2. Second step.\\n3. Third step.'. If you change a task's timeline, add a note like "AI Re-evaluation: Deadline updated. 1. Review original plan. 2. ...".
// 3.  **Adjust Urgency/Importance**: Modify 'urgency' and 'importance' scores to reflect the new project priorities and timelines. Higher urgency means it needs to be done sooner. Higher importance means bigger project impact.
// 4.  **Consider All Context**: Base your decisions on the 'projectDescription', the 'projectDeadline', and the relationships between all tasks provided.
//
// Project Description: {{{projectDescription}}}
// Project Deadline: {{{projectDeadline}}}
//
// Tasks to process:
// {{#each tasks}}
// - Task ID: {{id}}
//   Title: {{title}}
//   Description: {{description}}
//   Current Urgency: {{urgency}}
//   Current Importance: {{importance}}
//   Current Start Date: {{startDate}}
//   Current Deadline: {{deadline}}
//   Completed: {{completed}}
//   Pinned: {{pinned}}
// {{/each}}
//
// Return the full list of tasks with potentially adjusted properties. Maintain the original ID and other properties for each task unless adjustment is necessary according to the rules above.
// `,
// });
//
// /**
//  * Server action to get a list of prioritized tasks from the AI.
//  * @param apiKey User's Google AI API key.
//  * @param input The project data and tasks to prioritize.
//  * @returns An object with the success status and the prioritized tasks or an error.
//  */
// export async function getPrioritizedTasks(
//   apiKey: string,
//   input: Omit<PrioritizeTasksInput, 'currentDate'>
// ): Promise<{ success: boolean; data?: PrioritizeTasksOutput; error?: string }> {
//   return runWithApiKey(apiKey, async () => {
//     const fullInput = { ...input, currentDate: new Date().toISOString() };
//     const { output } = await prioritizeTasksPrompt(fullInput, { config: { temperature: 0.2 } });
//     if (!output) throw new Error('AI did not return any output.');
//     return output;
//   });
// }
//
//
// // Define the prompt for generating a single new task.
// const generateTaskPrompt = ai.definePrompt({
//   name: 'generateTaskPrompt',
//   input: { schema: GenerateTaskInputSchema },
//   output: { schema: GenerateTaskOutputSchema },
//   model: googleAI.model('gemini-1.5-flash-latest'),
//   prompt: `You are an expert project manager. Your goal is to either generate a new task or enhance a partially defined one.
//
// The current date is: {{{currentDate}}}
//
// CRITICAL RULE: The generated 'startDate' and 'deadline' for the task MUST be in the future (i.e., after {{{currentDate}}}). The deadline must also be before the overall project deadline. This is non-negotiable.
//
// SPECIFIC INSTRUCTIONS:
// 1.  **Action Plan Description**: The 'description' MUST be a detailed, step-by-step action plan. Each step MUST be on a new line. For example: '1. First step.\\n2. Second step.\\n3. Third step.'.
// 2.  **No Duplicates**: Do not create a task that is too similar to the existing task titles provided.
// 3.  **Enhance or Generate**:
//     {{#if partialTask}}
//     **Enhance Mode**: You have been given a partially completed task. Use the provided information as the source of truth. Your job is to fill in any missing fields and refine the existing ones based on the project context. Do not contradict the provided data.
//     - Provided Title: {{partialTask.title}}
//     - Provided Description: {{partialTask.description}}
//     - Provided Urgency: {{partialTask.urgency}}
//     - Provided Importance: {{partialTask.importance}}
//     - Provided Start Date: {{partial.startDate}}
//     - Provided Deadline: {{partialTask.deadline}}
//     - Provided Duration: {{partialTask.duration}}
//     {{else}}
//     **Generate Mode**: You are creating a new task from scratch. Based on the project description and deadline, create one new, relevant, and actionable task.
//     {{/if}}
//
// Project Description:
// {{{projectDescription}}}
//
// Project Deadline: {{{projectDeadline}}}
//
// Existing Task Titles:
// {{#each existingTasks}}
// - {{this}}
// {{/each}}
//
// Complete the task details below.
// `,
// });
//
// /**
//  * Server action to generate a single new task, potentially based on partial user input.
//  * @param apiKey User's Google AI API key.
//  * @param input The project context and any partial task data.
//  * @returns An object with the success status and the generated task or an error.
//  */
// export async function getGeneratedTask(
//   apiKey: string,
//   input: Omit<GenerateTaskInput, 'currentDate'>
// ): Promise<{ success: boolean; data?: GenerateTaskOutput; error?: string }> {
//   return runWithApiKey(apiKey, async () => {
//     const fullInput = { ...input, currentDate: new Date().toISOString() };
//     const { output } = await generateTaskPrompt(fullInput);
//     if (!output) throw new Error('AI did not return any output.');
//     return output;
//   });
// }
//
//
// // Define the prompt for generating a list of tasks.
// const generateTasksPrompt = ai.definePrompt({
//   name: 'generateTasksPrompt',
//   input: { schema: GenerateTaskInputSchema.omit({ partialTask: true }) },
//   output: { schema: TasksOutputSchema },
//   model: googleAI.model('gemini-1.5-flash-latest'),
//   prompt: `You are an expert project manager. Your goal is to break down a project into a list of actionable tasks.
//
// The current date is: {{{currentDate}}}
//
// CRITICAL RULE: ALL generated 'startDate' and 'deadline' for tasks MUST be in the future (i.e., after {{{currentDate}}}). The deadline must also be before the overall project deadline. This is non-negotiable.
//
// SPECIFIC INSTRUCTIONS:
// 1.  **Action Plan Description**: Each task's 'description' MUST be a detailed, step-by-step action plan. Each step MUST be on a new line. For example: '1. First step.\\n2. Second step.\\n3. Third step.'.
// 2.  **No Duplicates**: Do not create tasks that are too similar to the existing task titles provided.
// 3.  **Comprehensive Breakdown**: Analyze the project description and generate a list of 3-5 key tasks required to achieve the project goals. The tasks should be logical and cover different aspects of the project.
//
// Project Description:
// {{{projectDescription}}}
//
// Project Deadline: {{{projectDeadline}}}
//
// Existing Task Titles:
// {{#each existingTasks}}
// - {{this}}
// {{/each}}
//
// Generate a list of tasks.
// `,
// });
//
// /**
//  * Server action to generate a list of new tasks based on the project description.
//  * @param apiKey User's Google AI API key.
//  * @param input The project context.
//  * @returns An object with the success status and the list of generated tasks or an error.
//  */
// export async function getGeneratedTasks(
//   apiKey: string,
//   input: Omit<GenerateTaskInput, 'currentDate' | 'partialTask'>
// ): Promise<{ success: boolean; data?: GenerateTasksOutput; error?: string }> {
//   return runWithApiKey(apiKey, async () => {
//     const fullInput = { ...input, currentDate: new Date().toISOString() };
//     const { output } = await generateTasksPrompt(fullInput);
//     if (!output) throw new Error('AI did not return any output.');
//     return output;
//   });
// }
//
//
// // Define the prompt for generating helpful resources.
// const generateResourcesPrompt = ai.definePrompt({
//   name: 'generateResourcesPrompt',
//   input: { schema: GenerateResourcesInputSchema },
//   output: { schema: GenerateResourcesOutputSchema },
//   model: googleAI.model('gemini-1.5-flash-latest'),
//   prompt: `You are an expert researcher and project assistant. Your task is to find 3-4 highly relevant, high-quality online resources that are directly applicable to the user's goals.
//
// CONTEXT:
// - Overall Project Description: {{{projectDescription}}}
// - Overall Project Deadline: {{{projectDeadline}}}
//
// {{#if taskContext}}
// SPECIFIC TASK CONTEXT:
// Your primary goal is to find resources to help complete THIS SPECIFIC TASK. The overall project description is for broader context only.
// - Task Title: {{{taskContext.title}}}
// - Task Description: {{{taskContext.description}}}
// Deconstruct this task to identify the core subject, platform, and goal. Find resources that directly address these points.
// {{else}}
// SPECIFIC INSTRUCTIONS:
// Your goal is to find resources for the overall project described above. Deconstruct the project description to identify the main goal, subject, and technologies involved.
// {{/if}}
//
// CRITICAL RULE: Do NOT suggest generic resources. Every resource must be tailored to the specific technologies, platforms, or subjects mentioned in the context. For example, if the user mentions "Unreal Engine," only provide resources related to Unreal Engine.
//
// INSTRUCTIONS FOR ALL REQUESTS:
// 1.  **Analyze the Goal**: Deeply understand the user's request. Identify keywords, technologies (like 'Unreal Engine', 'Blender', 'C++'), and the intended outcome (e.g., 'make a trailer', 'write a proposal').
// 2.  **Find High-Quality Resources**: Prioritize official documentation, in-depth tutorials from respected creators, powerful tools, and insightful technical articles. Avoid basic, low-level blog posts.
// 3.  **Ensure Validity**: Double-check that all URLs are valid and lead to the correct resource.
// 4.  **Write Concise Summaries**: For each resource, write a compelling, one-sentence 'description' explaining *precisely why* this resource is useful for the user's specific goal. Be specific. Instead of "This is a good tutorial," write "This tutorial provides a step-by-step guide to achieving cinematic lighting in Unreal Engine 5."
//
// Generate a list of 3-4 relevant resources.
// `,
// });
//
// /**
//  * Server action to get a list of suggested resources from the AI.
//  * @param apiKey User's Google AI API key.
//  * @param input The project or task context for which to find resources.
//  * @returns An object with the success status and the list of resources or an error.
//  */
// export async function getGeneratedResources(
//   apiKey: string,
//   input: GenerateResourcesInput
// ): Promise<{ success: boolean; data?: GenerateResourcesOutput; error?: string }> {
//   return runWithApiKey(apiKey, async () => {
//     const { output } = await generateResourcesPrompt(input, { config: { temperature: 0.5 } });
//     if (!output) throw new Error('AI did not return any output.');
//     return output;
//   });
// }
