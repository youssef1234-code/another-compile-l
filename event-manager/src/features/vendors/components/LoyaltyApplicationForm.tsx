/**
 * Loyalty Application Form Component
 * 
 * Form for vendors to apply to the GUC Loyalty Program
 * Story #70
 */

import { GenericForm, type FormFieldConfig } from '@/components/generic/GenericForm';
import { ApplyToLoyaltySchema, type ApplyToLoyaltyInput } from '@event-manager/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, Tag, FileText, Send } from 'lucide-react';

interface LoyaltyApplicationFormProps {
  onSubmit: (data: ApplyToLoyaltyInput) => void | Promise<void>;
  isLoading?: boolean;
}

export function LoyaltyApplicationForm({ onSubmit, isLoading }: LoyaltyApplicationFormProps) {
  const formFields: FormFieldConfig<ApplyToLoyaltyInput>[] = [
    {
      name: 'discountRate',
      label: 'Discount Rate (%)',
      type: 'number',
      placeholder: 'e.g., 10',
      description: 'Percentage discount you will offer to GUC members (minimum 5%)',
      icon: <Percent className="h-4 w-4" />,
      min: 5,
      max: 100,
      step: 1,
      required: true,
      colSpan: 2,
    },
    {
      name: 'promoCode',
      label: 'Promo Code',
      type: 'text',
      placeholder: 'e.g., GUC2025',
      description: 'Unique promotional code for GUC members (will be auto-converted to uppercase)',
      icon: <Tag className="h-4 w-4" />,
      required: true,
      colSpan: 2,
      inputClassName: 'uppercase',
    },
    {
      name: 'terms',
      label: 'Terms & Conditions',
      type: 'textarea',
      placeholder: 'Enter the terms and conditions for your loyalty offer...\n\nExample:\n- Valid until December 31, 2025\n- Cannot be combined with other offers\n- Valid at all locations',
      description: 'Detailed terms and conditions of your loyalty offer',
      icon: <FileText className="h-4 w-4" />,
      required: true,
      colSpan: 2,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply to Loyalty Program</CardTitle>
        <CardDescription>
          Join the GUC Loyalty Program and offer exclusive discounts to GUC students, staff, and faculty.
          Your application will be reviewed by administrators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GenericForm<ApplyToLoyaltyInput>
          fields={formFields}
          schema={ApplyToLoyaltySchema}
          onSubmit={onSubmit}
          submitButtonText="Submit Application"
          submitButtonIcon={<Send className="h-4 w-4" />}
          isLoading={isLoading}
          columns={2}
          gridGap={4}
          formSpacing={4}
        />
      </CardContent>
    </Card>
  );
}
