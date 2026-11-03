import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <div className="toast__top">
            <div>
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>
            <button className="toast__dismiss" type="button" onClick={() => onDismiss(toast.id)}>
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function pushToast({ title, message, type = "success" }) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setToasts((current) => [...current, { id, title, message, type }]);

    window.setTimeout(() => {
      dismissToast(id);
    }, 4200);
  }

  const value = useMemo(
    () => ({
      success(title, message) {
        pushToast({ title, message, type: "success" });
      },
      error(title, message) {
        pushToast({ title, message, type: "error" });
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

export default ToastContainer;
