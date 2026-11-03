const STATUS_LABELS = {
  pending: "PENDENTE",
  used: "USATO",
  expired: "SCADUTO",
  revoked: "REVOCATO",
};

export function formatInviteDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function inviteStatusLabel(status) {
  return STATUS_LABELS[status] || String(status || "").toUpperCase();
}

export function inviteStatusClass(status) {
  return status === "pending"
    ? "adminUserStatus active"
    : "adminUserStatus blocked";
}
