"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTaskContext } from "@/context/task-context";
import { CheckCircle2, ListTodo } from "lucide-react";

const ProgressBarDisplay = ({ label, value, colorClass = "bg-primary" }: { label: string; value: number, colorClass?: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value.toFixed(0)}%</span>
    </div>
    <Progress value={value} className="h-2" indicatorClassName={colorClass} />
  </div>
);

const ProgressCard = () => {
  const { tasks } = useTaskContext();

  const { overallProgress, completedTasks, totalTasks } = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return { overallProgress: 0, completedTasks: 0, totalTasks: 0 };
    
    const completed = tasks.filter(t => t.completed).length;
    const progress = (completed / total) * 100;
    
    return { overallProgress: progress, completedTasks: completed, totalTasks: total };
  }, [tasks]);

  return (
    <Card className="bg-card/70 backdrop-blur-sm xl:col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-accent">Project Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProgressBarDisplay label="Overall Completion" value={overallProgress} colorClass="bg-gradient-to-r from-primary to-accent" />
        <div className="flex justify-around text-center">
            <div>
                <div className="flex items-center gap-2 justify-center">
                    <CheckCircle2 className="text-green-500" />
                    <p className="text-2xl font-bold">{completedTasks}</p>
                </div>
                <p className="text-xs text-muted-foreground">Completed</p>
            </div>
             <div>
                <div className="flex items-center gap-2 justify-center">
                    <ListTodo className="text-blue-400" />
                    <p className="text-2xl font-bold">{totalTasks}</p>
                </div>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
