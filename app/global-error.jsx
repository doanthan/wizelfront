"use client";

// Note: global-error must be a Client Component and must include html and body tags
// This is a requirement in Next.js App Router for the root error boundary
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Something went wrong!</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>An unexpected error occurred. Please try refreshing the page.</p>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(to right, #60A5FA, #8B5CF6)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
