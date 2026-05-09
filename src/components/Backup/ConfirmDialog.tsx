import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="confirm-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </Modal>
  );
}
