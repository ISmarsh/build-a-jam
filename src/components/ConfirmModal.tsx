/**
 * ConfirmModal — Reusable confirmation dialog (powered by shadcn/ui AlertDialog)
 *
 * LEARNING NOTES - HEADLESS UI COMPONENTS:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: MatDialog is a service you inject and call imperatively
 *    (dialog.open(MyComponent, config)).
 *    React (hand-rolled): render a fixed overlay, manually add keyboard
 *    listeners, backdrop click handlers, focus trap, etc.
 *    React (Radix/shadcn): Radix provides "unstyled headless" components
 *    that handle accessibility, focus trapping, Escape key, and portal
 *    rendering. shadcn/ui adds Tailwind styling on top.
 *
 * 2. ALERTDIALOG vs DIALOG:
 *    AlertDialog is for destructive/confirmation actions — it blocks
 *    Escape and backdrop clicks by default, forcing the user to make an
 *    explicit choice (Confirm or Cancel). Dialog is for general content
 *    that can be dismissed freely. This mirrors Angular's distinction
 *    between MatDialog (general) and a custom ConfirmDialog.
 *
 * 3. CONTROLLED PATTERN:
 *    Parents still use {confirm && <ConfirmModal />} to show/hide.
 *    We pass open={true} to AlertDialog since the component only renders
 *    when the parent wants it visible.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmClasses = variant === 'danger'
    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
    : 'bg-primary hover:bg-primary/90 text-primary-foreground';

  return (
    <AlertDialog open={true} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="bg-card max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-input"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={confirmClasses}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmModal;
