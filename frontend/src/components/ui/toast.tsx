import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

// Muestro un toast temporal que se cierra solo y permite cierre manual
export function Toast({ message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const color = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600";

  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow text-white ${color} animate-fade-in flex items-center`}>
      <span>{message}</span>
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="ml-4 bg-transparent text-white hover:text-gray-200 focus:outline-none"
        style={{ fontSize: 18 }}
      >
        ×
      </button>
    </div>
  );
}
