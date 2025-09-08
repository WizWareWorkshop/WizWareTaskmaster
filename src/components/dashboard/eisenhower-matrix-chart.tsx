
"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTaskContext } from "@/context/task-context";
import { cn } from "@/lib/utils";

// Define the types for the props passed to the custom shape component
interface CustomShapeProps {
  cx?: number;
  cy?: number;
  payload?: {
    id: string;
    z: string; // title
    fill: string;
  };
}

const EisenhowerMatrix = () => {
    const { activeProject, updateTask } = useTaskContext();
    const chartRef = useRef<HTMLDivElement>(null);
    const [draggingTask, setDraggingTask] = useState<string | null>(null);
    const [topTaskId, setTopTaskId] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const chartData = useMemo(() => {
        if (!activeProject) return [];
        const { tasks } = activeProject;

        const data = tasks.filter(t => !t.completed).map(task => {
             const color = task.color || 'hsl(var(--primary))';
             const match = /hsl\((\d+)\s(\d+)%\s(\d+)%\)/.exec(color);
             let rgbaColor = 'rgba(212, 175, 55, 0.8)'; // Default gold
             if (match) {
                 const [, h, s, l] = match;
                 rgbaColor = `hsla(${h}, ${s}%, ${l}%, 0.8)`;
             }

            return {
                x: task.urgency,
                y: task.importance,
                z: task.title,
                id: task.id,
                fill: rgbaColor
            }
        });

        // Move the task being interacted with to the top layer
        if (topTaskId) {
            const topTaskIndex = data.findIndex(d => d.id === topTaskId);
            if (topTaskIndex > -1) {
                const [topTask] = data.splice(topTaskIndex, 1);
                data.push(topTask);
            }
        }
        
        return data;
    }, [activeProject, topTaskId]);
    
    const handleDragStart = (id: string) => {
        setDraggingTask(id);
        setTopTaskId(id);
    };

    const handleDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!draggingTask || !chartRef.current) return;

        const bounds = chartRef.current.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartWidth = bounds.width - margin.left - margin.right;
        const chartHeight = bounds.height - margin.top - margin.bottom;

        let newUrgency = ((x - margin.left) / chartWidth) * 10;
        let newImportance = 10 - ((y - margin.top) / chartHeight) * 10;
        
        newUrgency = Math.max(0, Math.min(10, newUrgency));
        newImportance = Math.max(0, Math.min(10, newImportance));

        updateTask(draggingTask, {
            urgency: Number(newUrgency.toFixed(1)),
            importance: Number(newImportance.toFixed(1))
        });
    };

    const handleDragEnd = () => {
        setDraggingTask(null);
    };
    
    // Prevent SSR rendering of the chart to avoid hydration mismatches
    if (!isClient) return <div className="w-full h-[550px] relative select-none" />;

  return (
    <Card className="bg-card/60 p-6 shadow-lg">
      <CardHeader className="p-0">
        <CardTitle className="text-lg font-semibold text-accent">Eisenhower Matrix</CardTitle>
        <CardDescription>Drag task nodes to update their urgency and importance.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-6">
        <div 
            className="w-full h-[550px] relative select-none"
            ref={chartRef}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
        >
            <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                    <XAxis type="number" dataKey="x" name="Urgency" domain={[0, 10]} stroke="hsl(var(--muted-foreground))" tickCount={11}>
                        <Label value="Urgency →" offset={-25} position="insideBottom" fill="hsl(var(--muted-foreground))" />
                    </XAxis>
                    <YAxis type="number" dataKey="y" name="Importance" domain={[0, 10]} stroke="hsl(var(--muted-foreground))" tickCount={11}>
                        <Label value="Importance →" angle={-90} offset={-25} position="insideLeft" fill="hsl(var(--muted-foreground))" />
                    </YAxis>
                    
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="p-2 bg-popover border border-border rounded-md shadow-lg">
                                    <p className="font-bold text-lg">{data.z}</p>
                                    <p className="text-sm text-foreground">Urgency: {data.x}/10</p>
                                    <p className="text-sm text-foreground">Importance: {data.y}/10</p>
                                </div>
                            );
                        }
                        return null;
                      }} 
                    />

                    <Scatter
                        data={chartData}
                        className="cursor-move"
                        isAnimationActive={false}
                        shape={({ cx, cy, payload }: CustomShapeProps) => {
                          // Return an empty, valid SVG element if data is not ready, instead of null.
                          if (cx === undefined || cy === undefined || !payload) return <g />;
                          return (
                             <foreignObject x={cx - 75} y={cy - 25} width={150} height={100} className="overflow-visible">
                                <div
                                    onMouseDown={() => handleDragStart(payload.id)}
                                    style={{ backgroundColor: payload.fill }}
                                    className="w-[150px] min-h-[40px] p-2 rounded-lg text-xs font-bold flex items-center justify-center text-center shadow-lg border-2 border-black/80 text-primary-foreground"
                                >
                                   <p className="whitespace-normal">{payload.z}</p>
                                </div>
                            </foreignObject>
                          )
                        }}
                     >
                        {/* This allows each cell to have its own fill color from the data */}
                        {chartData.map((entry) => (
                           <Cell key={`cell-${entry.id}`} fill={entry.fill} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EisenhowerMatrix;
