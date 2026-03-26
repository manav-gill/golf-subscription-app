function Input({ type = 'text', placeholder = '', value, onChange, className = '', ...props }) {
  const classes = `w-full rounded-xl border border-border bg-surface px-4 py-3 text-primary focus:outline-none focus:ring-1 focus:ring-accent ${className}`.trim();

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={classes}
      {...props}
    />
  );
}

export default Input;
