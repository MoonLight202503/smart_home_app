import './ToggleSwitch.css';

export default function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <label className={`toggle ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="slider" />
    </label>
  );
}
