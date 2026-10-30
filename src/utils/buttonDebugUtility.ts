/**
 * Unified Debugging Utility for Auditing and Verifying Button Click Listeners
 * across the application.
 */

export interface ButtonAuditResult {
  element: HTMLElement;
  tag: string;
  type?: string;
  disabled: boolean;
  computedPointerEvents: string;
  isObstructed: boolean;
  obstructingElement?: Element | null;
  boundingRect: DOMRect;
  label: string;
}

/**
 * Verifies if an interactive element or button is clickable, unobstructed,
 * has valid pointer-events, and whether click events reach it.
 */
export const auditButtonElement = (button: HTMLElement): ButtonAuditResult => {
  const rect = button.getBoundingClientRect();
  const disabled = (button as HTMLButtonElement).disabled ?? false;
  const computedStyle = window.getComputedStyle(button);
  const computedPointerEvents = computedStyle.pointerEvents;

  // Check if center point of the button is obstructed by another element with higher z-index
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let isObstructed = false;
  let obstructingElement: Element | null = null;

  if (rect.width > 0 && rect.height > 0) {
    const topEl = document.elementFromPoint(centerX, centerY);
    if (topEl && topEl !== button && !button.contains(topEl)) {
      isObstructed = true;
      obstructingElement = topEl;
    }
  }

  const label =
    button.getAttribute("title") ||
    button.getAttribute("aria-label") ||
    button.textContent?.trim().slice(0, 40) ||
    "unnamed-button";

  const result: ButtonAuditResult = {
    element: button,
    tag: button.tagName.toLowerCase(),
    type: (button as HTMLButtonElement).type,
    disabled,
    computedPointerEvents,
    isObstructed,
    obstructingElement,
    boundingRect: rect,
    label,
  };

  return result;
};

/**
 * Audits all buttons in a container element or dialog
 */
export const auditContainerButtons = (container: HTMLElement | Document = document): ButtonAuditResult[] => {
  const buttons = Array.from(container.querySelectorAll<HTMLElement>("button, [role='button']"));
  return buttons.map(auditButtonElement);
};
