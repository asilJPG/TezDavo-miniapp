interface IconProps {
  name:
    | "pill"
    | "pharmacy"
    | "pending"
    | "confirmed"
    | "collecting"
    | "ready"
    | "delivering"
    | "delivered"
    | "cancelled"
    | "prescription"
    | "map";
  size?: number;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 28, style }: IconProps) {
  return (
    <img
      src={`/icons/${name}.png`}
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "inline-block", ...style }}
      alt={name}
    />
  );
}
