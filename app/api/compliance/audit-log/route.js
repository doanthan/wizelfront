import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import AuditLog from '@/models/AuditLog';

// Lightweight endpoint for audit logging
export async function POST(request) {
  try {
    // Parse the audit entry
    const auditEntry = await request.json();
    
    // Quick validation
    if (!auditEntry.action || !auditEntry.ip) {
      return NextResponse.json({ error: 'Invalid audit entry' }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Create audit log entry (fire and forget for performance)
    AuditLog.logAction(auditEntry).catch(console.error);
    
    // Return immediately to avoid blocking
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't fail the request if audit logging fails
    return NextResponse.json({ success: false });
  }
}