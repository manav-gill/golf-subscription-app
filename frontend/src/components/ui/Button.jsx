function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseClasses = 'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-opacity duration-300';

  const variantClasses = {
    primary: 'bg-accent text-white hover:opacity-90',
    outline: 'border border-border text-primary bg-transparent'
  };

  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`.trim();

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
