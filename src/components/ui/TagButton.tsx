/**
 * Button Component - Reusable button with variants
 *
 * LEARNING NOTES - COMPONENT COMPOSITION:
 *
 * 1. REUSABLE COMPONENTS:
 *    Angular: Create a shared component with @Input() properties
 *    React: Same concept, just simpler - props interface + function
 *
 * 2. VARIANTS PATTERN:
 *    Instead of multiple button components, use a 'variant' prop
 *    This is common in React UI libraries (MUI, Chakra, shadcn/ui)
 *
 * 3. cn() UTILITY:
 *    Cleaner than string template literals for conditional classes
 *    Handles conflicts (e.g., if two classes set the same property)
 *
 * 4. CHILDREN PROP:
 *    React's special prop for content between tags
 *    Angular equivalent: <ng-content>
 */

import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'default' | 'tag';
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string; // Allow additional custom classes
}

/**
 * Button component with multiple visual variants
 *
 * @param variant - Visual style: 'default' or 'tag'
 * @param active - Whether button is in active/selected state
 * @param children - Button content (text, icons, etc.)
 * @param onClick - Click handler
 * @param className - Additional CSS classes to merge
 */
function Button({
  variant = 'default',
  active = false,
  children,
  onClick,
  className,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles - always applied
        'transition-all duration-200 font-medium cursor-pointer',

        // Variant: default button
        variant === 'default' && [
          'px-4 py-2 rounded-lg',
          active
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ],

        // Variant: tag-style button (pill-shaped)
        variant === 'tag' && [
          'px-4 py-2 border-2 rounded-full text-sm',
          active
            ? 'bg-primary border-primary text-primary-foreground font-bold'
            : 'bg-transparent border-primary text-primary hover:bg-primary/10 hover:-translate-y-0.5',
        ],

        // Merge any additional classes passed in
        className
      )}
    >
      {children}
    </button>
  );
}

export default Button;
