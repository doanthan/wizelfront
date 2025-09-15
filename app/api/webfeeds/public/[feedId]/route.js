import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import WebFeed from '@/models/WebFeed';

// Convert JSON to XML
function jsonToXML(obj, rootName = 'root') {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  
  function parseNode(node, nodeName) {
    let nodeXml = `<${nodeName}>`;
    
    if (typeof node === 'object' && !Array.isArray(node)) {
      for (const [key, value] of Object.entries(node)) {
        if (value !== undefined && value !== null) {
          nodeXml += parseNode(value, key);
        }
      }
    } else if (Array.isArray(node)) {
      return node.map(item => parseNode(item, nodeName.replace(/s$/, ''))).join('');
    } else {
      nodeXml += node;
    }
    
    nodeXml += `</${nodeName}>`;
    return nodeXml;
  }
  
  xml += parseNode(obj, rootName);
  return xml;
}

export async function GET(request, { params }) {
  try {
    const { feedId } = await params;
    
    await connectToDatabase();
    
    const webFeed = await WebFeed.findById(feedId);
    
    if (!webFeed || webFeed.status !== 'active') {
      return NextResponse.json(
        { error: 'Web feed not found or inactive' },
        { status: 404 }
      );
    }
    
    // Update last synced time
    webFeed.last_synced = new Date();
    await webFeed.save();
    
    const formattedData = webFeed.formatForKlaviyo();
    
    if (webFeed.feed_type === 'json') {
      return NextResponse.json(formattedData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      });
    } else {
      // Return XML
      const xmlData = jsonToXML(formattedData, 'catalog');
      return new NextResponse(xmlData, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  } catch (error) {
    console.error('Error serving web feed:', error);
    return NextResponse.json(
      { error: 'Failed to serve web feed' },
      { status: 500 }
    );
  }
}