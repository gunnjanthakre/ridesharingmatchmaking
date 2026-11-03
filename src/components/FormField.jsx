function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  min,
  max,
  step,
  required = false,
  options
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {options ? (
        <select id={name} name={name} value={value} onChange={onChange} required={required}>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          required={required}
        />
      )}
      <div className="field__error">{error || ""}</div>
    </div>
  );
}

export default FormField;
