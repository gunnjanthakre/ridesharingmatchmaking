function LoadingSkeleton({ type = "card", count = 1 }) {
  const className = `skeleton skeleton--${type}`;

  return (
    <div className="loading-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`${type}-${index}`} className={className} />
      ))}
    </div>
  );
}

export default LoadingSkeleton;
