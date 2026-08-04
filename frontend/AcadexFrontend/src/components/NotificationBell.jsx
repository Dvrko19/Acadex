import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { notificationService } from "../services/notificationService";

export function NotificationBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    notificationService.unreadCount().then((result) => setCount(result.total ?? result.unreadNotifications ?? result ?? 0)).catch(() => {});
    return () => controller.abort();
  }, []);

  return <button className="bell-button" type="button" onClick={() => navigate("/app/notifications")} aria-label={`${count} notificaciones no leidas`} title="Notificaciones"><Bell size={20} />{count > 0 && <strong>{count > 99 ? "99+" : count}</strong>}</button>;
}
