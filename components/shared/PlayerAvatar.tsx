import Image from "next/image";

interface PlayerAvatarProps {
  name: string;
  photoUrl: string | null;
  size?: number;
  className?: string;
}

export default function PlayerAvatar({
  name,
  photoUrl,
  size = 40,
  className = "",
}: PlayerAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (photoUrl) {
    return (
      <div
        className={`relative rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={photoUrl}
          alt={name}
          fill
          className="object-cover object-top"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-masters-green text-white flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
