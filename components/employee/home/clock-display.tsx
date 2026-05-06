"use client";

import { useState, useEffect } from "react";

function format(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ClockDisplay() {
  const [time, setTime] = useState(() => format(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(format(new Date())), 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tabular-nums text-[40px] font-bold leading-[44px] tracking-tight">
      {time}
    </span>
  );
}
