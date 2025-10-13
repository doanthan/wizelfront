"use client";

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AuthDebug() {
  const { data: session, status } = useSession();
  const params = useParams();
  const storePublicId = params?.storePublicId;
  const [apiTest, setApiTest] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && storePublicId) {
      // Test the API call
      fetch(`/api/store/${storePublicId}/brand-settings`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => setApiTest({ success: true, data }))
        .catch(err => setApiTest({ success: false, error: err.message }));
    }
  }, [status, storePublicId]);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      background: 'white',
      border: '2px solid #333',
      borderRadius: 8,
      padding: isMinimized ? '8px 12px' : 16,
      maxWidth: 400,
      fontSize: 12,
      fontFamily: 'monospace',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMinimized ? 0 : 12
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 'bold' }}>
          🔐 Auth Debug
        </h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          title={isMinimized ? 'Expand' : 'Minimize'}
        >
          {isMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div style={{ marginBottom: 8 }}>
            <strong>Session Status:</strong> {status}
          </div>

          {session && (
            <div style={{ marginBottom: 8 }}>
              <strong>User:</strong> {session.user?.email || 'Unknown'}
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <strong>Store ID:</strong> {storePublicId || 'Not found'}
          </div>

          {apiTest && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ccc' }}>
              <strong>API Test:</strong>
              <pre style={{
                margin: '4px 0 0 0',
                padding: 8,
                background: '#f5f5f5',
                borderRadius: 4,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {JSON.stringify(apiTest, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
