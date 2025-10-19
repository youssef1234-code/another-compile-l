import { ComingSoonPage } from '@/components/ComingSoonPage';

export function QRCodesPage() {
  return (
    <ComingSoonPage
      title="QR Code Management"
      description="Generate, manage, and track QR codes for seamless event check-ins, attendance verification, and access control across all Another Compile L events."
      features={[
        'Generate unique QR codes per event',
        'Bulk QR code generation',
        'Real-time check-in scanning',
        'Attendance tracking and reports',
        'Custom QR code designs with branding',
        'Print-ready QR code formats',
        'Access control and validation',
        'Check-in analytics and insights',
      ]}
    />
  );
}
