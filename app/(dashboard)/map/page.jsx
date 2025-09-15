"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  ArrowLeft, 
  GitBranch, 
  Database, 
  Target, 
  Zap, 
  ChevronRight, 
  ChevronDown,
  Link,
  Unlink
} from "lucide-react";

// Import our custom components
import SourceTree from "./components/SourceTree";
import DestinationFields from "./components/DestinationFields";
import ConnectionLines from "./components/ConnectionLines";

// Demo data for the field mapping interface
const DEMO_SOURCE_DATA = {
  "customer": {
    "id": "cust_12345",
    "email": "john.doe@example.com",
    "name": {
      "first": "John",
      "last": "Doe",
      "full": "John Doe"
    },
    "address": {
      "street": "123 Main St",
      "city": "San Francisco", 
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "phone": "+1-555-123-4567",
    "created_at": "2024-01-15T10:30:00Z",
    "subscription": {
      "plan": "premium",
      "status": "active",
      "next_billing": "2024-02-15T10:30:00Z"
    },
    "preferences": {
      "email_marketing": true,
      "sms_marketing": false,
      "timezone": "America/Los_Angeles"
    }
  },
  "order": {
    "id": "ord_67890",
    "total": 149.99,
    "currency": "USD",
    "items": [
      {
        "product_id": "prod_123",
        "name": "Premium Widget",
        "quantity": 2,
        "price": 74.99
      }
    ],
    "shipping": {
      "method": "express",
      "cost": 12.99,
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA"
      }
    },
    "payment": {
      "method": "credit_card",
      "last_four": "4242",
      "brand": "visa"
    }
  },
  "event": {
    "type": "purchase_completed",
    "timestamp": "2024-01-20T14:22:00Z",
    "session_id": "sess_abc123",
    "utm_source": "google",
    "utm_campaign": "winter_sale"
  }
};

const DEMO_DESTINATION_FIELDS = [
  {
    id: "contact_email",
    label: "Contact Email",
    type: "string",
    required: true,
    category: "Contact Information"
  },
  {
    id: "first_name", 
    label: "First Name",
    type: "string",
    required: false,
    category: "Contact Information"
  },
  {
    id: "last_name",
    label: "Last Name", 
    type: "string",
    required: false,
    category: "Contact Information"
  },
  {
    id: "full_name",
    label: "Full Name",
    type: "string", 
    required: false,
    category: "Contact Information"
  },
  {
    id: "phone_number",
    label: "Phone Number",
    type: "string",
    required: false,
    category: "Contact Information"
  },
  {
    id: "order_total",
    label: "Order Total",
    type: "number",
    required: false,
    category: "Order Data"
  },
  {
    id: "order_id",
    label: "Order ID",
    type: "string",
    required: false,
    category: "Order Data"
  },
  {
    id: "customer_id",
    label: "Customer ID", 
    type: "string",
    required: false,
    category: "Order Data"
  },
  {
    id: "event_type",
    label: "Event Type",
    type: "string",
    required: false,
    category: "Event Data"
  },
  {
    id: "timestamp",
    label: "Timestamp",
    type: "datetime",
    required: false,
    category: "Event Data"
  },
  {
    id: "utm_source",
    label: "UTM Source",
    type: "string",
    required: false,
    category: "Marketing Data"
  },
  {
    id: "utm_campaign", 
    label: "UTM Campaign",
    type: "string",
    required: false,
    category: "Marketing Data"
  }
];

export default function FieldMappingPage() {
  const [mappings, setMappings] = useState(new Map());
  const [expandedNodes, setExpandedNodes] = useState(new Set(["customer", "order", "event"]));
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const canvasRef = useRef(null);

  const toggleNode = (path) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSourceSelect = (path, value) => {
    setSelectedSource({ path, value });
    setSelectedDestination(null);
  };

  const handleDestinationSelect = (field) => {
    setSelectedDestination(field);
    
    if (selectedSource) {
      const newMappings = new Map(mappings);
      newMappings.set(field.id, selectedSource);
      setMappings(newMappings);
      setSelectedSource(null);
      setSelectedDestination(null);
    }
  };

  const removeMapping = (fieldId) => {
    const newMappings = new Map(mappings);
    newMappings.delete(fieldId);
    setMappings(newMappings);
  };

  const clearAllMappings = () => {
    setMappings(new Map());
    setSelectedSource(null);
    setSelectedDestination(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-purple-50 dark:from-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-gray dark:text-white flex items-center gap-3">
                <GitBranch className="h-8 w-8 text-sky-blue" />
                Field Mapping
              </h1>
              <p className="text-neutral-gray dark:text-gray-400 mt-2">
                Map JSON payload fields to destination schema with visual connections
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {mappings.size} mappings
              </Badge>
              {mappings.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllMappings}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mb-6 border-sky-blue/20 bg-sky-tint/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-sky-blue mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-gray dark:text-white mb-2">
                  How to Map Fields
                </h3>
                <div className="text-sm text-neutral-gray dark:text-gray-400 space-y-1">
                  <p>1. <strong>Select a source field</strong> from the JSON tree on the left</p>
                  <p>2. <strong>Click on a destination field</strong> on the right to create a mapping</p>
                  <p>3. <strong>Visual connections</strong> will appear showing your mappings</p>
                  <p>4. <strong>Hover over connections</strong> to highlight the mapped fields</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Mapping Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          {/* Source JSON Tree */}
          <Card className="relative">
            <CardHeader className="bg-gradient-to-r from-sky-blue/10 to-vivid-violet/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-sky-blue" />
                Source JSON Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <SourceTree
                data={DEMO_SOURCE_DATA}
                expandedNodes={expandedNodes}
                selectedSource={selectedSource}
                onToggle={toggleNode}
                onSelect={handleSourceSelect}
              />
            </CardContent>
          </Card>

          {/* Destination Fields */}
          <Card className="relative">
            <CardHeader className="bg-gradient-to-r from-vivid-violet/10 to-deep-purple/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-vivid-violet" />
                Destination Schema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DestinationFields
                fields={DEMO_DESTINATION_FIELDS}
                mappings={mappings}
                selectedDestination={selectedDestination}
                onSelect={handleDestinationSelect}
                onRemoveMapping={removeMapping}
              />
            </CardContent>
          </Card>

          {/* SVG Canvas for Connection Lines */}
          <svg
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: '100%', height: '100%' }}
          >
            <ConnectionLines
              mappings={mappings}
              canvasRef={canvasRef}
              hoveredConnection={hoveredConnection}
              onConnectionHover={setHoveredConnection}
            />
          </svg>
        </div>

        {/* Mapping Summary */}
        {mappings.size > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-green-600" />
                Active Mappings ({mappings.size})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(mappings).map(([fieldId, source]) => {
                  const destinationField = DEMO_DESTINATION_FIELDS.find(f => f.id === fieldId);
                  return (
                    <div 
                      key={fieldId}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-gray dark:text-white truncate">
                          {destinationField?.label}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-mono truncate">
                          {source.path}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMapping(fieldId)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}