function Badge({ status, children }) {
  const value = children || status || "UNKNOWN";
  const className = `badge badge--${String(value).toLowerCase()}`;

  return <span className={className}>{String(value).replace(/_/g, " ")}</span>;
}

export default Badge;
