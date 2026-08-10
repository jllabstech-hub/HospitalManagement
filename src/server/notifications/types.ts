export interface AppointmentConfirmationParams {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
}

export interface AppointmentCancellationParams {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  reason?: string;
}

export interface AppointmentReminderParams {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
}

export interface EnquiryAcknowledgementParams {
  email: string;
  name: string;
  enquiryType: string;
}

export interface NotificationService {
  sendAppointmentConfirmation(params: AppointmentConfirmationParams): Promise<void>;
  sendAppointmentCancellation(params: AppointmentCancellationParams): Promise<void>;
  sendAppointmentReminder(params: AppointmentReminderParams): Promise<void>;
  sendEnquiryAcknowledgement(params: EnquiryAcknowledgementParams): Promise<void>;
}
