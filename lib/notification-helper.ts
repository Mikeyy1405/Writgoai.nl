/**
 * Notification Helper - Simplified stub
 * Removed complex email notifications
 */

export async function sendAdminNotification(message: string) {
  console.log('📧 Admin notification:', message);
  return { success: true };
}

export async function notifyAdminNewRequest(data: any) {
  console.log('📧 New request notification:', data);
  return { success: true };
}

export async function notifyClientAssignmentUpdate(data: any) {
  console.log('📧 Assignment update:', data);
  return { success: true };
}

export async function notifyClientInvoice(data: any) {
  console.log('📧 Invoice notification:', data);
  return { success: true };
}

export async function notifyPaymentReminder(data: any) {
  console.log('📧 Payment reminder:', data);
  return { success: true };
}
