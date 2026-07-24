# Install Backend Dependencies

## Required Commands

After implementing the security features, you need to install the new dependencies:

```bash
# Navigate to backend directory
cd backend

# Install all dependencies including the new security packages
npm install
```

## New Dependencies Added

The following security dependencies have been added to `package.json`:

### Dependencies
- `sanitize-html@^2.11.0` - HTML sanitization for XSS protection

### Dev Dependencies  
- `@types/sanitize-html@^2.9.5` - TypeScript definitions for sanitize-html

## Post-Installation Steps

1. After running `npm install`, uncomment the sanitize-html import in `security.service.ts`:

```typescript
// Change this:
// import * as sanitizeHtml from 'sanitize-html'; // Temporarily commented until npm install is run

// To this:
import * as sanitizeHtml from 'sanitize-html';
```

2. Update the `sanitizeFieldValue` method to use the proper library:

```typescript
private sanitizeFieldValue(value: any): any {
  if (typeof value === 'string') {
    // Use sanitize-html library
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      textFilter: (text) => text.trim(),
    }).substring(0, 10000);
  }
  // ... rest of method
}
```

3. Remove the temporary `sanitizeHtml` function.

## Verification

After installation, you can verify everything is working by:

```bash
# Check if the package is installed
npm list sanitize-html

# Run the development server
npm run start:dev
```

The security features will be fully functional once the dependencies are installed.
