
import { X } from "lucide-react";
import StudentAdmissionForm from "./StudentAdmissionForm";

interface StudentAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentAdmissionModal({ isOpen, onClose }: StudentAdmissionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl my-8 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
        >
          <X size={20} />
        </button>
        <StudentAdmissionForm />
      </div>
    </div>
  );
}
