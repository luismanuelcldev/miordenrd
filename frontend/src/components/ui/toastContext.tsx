import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { Toast } from "./toast";

// Defino el estado y el contrato del sistema de notificaciones tipo toast
interface ToastState {
  message: string;
  type?: "success" | "error" | "info";
}

interface ToastContextProps {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

// Creo el contexto para poder disparar toasts desde cualquier punto de la app
const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

// Proveedor de toasts: gestiono el estado local y renderizo el componente Toast
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  // Expongo una función para mostrar el toast con mensaje y tipo
  const showToast = useCallback((message: string, type?: "success" | "error" | "info") => {
    setToast({ message, type });
  }, []);

  // Oculto el toast limpiando el estado
  const handleClose = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={handleClose} />
      )}
    </ToastContext.Provider>
  );
}
