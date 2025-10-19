/**
 * Format TRPC/Zod validation errors into user-friendly messages
 */
export function formatValidationErrors(error: unknown): string {
  // Field name mapping for better UX
  const fieldNameMap: Record<string, string> = {
    fullAgenda: 'Full Agenda',
    locationDetails: 'Location Details',
    startDate: 'Start Date',
    endDate: 'End Date',
    registrationDeadline: 'Registration Deadline',
    requiredBudget: 'Required Budget',
    fundingSource: 'Funding Source',
    extraResources: 'Extra Resources',
    professorName: 'Professor Name',
    professors: 'Professors',
    conferenceWebsite: 'Conference Website',
    sessionType: 'Session Type',
    rejectionReason: 'Rejection Reason',
    revisionNotes: 'Revision Notes',
  };

  const formatFieldName = (field: string): string => {
    if (fieldNameMap[field]) return fieldNameMap[field];
    // Convert camelCase to Title Case
    const withSpaces = field.replace(/([A-Z])/g, ' $1').trim();
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  };

  // Type guard for error object
  const err = error as { data?: { zodError?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] }; code?: string }; message?: string };

  // Handle TRPC Zod errors (fieldErrors format)
  if (err.data?.zodError?.fieldErrors) {
    const errors = err.data.zodError.fieldErrors;
    const messages: string[] = [];
    
    for (const [field, fieldErrors] of Object.entries(errors)) {
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        messages.push(`• ${formatFieldName(field)}: ${fieldErrors[0]}`);
      }
    }
    
    return messages.length > 0 
      ? `Validation Error:\n${messages.join('\n')}` 
      : 'Validation failed';
  }
  
  // Handle raw Zod errors (array format from backend)
  if (err.data?.code === 'BAD_REQUEST' && err.message) {
    try {
      const parsed = JSON.parse(err.message);
      if (Array.isArray(parsed)) {
        const messages = parsed.map((e: { path?: unknown[]; message: string }) => {
          const field = e.path?.[0] || 'Field';
          return `• ${formatFieldName(String(field))}: ${e.message}`;
        });
        return messages.length > 0 
          ? `Validation Error:\n${messages.join('\n')}` 
          : 'Validation failed';
      }
    } catch {
      // Not JSON, use as-is
    }
  }
  
  // Handle formErrors (non-field-specific errors)
  if (err.data?.zodError?.formErrors && err.data.zodError.formErrors.length > 0) {
    return `Validation Error:\n${err.data.zodError.formErrors.join('\n')}`;
  }
  
  return err.message || 'An error occurred';
}
