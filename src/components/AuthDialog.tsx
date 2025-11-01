import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AuthForm from "./AuthForm";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-8 border-emerald-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Autenticação</DialogTitle>
        </DialogHeader>
        <AuthForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
