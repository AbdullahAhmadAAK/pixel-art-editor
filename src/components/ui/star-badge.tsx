const StarBadge = ({
  className,
  variant = "xp",
  size = "sm",
}: {
  className?: string;
  variant?: "xp" | "bp";
  size?: "sm" | "md";
}) => {
  return (
    <video
      src={
        size === "md"
          ? `https://cdn.b3.fun/${variant}-star-badge.webm`
          : `https://cdn.b3.fun/${variant}-star-badge-small.webm`
      }
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      style={{
        filter: variant === "bp" ? "hue-rotate(185deg)" : undefined,
      }}
    />
  );
};

export default StarBadge;
