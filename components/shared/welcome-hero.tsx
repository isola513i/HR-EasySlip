import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
}

export function WelcomeHero({ icon: Icon, title, subtitle, className }: WelcomeHeroProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-(--es-accent-600) shadow-(--es-shadow-md)">
        <Icon className="size-8 text-white" strokeWidth={2} />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
