'use client';

import { useMemo } from 'react';
import { AvatarSvg } from '@/components/avatar/avatar-svg';
import { useAvatarPlayer } from '@/components/avatar/use-player';
import { defaultProject, type Animation, type Avatar } from '@/components/avatar/engine';

const CAST = defaultProject().avatars;

/**
 * A procedural avatar that is actually moving — idle float + blinks (ambient)
 * plus one of its own looping animations, exactly like the avatar-app showcase.
 */
export function LiveAvatar({
  name = 'Nacho',
  anim,
  size = 120,
  className,
}: {
  name?: string;
  anim?: string;
  size?: number;
  className?: string;
}) {
  const avatar: Avatar = useMemo(() => CAST.find((a) => a.name === name) ?? CAST[0], [name]);
  const animation: Animation | null = useMemo(
    () => (anim ? avatar.animations.find((a) => a.id === anim) : avatar.animations[0]) ?? null,
    [avatar, anim],
  );
  const { frame } = useAvatarPlayer(avatar, { animation, playing: true, ambient: true });

  return (
    <span style={{ width: size, height: size }} className={`block shrink-0 ${className ?? ''}`}>
      <AvatarSvg
        avatar={avatar}
        face={frame.face}
        color={frame.color}
        blink={frame.blink}
        float={frame.float}
        className="h-full w-full drop-shadow-xl"
      />
    </span>
  );
}
