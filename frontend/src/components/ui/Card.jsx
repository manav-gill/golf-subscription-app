function Card({ children, className = '', ...props }) {
  const classes = `rounded-2xl border border-border bg-surface p-6 ${className}`.trim();

  return (
    <section className={classes} {...props}>
      {children}
    </section>
  );
}

export default Card;
