import { toast as _toast } from "react-hot-toast";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

const VARIANTS = {
  success: {
    icon: <CheckCircle2 size={18} />,
    bg: "#f0fdf4",
    border: "#bbf7d0",
    iconColor: "#16a34a",
    textColor: "#15803d",
  },
  error: {
    icon: <XCircle size={18} />,
    bg: "#fff1f2",
    border: "#fecdd3",
    iconColor: "#dc2626",
    textColor: "#b91c1c",
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: "#fffbeb",
    border: "#fde68a",
    iconColor: "#d97706",
    textColor: "#b45309",
  },
  info: {
    icon: <Info size={18} />,
    bg: "#eff6ff",
    border: "#bfdbfe",
    iconColor: "#2563eb",
    textColor: "#1d4ed8",
  },
};

const ToastContent = ({ message, variant, t }) => {
  const v = VARIANTS[variant] || VARIANTS.info;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.65rem",
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: "12px",
        padding: "0.75rem 1rem",
        boxShadow: "0 4px 20px rgba(15,23,42,0.10)",
        minWidth: 260,
        maxWidth: 380,
        opacity: t.visible ? 1 : 0,
        transform: t.visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        cursor: "pointer",
      }}
      onClick={() => _toast.dismiss(t.id)}
    >
      <span style={{ color: v.iconColor, flexShrink: 0, marginTop: 1 }}>
        {v.icon}
      </span>
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: v.textColor,
          lineHeight: 1.45,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {message}
      </span>
    </div>
  );
};

const show = (message, variant, options = {}) =>
  _toast.custom(
    (t) => <ToastContent message={message} variant={variant} t={t} />,
    {
      duration: 4000,
      ...options,
    },
  );

const toast = {
  success: (msg, opts) => show(msg, "success", opts),
  error: (msg, opts) => show(msg, "error", opts),
  warning: (msg, opts) => show(msg, "warning", opts),
  info: (msg, opts) => show(msg, "info", opts),
  loading: (msg, opts) => _toast.loading(msg, opts),
  dismiss: _toast.dismiss,
};

export default toast;
