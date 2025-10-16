# Bug Fixes Summary

## Issues Fixed

### 1. ✅ File Upload Validation Error (Base64 Encoding)

**Problem**: ImageGallery component was sending full data URL (`data:image/png;base64,iVBORw0KG...`) instead of just the base64 part, causing "File content does not match declared type" error.

**Root Cause**: `FileReader.readAsDataURL()` returns a data URL with MIME type prefix, but backend expects only the base64-encoded portion.

**Solution**: Extract base64 part from data URL before sending to backend.

**File Changed**: `event-manager/src/components/ui/image-gallery.tsx`

```tsx
// Before:
const base64 = reader.result as string;

// After:
const dataUrl = reader.result as string;
// Extract base64 part from data URL (remove "data:image/png;base64," prefix)
const base64 = dataUrl.split(',')[1];
```

**Impact**: Image uploads now work correctly in ImageGallery component.

---

### 2. ✅ Faculty Filter Including Null Values

**Problem**: When filtering by faculty in Events Management page, events without a faculty value (null/undefined) were incorrectly included in results.

**Root Cause**: TanStack Table's default filter function includes rows where the value is `null` or `undefined` when filter is active.

**Solution**: Added custom `filterFn` to faculty column that explicitly excludes null/undefined values.

**File Changed**: `event-manager/src/features/admin/components/events-table-columns.tsx`

```tsx
filterFn: (row, id, value) => {
  // Custom filter to exclude null/undefined values
  const faculty = row.getValue(id) as string | undefined;
  // If no filter is selected, show all
  if (!value || value.length === 0) return true;
  // Only include rows that have a faculty value AND it matches the filter
  return faculty ? value.includes(faculty) : false;
},
```

**Impact**: Faculty filter now only shows events that have the selected faculty value, excluding events without a faculty.

---

### 3. ✅ Create Event from Events Management Page - Multiple Images Support

**Problem**: CreateEventSheet (quick create from Events Management page) only supported single image upload via `imageUrl` field.

**Solution**: Updated CreateEventSheet to use ImageGallery component for multiple image uploads.

**File Changed**: `event-manager/src/features/events/components/CreateEventSheet.tsx`

**Changes Made**:
1. Replaced `imageUrl: ''` with `images: [] as string[]` in form state
2. Updated mutation payload: `images: formData.images && formData.images.length > 0 ? formData.images : undefined`
3. Replaced `ImageUpload` component with `ImageGallery`:
   ```tsx
   <ImageGallery
     value={formData.images}
     onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
     maxImages={10}
   />
   ```
4. Updated helper text to reflect multiple image support

**Impact**: Events Management page now supports creating events with up to 10 images via quick create sheet.

---

## Testing Checklist

### File Upload
- [x] Upload single image in ImageGallery
- [x] Upload multiple images (2-10)
- [x] Verify no "file tampering" errors
- [x] Verify base64 decoding works correctly on backend

### Faculty Filter
- [x] Filter by single faculty (e.g., MET)
- [x] Filter by multiple faculties
- [x] Verify null faculty events are excluded
- [x] Verify filter reset shows all events
- [x] Verify non-workshop events are not affected

### CreateEventSheet
- [x] Create event with no images
- [x] Create event with single image
- [x] Create event with multiple images (2-10)
- [x] Verify first image becomes primary
- [x] Test drag-drop reordering
- [x] Test image deletion
- [x] Verify images display correctly in events list
- [x] Verify images display correctly in event details carousel

---

## Files Modified

1. **event-manager/src/components/ui/image-gallery.tsx**
   - Fixed base64 encoding by extracting data from data URL

2. **event-manager/src/features/admin/components/events-table-columns.tsx**
   - Added custom `filterFn` to faculty column

3. **event-manager/src/features/events/components/CreateEventSheet.tsx**
   - Updated to use `images` array instead of `imageUrl`
   - Replaced `ImageUpload` with `ImageGallery`
   - Updated form state and mutation payload

---

## Related Documentation

See `IMAGE_GALLERY_IMPLEMENTATION.md` for complete implementation details of the image gallery feature.

---

## Status

✅ All three issues resolved and tested
✅ No compilation errors
✅ Backward compatible with existing `imageUrl` field
✅ Ready for production use
