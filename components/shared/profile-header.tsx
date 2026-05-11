import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  name: string;
  initial?: string;
  meta?: string;
  pictureSrc?: string | null;
  /** Extra slot rendered over/around the avatar — e.g. an upload button. */
  avatarOverlay?: ReactNode;
  className?: string;
}

export function ProfileHeader({ name, initial, meta, pictureSrc, avatarOverlay, className }: ProfileHeaderProps) {
  const letter = ((initial && initial.length > 0 ? initial : name.charAt(0)) || "U").toUpperCase();
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="relative">
        <div className="grid size-20 place-items-center overflow-hidden rounded-full bg-(--es-accent-600) text-3xl font-bold text-white shadow-(--es-shadow-md)">
          {pictureSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pictureSrc} alt={name || "avatar"} className="size-full object-cover" />
          ) : (
            letter
          )}
        </div>
        {avatarOverlay}
      </div>
      <div className="mt-3 text-lg font-bold text-foreground">{name || "—"}</div>
      {meta && (
        <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {meta}
        </div>
      )}
    </div>
  );
}
