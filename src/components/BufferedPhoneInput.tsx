import React, { useState, useRef, useEffect } from "react";
import { formatPhoneNumber } from "../appConstants";

export interface BufferedPhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const BufferedPhoneInput: React.FC<BufferedPhoneInputProps> = ({
  value,
  onChange,
  disabled,
  className,
  placeholder,
  inputRef,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isFocused = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;
    const timer = setTimeout(() => {
      onChangeRef.current(localValue);
    }, 350);
    return () => clearTimeout(timer);
  }, [localValue, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    setLocalValue(rawDigits);
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (localValue !== value) {
      onChangeRef.current(localValue);
    }
  };

  return (
    <input
      ref={inputRef}
      type="tel"
      disabled={disabled}
      value={disabled ? "" : formatPhoneNumber(localValue)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
};
