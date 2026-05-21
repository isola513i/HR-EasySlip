import { type ReactNode } from "react";
import Image from "next/image";
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
        <div className="relative grid size-20 place-items-center overflow-hidden rounded-full bg-(--es-accent-600) text-3xl font-bold text-white shadow-(--es-shadow-md)">
          {pictureSrc ? (
            <Image src={pictureSrc} alt={name || "avatar"} fill sizes="80px" className="object-cover" />
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
