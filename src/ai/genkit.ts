'use server';
/**
 * @fileOverview Centralized Genkit AI initialization.
 *
 * This file defines a single, shared 'ai' object that is configured with the
 * necessary plugins. All other parts of the application that need to interact
 * with the AI will import this object, ensuring a consistent and efficient
 * configuration.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// This 'ai' object will be the single entry point for all AI-related
// functionality in the application.
export const ai = genkit({
  plugins: [googleAI()],
});
