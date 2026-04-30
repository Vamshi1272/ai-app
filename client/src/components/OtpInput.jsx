import React, { useRef, useEffect } from 'react';

export default function OtpInput({ value, onChange, length = 6 }) {
  const inputs = useRef([]);

  const handleChange = (e, i) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const chars = val.split('');
    const newValue = value.split('');
    chars.forEach((ch, j) => {
      if (i + j < length) newValue[i + j] = ch;
    });
    onChange(newValue.join('').substring(0, length));
    const nextIdx = Math.min(i + chars.length, length - 1);
    inputs.current[nextIdx]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const arr = value.split('');
        arr[i] = '';
        onChange(arr.join(''));
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, length);
    onChange(text.padEnd(length, '').substring(0, length));
    inputs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="otp-container">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          className="otp-input"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onPaste={handlePaste}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
