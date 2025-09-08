
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { 
  Task,
  TaskSchema,
  ResourceSchema,
  BrainstormedTaskSchema,
  BrainstormedTasksSchema,
  TaskAnalysisSchema,
  GenerateTaskOutput,
  GenerateTasksOutputSchema
} from '@/ai/schemas/task-schemas';
import { z } from 'zod';

// NOTE: This file runs entirely on the client-side.

const safeJsonParse = (jsonString: string) => {
  try {
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON object found.");
    const potentialJson = jsonString.substring(firstBrace, lastBrace + 1);
    return { success: true, data: JSON.parse(potentialJson) };
  } catch (error) {
    console.error("JSON Parsing Error:", error, "\nRaw string:", jsonString);
    return { success: false, error: "Failed to parse AI response as JSON." };
  }
};

const aiSystemInstruction: Part = {
    text: "You are an expert project manager. Your analysis must be critical, realistic, and align with the user's project goals. You will always return data in the exact JSON format requested, without any commentary or markdown."
  };

/**
 * A highly specialized internal function to analyze a single task idea.
 * It provides scores and dates based on a critical analysis.
 */
const getAnalyzedTaskMetrics = async (apiKey: string, genAI: GoogleGenerativeAI, context: {
    projectDescription: string;
    projectDeadline: string;
    task: { title: string; description?: string; };
}) => {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash-latest',
        systemInstruction: aiSystemInstruction
    });
    const currentDate = new Date().toISOString();

    const prompt = `
        You are analyzing a single task for a project.
        - Project: ${context.projectDescription}
        - Final Deadline: ${context.projectDeadline}
        - Today's Date: ${currentDate}

        Task to Analyze:
        - Title: ${context.task.title}
        - Description: ${context.task.description || 'N/A'}

        Your instructions:
        1.  **Analyze Urgency & Importance:** Critically evaluate the task on a 1-10 scale.
        2.  **Set Dates with Variety:** Based on your scores, define a 'startDate' and a 'deadline' in ISO format. Create variety and realism.
            - **Urgency -> Start Date:**
                - Urgency 8-10: Starts today.
                - Urgency 4-7: Starts within the next 3-7 days.
                - Urgency 1-3: Starts sometime after the next week.
            - **Complexity -> Duration:**
                - The duration between start and deadline should reflect the task's complexity (e.g., 'Design logo' takes days, 'Deploy to production' might take one day). Do not make all tasks last for a single day.
            - **Critical Rule:** 'startDate' MUST NOT be in the past. Today's date is ${currentDate}.
            - **Project Constraint:** All dates must be before the project deadline of ${context.projectDeadline}.
        
        Return a single JSON object with this exact schema: { urgency: number, importance: number, startDate: string, deadline: string }.
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = safeJsonParse(text);

        if (!parsed.success) return { success: false, error: parsed.error };

        const validation = TaskAnalysisSchema.safeParse(parsed.data);
        if (validation.success) {
            return { success: true, data: validation.data };
        } else {
            console.error('Zod Validation Error (Analysis):', validation.error);
            return { success: false, error: 'AI analysis response did not match format.' };
        }
    } catch (error: any) {
        console.error('getAnalyzedTaskMetrics Error:', error);
        return { success: false, error: error.message || 'An unknown error occurred during analysis.' };
    }
};


/**
 * Generates a list of suggested tasks using a two-step process: brainstorm then analyze.
 */
export const getGeneratedTasks = async (apiKey: string, context: {
  projectDescription: string;
  projectDeadline: string;
  goal: string;
}) => {
    if (!apiKey) return { success: false, error: "API key is not provided." };
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // 1. Brainstorm task ideas
    const brainstormPrompt = `
        You are a creative project assistant. A user wants to achieve a goal.
        - Project: ${context.projectDescription}
        - User's Goal: "${context.goal}"
        Break this goal down into a list of 5-7 concrete tasks. For each task, provide only a 'title' and a 'description'.
        Return a JSON object: { "tasks": [{ title: string, description: string }] }.
    `;

    let brainstormedTasks: z.infer<typeof BrainstormedTasksSchema>;
    try {
        const result = await model.generateContent(brainstormPrompt);
        const text = result.response.text();
        const parsed = safeJsonParse(text);

        if (!parsed.success) return { success: false, error: parsed.error };
        
        const validation = BrainstormedTasksSchema.safeParse(parsed.data.tasks);
        if (!validation.success) {
            console.error('Zod Validation Error (Brainstorming):', validation.error);
            return { success: false, error: 'AI brainstorming response did not match format.' };
        }
        brainstormedTasks = validation.data;
    } catch (error: any) {
        console.error('getGeneratedTasks Brainstorming Error:', error);
        return { success: false, error: error.message || 'An unknown error occurred during brainstorming.' };
    }

    // 2. Analyze each brainstormed task to get metrics
    const analyzedTasks: GenerateTaskOutput[] = [];
    for (const task of brainstormedTasks) {
        const analysisResult = await getAnalyzedTaskMetrics(apiKey, genAI, {
            ...context,
            task: task
        });

        if (analysisResult.success && analysisResult.data) {
            const combinedTask: GenerateTaskOutput = {
                title: task.title,
                description: task.description,
                urgency: analysisResult.data.urgency,
                importance: analysisResult.data.importance,
                startDate: analysisResult.data.startDate,
                deadline: analysisResult.data.deadline,
            };
            analyzedTasks.push(combinedTask);
        } else {
            // If analysis fails for one task, skip it or handle error
            console.warn(`Skipping task "${task.title}" due to analysis failure.`);
        }
    }

    // 3. Validate final combined output
    const finalValidation = GenerateTasksOutputSchema.safeParse(analyzedTasks);
    if (finalValidation.success) {
        return { success: true, data: finalValidation.data };
    } else {
        console.error('Final Zod Validation Error (Generated Tasks):', finalValidation.error);
        return { success: false, error: 'Combined task data is invalid.' };
    }
};


/**
 * Takes a user's partially defined task and completes it with AI using the analysis function.
 */
export const getGeneratedTask = async (apiKey: string, context: {
  projectDescription: string;
  projectDeadline: string;
  existingTasks: string[];
  partialTask: Partial<Omit<Task, 'id' | 'completed' | 'color'> & { duration?: number | null}>;
}) => {
    if (!apiKey) return { success: false, error: "API key is not provided." };
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const taskIdea = {
        title: context.partialTask.title || 'Untitled Task',
        description: context.partialTask.description || ''
    };

    const analysisResult = await getAnalyzedTaskMetrics(apiKey, genAI, {
        projectDescription: context.projectDescription,
        projectDeadline: context.projectDeadline,
        task: taskIdea
    });

    if (!analysisResult.success) {
        return { success: false, error: analysisResult.error }; // Return the error from the analysis function
    }

    if(analysisResult.data) {
        const finalTask: GenerateTaskOutput = {
            ...taskIdea,
            ...analysisResult.data,
            // Ensure title/description from original partial task are preserved if they existed
            title: context.partialTask.title || taskIdea.title,
            description: context.partialTask.description || taskIdea.description,
        };
        return { success: true, data: finalTask };
    }
    return { success: false, error: 'Could not generate task' };

    
};

/**
 * Re-evaluates a list of tasks, assigning urgency and importance scores.
 */
export const getPrioritizedTasks = async (apiKey: string, context: {
  tasks: Task[]; 
  projectDeadline: string;
  projectDescription: string;
}) => {
  if (!apiKey) return { success: false, error: "API key is not provided." };
  if (context.tasks.length === 0) return { success: true, data: [] };

  const genAI = new GoogleGenerativeAI(apiKey);
  const updatedTasks: Task[] = [];

  for (const task of context.tasks) {
      const analysisResult = await getAnalyzedTaskMetrics(apiKey, genAI, {
          projectDescription: context.projectDescription,
          projectDeadline: context.projectDeadline,
          task: { title: task.title, description: task.description }
      });

      if (analysisResult.success && analysisResult.data) {
          updatedTasks.push({ 
              ...task, // Preserve original ID, color, etc.
              ...analysisResult.data 
          });
      } else {
          console.warn(`Skipping task "${task.title}" during re-prioritization due to analysis failure.`);
          updatedTasks.push(task); // Keep the original task if analysis fails
      }
  }

  return { success: true, data: updatedTasks };
};


/**
 * Generates a list of web resources for a specific task or the whole project.
 */
export const getGeneratedResources = async (apiKey: string, context: {
  projectDescription: string;
  projectDeadline: string;
  taskContext?: { title: string; description?: string; };
}) => {
  if (!apiKey) return { success: false, error: "API key is not provided." };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash-latest',
    systemInstruction: aiSystemInstruction
  });

  const taskInfo = context.taskContext
    ? `I need help with the task: "${context.taskContext.title}". Description: "${context.taskContext.description || 'N/A'}"`
    : "I am looking for general resources for the entire project.";

  const prompt = `
    Find 5-7 relevant online resources (articles, tutorials, docs) for a project.
    - Project: ${context.projectDescription}
    - Focus: ${taskInfo}

    Return a JSON object: { "resources": [{ title: string, description: string, link: string }] }.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeJsonParse(text);

    if (!parsed.success) return { success: false, error: parsed.error };
    const validation = z.array(ResourceSchema).safeParse(parsed.data.resources);

    if (validation.success) {
      return { success: true, data: validation.data };
    } else {
      console.error('Zod Validation Error (Resources):', validation.error);
      return { success: false, error: 'AI response did not match the expected format.' };
    }
  } catch (error: any) {
    console.error('getGeneratedResources Error:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
};
