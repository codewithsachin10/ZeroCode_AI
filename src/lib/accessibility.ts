/**
 * WCAG Accessibility Utilities and Helpers
 * Provides utilities for improving keyboard navigation, screen reader support, and a11y
 */

import React from 'react';

/**
 * Custom hook for handling keyboard navigation
 */
export function useKeyboardNavigation(
  onEscape?: () => void,
  onEnter?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
          onEnter?.();
          e.preventDefault();
          break;
        case 'ArrowUp':
          onArrowUp?.();
          e.preventDefault();
          break;
        case 'ArrowDown':
          onArrowDown?.();
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter, onArrowUp, onArrowDown]);
}

/**
 * Custom hook for managing focus
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        if (activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [ref]);
}

/**
 * Skip to main content link component
 */
export const SkipToMainContent: React.FC = () => (
  <a
    href="#main-content"
    className="absolute -top-14 left-0 z-50 bg-primary text-black px-4 py-2 font-semibold focus:top-0 transition-all"
  >
    Skip to main content
  </a>
);

/**
 * Accessible dialog component wrapper
 */
interface AccessibleDialogProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  isOpen,
  title,
  children,
  onClose,
}) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        <div>{children}</div>
      </div>
    </div>
  );
};

/**
 * Accessibility audit checklist
 */
export const A11Y_CHECKLIST = {
  'Color Contrast': {
    description: 'Text and interactive elements should have a contrast ratio of at least 4.5:1',
    tools: ['WebAIM Contrast Checker', 'Lighthouse'],
    status: 'pending',
  },
  'Keyboard Navigation': {
    description: 'All interactive elements should be accessible via keyboard',
    checklist: [
      'Tab through all interactive elements',
      'Check that focus is visible',
      'Verify focus order is logical',
      'Check escape key closes modals',
    ],
    status: 'pending',
  },
  'Screen Reader Support': {
    description: 'Content should be readable by screen readers',
    checklist: [
      'Add semantic HTML (button, link, form)',
      'Include alt text for images',
      'Add aria-labels where needed',
      'Test with NVDA or JAWS',
    ],
    status: 'pending',
  },
  'Form Accessibility': {
    description: 'Forms should be fully accessible',
    checklist: [
      'All inputs have associated labels',
      'Error messages are associated with inputs',
      'Required fields are marked',
      'Form can be submitted via keyboard',
    ],
    status: 'pending',
  },
  'Focus Management': {
    description: 'Focus should be managed appropriately',
    checklist: [
      'Focus is visible on all interactive elements',
      'Focus order is logical',
      'Focus is managed when opening modals',
      'Focus returns to trigger on modal close',
    ],
    status: 'pending',
  },
  'Heading Hierarchy': {
    description: 'Headings should be used correctly',
    checklist: [
      'Page has a single h1',
      'Heading hierarchy is logical',
      'No skipped heading levels',
    ],
    status: 'pending',
  },
  'ARIA Attributes': {
    description: 'ARIA should be used correctly',
    checklist: [
      'aria-live for dynamic content',
      'aria-expanded for collapsible items',
      'aria-current for current page',
      'aria-disabled for disabled elements',
      'No empty ARIA attributes',
    ],
    status: 'pending',
  },
  'Motion and Animation': {
    description: 'Respect user preferences for animations',
    checklist: [
      'Avoid excessive animations',
      'Provide pause controls for animations',
      'Support prefers-reduced-motion',
    ],
    status: 'pending',
  },
};

/**
 * Utility to check color contrast
 */
export function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const getLuminance = (rgb: [number, number, number]) => {
    const [r, g, b] = rgb.map((val) => {
      const sRGB = val / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Utility to check if text meets WCAG AA standards
 */
export function meetsWCAG_AA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

export default {
  useKeyboardNavigation,
  useFocusTrap,
  SkipToMainContent,
  AccessibleDialog,
  A11Y_CHECKLIST,
  getContrastRatio,
  meetsWCAG_AA,
};
