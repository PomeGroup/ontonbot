import { useState, useEffect, useRef } from "react";

/**
 * useDebounce hook
 * @param value The value to debounce
 * @param delay The debounce delay in milliseconds
 * @returns The debounced value
 */
const useDebounce = <T>(value: T, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  // __AUTO_GENERATED_PRINT_VAR_START__
  console.log("useDebounce debouncedValue: %s", debouncedValue); // __AUTO_GENERATED_PRINT_VAR_END__
  return debouncedValue;
};

export default useDebounce;
