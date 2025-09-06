
# WizWare Taskmaster: Your AI-Powered Task Management Dashboard

WizWare Taskmaster is a dynamic, client-side web application designed to help you manage and prioritize tasks for complex projects. It leverages the power of Google's Gemini AI to generate tasks, suggest priorities, and rewrite plans, all running securely in your browser.

## Core Features

-   **Dynamic Task Management**: Create, edit, delete, and manage all the tasks related to your project.
-   **AI-Powered Task Generation**: Describe your project, and the AI will generate a list of relevant tasks to get you started.
-   **AI-Powered Prioritization**: Let the AI analyze your tasks, project deadline, and goals to suggest urgency and importance scores based on the Eisenhower Matrix.
-   **Interactive Eisenhower Matrix**: Visualize your tasks on an Urgent/Important matrix and drag-and-drop them to instantly update their priorities.
-   **Interactive Timeline**: Reschedule tasks by dragging them on a monthly calendar, or change their duration by resizing them.
-   **Pinned Tasks**: Manually pin critical tasks to a dedicated focus area at the top of your dashboard.
-   **Client-Side & Secure**: All project data is stored in your browser's `localStorage`. Your data and your Google AI API key are never sent to a server.
-   **Static Site Ready**: Because it runs entirely on the client-side, this application is perfectly suited for hosting on static site platforms like GitHub Pages.

## How It Works

The application is built with Next.js and can be exported as a static site. It uses Google's Genkit framework to make client-side calls to the Gemini API.

To use the AI features, a user must provide their own **Google AI API Key**. This key is stored securely in their browser's `localStorage` and is used to make direct calls from their browser to the Google AI backend. This architecture ensures user data privacy and makes the application serverless.

## Getting Started & Deployment

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or later)
-   A [Google AI API Key](https://aistudio.google.com/app/apikey)

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/WizWareWorkshop/WizWareTaskmaster.git
cd WizWareTaskmaster
npm install
```

### 3. Running Locally

To run the development server:

```bash
npm run dev
```

Open [http://localhost:9002/WizWareTaskmaster](http://localhost:9002/WizWareTaskmaster) in your browser to see the result.

### 4. Building for Static Export

To create a static build suitable for GitHub Pages:

```bash
npm run build
```

This will create an `out` directory with all the static HTML, CSS, and JavaScript files needed to run the application.

### 5. Deploying to GitHub Pages

This project includes a GitHub Actions workflow that automates deployment to GitHub Pages.

1.  **Push to GitHub**: Push your code to the `main` branch of your GitHub repository. The workflow will automatically build and deploy your site.
2.  **Configure Repository Settings**:
    *   In your GitHub repository, go to **Settings > Pages**.
    *   Under "Build and deployment," set the **Source** to **GitHub Actions**.
3.  **View Your Site**: Once the action completes successfully, your site will be live at `https://wizwareworkshop.github.io/WizWareTaskmaster/`.

### 6. Using a Custom Domain (e.g., `wizware.org/taskmaster`)

To serve your project from a subpath on your custom domain, you need to have `wizware.org` already pointing to GitHub Pages. This is typically done by having a special repository named `WizWareWorkshop.github.io` with your custom domain configured in its settings.

If that is set up, GitHub automatically serves other repositories from your account as subpaths. For example, the `WizWareTaskmaster` repository will automatically be available at `wizware.org/WizWareTaskmaster`.

1.  **Main Domain Setup**: Ensure your `wizware.org` domain is correctly configured in the settings of your `WizWareWorkshop.github.io` repository.
2.  **Deploy This Project**: Follow the deployment steps above.
3.  **Access Your Site**: Once deployed, you should be able to access your site at `http://wizware.org/WizWareTaskmaster`.
