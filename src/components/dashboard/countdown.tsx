
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTaskContext } from "@/context/task-context";

const Countdown = () => {
  const { activeProject } = useTaskContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Render nothing or a placeholder if there's no active project
  if (!activeProject) {
    return <div className="text-center rounded-lg border border-primary/30 bg-card/50 p-4 shadow-inner">Loading...</div>;
  }

  const { project } = activeProject;
  const [deadline, setDeadline] = useState(new Date(project.deadline));

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setDeadline(new Date(project.deadline));
  }, [project.deadline]);

  useEffect(() => {
    if (!isClient) return;
    const updateCountdown = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [deadline, isClient]);

  const glowing = isClient && timeLeft.days < 7 && (deadline.getTime() - new Date().getTime()) > 0;

  const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="text-center">
      <div className="text-4xl font-bold text-primary min-w-[3rem] tabular-nums">
        {isClient ? String(value).padStart(2, "0") : "00"}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <div
      className={cn(
        "text-center rounded-lg border border-primary/30 bg-card/50 p-4 shadow-inner transition-shadow duration-1000",
        glowing && "shadow-[0_0_15px_hsl(var(--primary)/0.7)] animate-pulse"
      )}
    >
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Submission Deadline
      </h3>
       <p className="text-xs text-muted-foreground mb-3">
        {isClient ? deadline.toLocaleString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) : 'Loading...'}
      </p>
      <div className="flex justify-center gap-4">
        <CountdownUnit value={timeLeft.days} label="Days" />
        <CountdownUnit value={timeLeft.hours} label="Hours" />
        <CountdownUnit value={timeLeft.minutes} label="Minutes" />
        <CountdownUnit value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
};

export default Countdown;
