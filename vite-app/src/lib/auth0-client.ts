// Client-side configuration for Auth0
// This file can be safely imported by client components

// We check for NEXT_PUBLIC_AUTH0_ENABLED which should be set to 'true' 
// when Auth0 is configured. This is needed because server-side env vars
// like AUTH0_SECRET are not available in client components.
export const isAuth0ConfiguredClient = process.env.NEXT_PUBLIC_AUTH0_ENABLED === 'true';
