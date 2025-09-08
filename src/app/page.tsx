'use client'

import Header from "@/components/dashboard/header";
import TasksCard from "@/components/dashboard/tasks-card";
import EisenhowerMatrix from "@/components/dashboard/eisenhower-matrix-chart";
import ResourcesCard from "@/components/dashboard/resources-card";
import TimelineView from "@/components/dashboard/timeline-view";
import PinnedTasksCard from "@/components/dashboard/current-tasks-card";

export default function Home() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
      <Header />
      <main className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        
        <div className="md:col-span-2 xl:col-span-4">
            <PinnedTasksCard />
        </div>

        <div className="md:col-span-2 xl:col-span-4">
            <TasksCard />
        </div>
        
        <div className="md:col-span-2 xl:col-span-4">
            <TimelineView />
        </div>
        
        <div className="md:col-span-2 xl:col-span-4">
          <EisenhowerMatrix />
        </div>

        <div className="md:col-span-2 xl:col-span-4">
            <ResourcesCard />
        </div>

      </main>
    </div>
  );
}
