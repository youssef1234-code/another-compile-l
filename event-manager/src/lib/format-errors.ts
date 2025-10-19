/**
 * Format TRPC/Zod validation errors into user-friendly messages
 * Handles ALL error formats dynamically - no hardcoded assumptions
 */
export function formatValidationErrors(error: unknown): string {
  console.log('🔍 Formatting error:', JSON.stringify(error, null, 2));

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
    firstName: 'First Name',
    lastName: 'Last Name',
    companyName: 'Company Name',
    studentId: 'Student/Staff ID',
    gucId: 'GUC ID',
    confirmPassword: 'Confirm Password',
    newPassword: 'New Password',
  };

  const formatFieldName = (field: string): string => {
    if (fieldNameMap[field]) return fieldNameMap[field];
    // Convert camelCase to Title Case
    const withSpaces = field.replace(/([A-Z])/g, ' $1').trim();
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  };

  // Try to extract meaningful error messages from any structure
  const extractMessages = (obj: any, messages: string[] = []): string[] => {
    if (!obj) return messages;

    // If it's a string, add it
    if (typeof obj === 'string') {
      if (obj.trim()) messages.push(obj);
      return messages;
    }

    // If it's an array, process each item
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        // Handle validation error objects: { message: "...", path: ["field"] }
        if (item && typeof item === 'object' && item.message) {
          const field = item.path?.[0] || item.field || null;
          const msg = field ? `${formatFieldName(String(field))}: ${item.message}` : item.message;
          messages.push(msg);
        } else {
          extractMessages(item, messages);
        }
      });
      return messages;
    }

    // If it's an object, recursively search for error messages
    if (typeof obj === 'object') {
      // Special handling for fieldErrors
      if (obj.fieldErrors && typeof obj.fieldErrors === 'object') {
        Object.entries(obj.fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
            errors.forEach(err => {
              messages.push(`${formatFieldName(field)}: ${err}`);
            });
          }
        });
        return messages;
      }

      // Special handling for formErrors
      if (obj.formErrors && Array.isArray(obj.formErrors)) {
        obj.formErrors.forEach((err: string) => messages.push(err));
        return messages;
      }

      // Recursively check all properties
      Object.values(obj).forEach(value => {
        extractMessages(value, messages);
      });
    }

    return messages;
  };

  try {
    // Type guard for error object
    const err = error as any;

    // First, try to parse message as JSON if it exists
    if (err?.message && typeof err.message === 'string') {
      try {
        const parsed = JSON.parse(err.message);
        const messages = extractMessages(parsed);
        if (messages.length > 0) {
          console.log('✅ Extracted from JSON message:', messages);
          return messages.join('\n');
        }
      } catch {
        // Not JSON, continue
      }
    }

    // Extract messages from the entire error object
    const messages = extractMessages(err);
    
    if (messages.length > 0) {
      console.log('✅ Extracted messages:', messages);
      return messages.join('\n');
    }

    // Fallback: use the message property or convert to string
    if (err?.message) {
      console.log('✅ Using plain message:', err.message);
      return err.message;
    }

    // Last resort: stringify the error
    if (typeof error === 'object') {
      const str = JSON.stringify(error);
      console.log('⚠️ Stringified error:', str);
      return str;
    }

    console.log('⚠️ Using fallback message');
    return 'An error occurred';
  } catch (e) {
    console.error('❌ Error formatting failed:', e);
    return 'An error occurred';
  }
}
