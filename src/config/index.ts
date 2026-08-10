export const APP_CONFIG = {
  appName: 'CarePulse Hospital',
  shortName: 'CarePulse',
  tagline: 'Exceptional Care. Right When You Need It.',
  hospitalTimezone: process.env.NEXT_PUBLIC_HOSPITAL_TIMEZONE || 'Asia/Kolkata',
  slotDurationMinutes: 30,
  contact: {
    phone: '+91 80 4567 8900',
    phoneHref: 'tel:+918045678900',
    email: 'care@carepulse.hospital',
    address: '12 Health Avenue, Bengaluru, Karnataka 560001',
    hours: 'Mon–Sat · 8:00 AM – 8:00 PM IST',
    emergency: '24×7 Emergency Desk',
  },
} as const;
