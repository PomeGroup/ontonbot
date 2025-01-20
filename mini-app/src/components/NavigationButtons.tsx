"use client";

import React, { ReactNode } from "react";
import { Block, Button } from "konsta/react";
import clsx from "clsx";

/**
 * Extend all props from Konsta <Button>, except "children" (we'll generate children from label+icon).
 */
export interface NavAction
  extends Omit<React.ComponentPropsWithoutRef<typeof Button>, "children"> {
  /** The button label to display */
  label: string;
  /** Optional icon to display before the label */
  icon?: ReactNode;
  /** Tailwind class for the background color (e.g., "bg-blue-500"). */
  color?: string;
}

/**
 * Extend all props from Konsta <Block>, except "children" (we create them here).
 */
export interface NavigationButtonsProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Block>, "children"> {
  /** Array of actions to render as Konsta Buttons */
  actions: NavAction[];
  /** Layout of buttons: side-by-side ("horizontal") or stacked ("vertical") */
  layout?: "horizontal" | "vertical";
}

/**
 * A bottom-fixed action bar (like "Save" & "Discard" buttons).
 * Receives any Konsta `Block` props for the container, and each button
 * can also receive any Konsta `Button` props via `NavAction`.
 */
export default function NavigationButtons({
                                            actions,
                                            layout = "horizontal",
                                            className,
                                            style,
                                            ...restBlockProps
                                          }: NavigationButtonsProps) {
  // Decide container classes based on layout
  const containerClasses = clsx(
    "fixed bottom-0 left-0 w-full z-10 safe-areas bg-white px-4 py-3",
    layout === "horizontal"
      ? "flex flex-row justify-end space-x-3"
      : "flex flex-col space-y-3",
    className // allow user to append custom classes
  );

  return (
    <Block
      {...restBlockProps}
      className={containerClasses}
      style={{
        marginBottom: "env(safe-area-inset-bottom)",
        ...style, // merge user-defined style
      }}
    >
      {actions.map((action, idx) => {
        // Merge user-provided "colors" with your background color logic
        const mergedColors = {
          fillBgIos: action.color ?? "bg-blue-500",
          fillBgMaterial: action.color ?? "bg-blue-500",
          textIos: "text-white",
          textMaterial: "text-white",
          ...(action.colors || {}),
        };

        return (
          <Button
            // Spread all user-provided Button props
            {...action}
            // Override `colors` with mergedColors
            colors={mergedColors}
            key={idx}

            className={clsx(
              // Ensure label+icon have spacing
              "flex items-center space-x-2 py-4 px-2",
              action.className
            )}
          >
            {/* Insert icon + label as children */}
            {action.icon && <span>{action.icon}</span>}
            <span>{action.label}</span>
          </Button>
        );
      })}
    </Block>
  );
}
