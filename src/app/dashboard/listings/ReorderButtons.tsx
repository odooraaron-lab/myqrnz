"use client";

import { useTransition } from "react";
import { reorderListingsAction } from "./actions";

export function ReorderButtons({ ids, index }: { ids: string[]; index: number }) {
  const [pending, start] = useTransition();
  const move = (by: number) => {
    const next = [...ids];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    start(() => reorderListingsAction(next));
  };
  return (
    <span className="hidden items-center lg:flex" aria-busy={pending}>
      <button type="button" className="btn btn-quiet btn-sm !px-2" onClick={() => move(-1)} disabled={pending || index === 0} aria-label="Move up">
        ↑
      </button>
      <button
        type="button"
        className="btn btn-quiet btn-sm !px-2"
        onClick={() => move(1)}
        disabled={pending || index === ids.length - 1}
        aria-label="Move down"
      >
        ↓
      </button>
    </span>
  );
}
