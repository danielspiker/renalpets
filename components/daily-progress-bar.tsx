"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayBRT } from "@/lib/date";

type Props = {
  catId: string;
  initialEatenGrams: number;
  initialGoalGrams: number;
  initialCompleted: boolean;
};

export function DailyProgressBar({
  catId,
  initialEatenGrams,
  initialGoalGrams,
  initialCompleted,
}: Props) {
  const [eaten, setEaten] = useState(initialEatenGrams);
  const [goal, setGoal] = useState(initialGoalGrams);
  const [completed, setCompleted] = useState(initialCompleted);

  useEffect(() => {
    const supabase = createClient();
    const today = todayBRT();

    const channel = supabase
      .channel(`daily_progress:${catId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_progress",
          filter: `cat_id=eq.${catId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            day?: string;
            eaten_grams?: number | string;
            goal_grams?: number | string;
            completed?: boolean;
          } | null;
          if (!row || row.day !== today) return;
          setEaten(Number(row.eaten_grams ?? 0));
          setGoal(Number(row.goal_grams ?? 0));
          setCompleted(Boolean(row.completed));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [catId]);

  const pct = goal > 0 ? Math.round((eaten / goal) * 100) : 0;
  const over = pct > 100;
  const barWidth = Math.min(100, pct);

  if (goal === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Defina uma agenda de refeições para ter uma meta diária.
      </p>
    );
  }

  const barColor = over
    ? "bg-blue-500"
    : completed
    ? "bg-success"
    : "bg-primary";
  const pctColor = over
    ? "text-blue-500"
    : completed
    ? "text-success"
    : "text-primary";

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${pctColor}`}>{pct}%</span>
          {completed && !over && (
            <span className="text-success text-lg font-bold">✓</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {eaten.toFixed(1)} g de {goal.toFixed(1)} g
          </p>
          <p className="text-xs text-muted-foreground">consumidos</p>
        </div>
      </div>
      <div className="bg-muted h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {over
          ? "Passou da meta do dia"
          : completed
          ? "Meta diária alcançada 🎉"
          : "Meta não atingida ainda — continue!"}
      </p>
    </div>
  );
}
