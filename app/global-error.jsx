"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1rem' }}>Something went wrong!</h2>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(to right, #60A5FA, #8B5CF6)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
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
