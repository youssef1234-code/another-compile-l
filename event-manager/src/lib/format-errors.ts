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

  // Helpers to sanitize and detect stack-like strings
  const isStackLine = (s: string): boolean => {
    const line = s.trim();
    return (
      /^at\s/.test(line) ||
      line.includes('node_modules') ||
      line.includes('node:internal') ||
      /\.(ts|js|tsx|jsx):\d+:\d+/.test(line)
    );
  };

  const sanitizeMessage = (s: string): string | null => {
    if (!s) return null;
    // Only keep the first line to avoid stack traces
    const firstLine = s.split('\n')[0];
    if (isStackLine(firstLine)) return null;
    // Ignore tRPC path-like identifiers (e.g., events.delete)
    if (/^[A-Za-z0-9_.-]+(?:\.[A-Za-z0-9_.-]+)+$/.test(firstLine)) return null;
    // Strip common prefixes
    const cleaned = firstLine
      .replace(/^TRPCClientError:\s*/i, '')
      .replace(/^TRPCError:\s*/i, '')
      .replace(/^Error:\s*/i, '')
      .trim();
    // Ignore non-informative generic words
    if (!cleaned) return null;
    return cleaned;
  };

  // Try to extract meaningful error messages from any structure
  const extractMessages = (obj: any, messages: string[] = []): string[] => {
    if (!obj) return messages;

    // If it's a string, add it
    if (typeof obj === 'string') {
      const cleaned = sanitizeMessage(obj);
      if (cleaned) messages.push(cleaned);
      return messages;
    }

    // If it's an array, process each item
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        // Handle validation error objects: { message: "...", path: ["field"] }
        if (item && typeof item === 'object' && item.message) {
          const field = item.path?.[0] || item.field || null;
          const cleaned = sanitizeMessage(item.message);
          if (cleaned) {
            const msg = field ? `${formatFieldName(String(field))}: ${cleaned}` : cleaned;
            messages.push(msg);
          }
        } else {
          extractMessages(item, messages);
        }
      });
      return messages;
    }

    // If it's an object, recursively search for error messages
    if (typeof obj === 'object') {
      // Direct message property on error-like objects
      if (typeof (obj as any).message === 'string') {
        const cleaned = sanitizeMessage((obj as any).message);
        if (cleaned) messages.push(cleaned);
      }

      // tRPC/Zod known shapes
      const zodErr = (obj as any).zodError || (obj as any).data?.zodError;
      if (zodErr) {
        if (zodErr.fieldErrors && typeof zodErr.fieldErrors === 'object') {
          Object.entries(zodErr.fieldErrors).forEach(([field, errs]) => {
            if (Array.isArray(errs)) {
              errs.forEach(e => {
                const cleaned = sanitizeMessage(String(e));
                if (cleaned) messages.push(`${formatFieldName(field)}: ${cleaned}`);
              });
            }
          });
        }
        if (Array.isArray(zodErr.formErrors)) {
          zodErr.formErrors.forEach((e: string) => {
            const cleaned = sanitizeMessage(e);
            if (cleaned) messages.push(cleaned);
          });
        }
      }

      // Special handling for fieldErrors
      if (obj.fieldErrors && typeof obj.fieldErrors === 'object') {
        Object.entries(obj.fieldErrors).forEach(([field, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
            errors.forEach(err => {
              const cleaned = sanitizeMessage(String(err));
              if (cleaned) messages.push(`${formatFieldName(field)}: ${cleaned}`);
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

      // Recursively check all properties, skipping noisy ones
      const skipKeys = new Set(['stack', 'stackTrace', 'name', 'code', 'status', 'httpStatus', 'shape', 'path', 'procedure']);
      Object.entries(obj).forEach(([key, value]) => {
        if (skipKeys.has(key)) return;
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
    let messages = extractMessages(err);
    // Deduplicate while preserving order
    messages = Array.from(new Set(messages));
    if (messages.length > 0) {
      console.log('✅ Extracted messages:', messages);
      return messages.join('\n');
    }

    // Fallback: use the message property or convert to string
    if (err?.message) {
      const cleaned = sanitizeMessage(err.message);
      if (cleaned) {
        console.log('✅ Using plain message:', cleaned);
        return cleaned;
      }
    }

    // Last resort: generic message
    console.log('⚠️ Using generic fallback message');
    return 'An error occurred';

  } catch (e) {
    console.error('❌ Error formatting failed:', e);
    return 'An error occurred';
  }
}
