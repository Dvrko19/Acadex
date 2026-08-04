const notificationService = require("../services/notifications.service");
const { asyncHandler } = require("../helpers/errors");
const { toInt } = require("../helpers/validators");

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getNotificationByuser(req.user.userId);
  return res.status(200).json({ success: true, data: notifications });
});

const countUnread = asyncHandler(async (req, res) => {
  const total = await notificationService.countUnreadByUser(req.user.userId);
  return res.status(200).json({ success: true, total });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    toInt(req.params.id),
    req.user.userId
  );
  return res.status(200).json({
    success: true,
    message: "Notificacion marcada como leida",
    data: notification
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.userId);
  return res.status(200).json({
    success: true,
    message: "Notificaciones marcadas como leidas",
    data: result
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(toInt(req.params.id), req.user);
  return res.status(204).send();
});

module.exports = {
  getMyNotifications,
  countUnread,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
