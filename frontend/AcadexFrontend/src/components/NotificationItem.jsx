import { Bell, BookOpen, CalendarDays, FileCheck2 } from "lucide-react";
import { relativeTime } from "../utils/dateTime";

const iconByType = (type = "") => {
  if (type.includes("SUBMISSION")) return <FileCheck2 size={20} />;
  if (type.includes("TASK") || type.includes("COURSE")) return <BookOpen size={20} />;
  if (type.includes("EVENT")) return <CalendarDays size={20} />;
  return <Bell size={20} />;
};

export function NotificationItem({ notification, onOpen }) {
  const icon = iconByType(notification.type);
  return <button className={`notification-item ${notification.isRead ? "read" : "unread"}`} type="button" onClick={() => onOpen(notification)}>
    <span className="notification-icon">{icon}</span><span className="notification-copy"><span className="notification-title">{notification.title || "Nueva notificacion"}{!notification.isRead && <i aria-label="No leida" />}</span><span>{notification.message}</span><time dateTime={notification.createdAt}>{relativeTime(notification.createdAt)}</time></span>
  </button>;
}
