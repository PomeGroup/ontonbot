"use client";

import React from "react";
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
interface PlusMinusInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  error?: string;      // optional error message
  unitLabel?: string;  // optional suffix like '%'
}

/**
 * Reusable numeric input that:
 *  - Has a typeable field on the left (with optional unit text),
 *  - Has plus/minus buttons on the right, stuck together (no spacing),
 *  - Allows the user to type or increment/decrement.
 */
export default function PlusMinusInput({
                                         label,
                                         value,
                                         onChange,
                                         error,
                                         unitLabel,
                                       }: PlusMinusInputProps) {
  // Called when user types a new value
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    if (typed === "") {
      // If empty, default to 0 or do something else
      onChange(0);
      return;
    }
    const parsed = Number(typed);
    if (Number.isNaN(parsed)) {
      onChange(0);
    } else {
      onChange(Math.max(0, parsed)); // remove Math.max if you want negative
    }
  };

  // Decrement by 1
  const handleMinus = () => {
    onChange(Math.max(0, value - 1));
  };

  // Increment by 1
  const handlePlus = () => {
    onChange(Math.max(0, value + 1));
  };

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="text-sm text-gray-500 mb-1 block">
        {label}
      </label>

      {/* Container box */}
      <div className="bg-white py-2 px-4 rounded-md flex items-center justify-between shadow-sm">
        {/* Left side: input + optional unit label */}
        <div className="flex items-center space-x-1">
          <input
            type="number"
            className="
              w-15
              border-none
              text-center

              outline-none
              p-0

            "
            value={value.toString()}
            onChange={handleInputChange}
          />
          {unitLabel && (
            <span className="text-gray-600 text-sm">
              {unitLabel}
            </span>
          )}
        </div>

        {/* Right side: plus/minus stuck together (no gap) */}
        <div className="flex">
          <button
            type="button"
            onClick={handleMinus}
            className="
              px-3 py-1 bg-gray-200
              rounded-l
              hover:bg-gray-300
              focus:outline-none
              border-r-2
              border-r-gray-500
            "
          >
            <FaMinus />
          </button>
          <button
            type="button"
            onClick={handlePlus}
            className="
              px-3 py-1 bg-gray-200
              rounded-r
              hover:bg-gray-300
              focus:outline-none
            "
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* Error message if needed */}
      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
