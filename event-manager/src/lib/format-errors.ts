/**
 * Format TRPC/Zod validation errors into user-friendly messages
 */
export function formatValidationErrors(error: any): string {
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

  // Handle TRPC Zod errors (fieldErrors format)
  if (error.data?.zodError?.fieldErrors) {
    const errors = error.data.zodError.fieldErrors;
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
  if (error.data?.code === 'BAD_REQUEST' && error.message) {
    try {
      const parsed = JSON.parse(error.message);
      if (Array.isArray(parsed)) {
        const messages = parsed.map((err: any) => {
          const field = err.path?.[0] || 'Field';
          return `• ${formatFieldName(field)}: ${err.message}`;
        });
        return messages.length > 0 
          ? `Validation Error:\n${messages.join('\n')}` 
          : 'Validation failed';
      }
    } catch (e) {
      // Not JSON, use as-is
    }
  }
  
  // Handle formErrors (non-field-specific errors)
  if (error.data?.zodError?.formErrors && error.data.zodError.formErrors.length > 0) {
    return `Validation Error:\n${error.data.zodError.formErrors.join('\n')}`;
  }
  
  return error.message || 'An error occurred';
}
