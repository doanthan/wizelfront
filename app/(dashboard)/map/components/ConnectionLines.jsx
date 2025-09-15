"use client";

import { useEffect, useState, useCallback } from "react";

function ConnectionLine({ 
  sourcePos, 
  destPos, 
  isHovered = false, 
  mappingId,
  onHover 
}) {
  if (!sourcePos || !destPos) return null;

  // Calculate the control points for a smooth curve
  const dx = destPos.x - sourcePos.x;
  const dy = destPos.y - sourcePos.y;
  
  // Create a smooth S-curve
  const midX = sourcePos.x + dx * 0.6;
  const controlX1 = sourcePos.x + Math.abs(dx) * 0.4;
  const controlX2 = destPos.x - Math.abs(dx) * 0.4;

  const pathData = `
    M ${sourcePos.x} ${sourcePos.y}
    C ${controlX1} ${sourcePos.y},
      ${controlX2} ${destPos.y},
      ${destPos.x} ${destPos.y}
  `;

  return (
    <g>
      {/* Invisible thick line for easier hover detection */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => onHover?.(mappingId)}
        onMouseLeave={() => onHover?.(null)}
      />
      
      {/* Visible connection line */}
      <path
        d={pathData}
        stroke={isHovered ? "#8B5CF6" : "#60A5FA"}
        strokeWidth={isHovered ? "3" : "2"}
        fill="none"
        strokeDasharray={isHovered ? "none" : "5,5"}
        style={{
          filter: isHovered ? "drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))" : "none",
          transition: "all 0.2s ease"
        }}
        className="pointer-events-none"
      />
      
      {/* Source dot */}
      <circle
        cx={sourcePos.x}
        cy={sourcePos.y}
        r={isHovered ? "6" : "4"}
        fill="#60A5FA"
        stroke="#ffffff"
        strokeWidth="2"
        style={{
          filter: isHovered ? "drop-shadow(0 2px 4px rgba(96, 165, 250, 0.3))" : "none",
          transition: "all 0.2s ease"
        }}
        className="pointer-events-none"
      />
      
      {/* Destination dot */}
      <circle
        cx={destPos.x}
        cy={destPos.y}
        r={isHovered ? "6" : "4"}
        fill="#8B5CF6"
        stroke="#ffffff"
        strokeWidth="2"
        style={{
          filter: isHovered ? "drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))" : "none",
          transition: "all 0.2s ease"
        }}
        className="pointer-events-none"
      />

      {/* Animated flow dots */}
      {isHovered && (
        <>
          <circle r="2" fill="#60A5FA" opacity="0.8">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={pathData}
            />
          </circle>
          <circle r="2" fill="#8B5CF6" opacity="0.6">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={pathData}
              begin="0.5s"
            />
          </circle>
        </>
      )}
    </g>
  );
}

export default function ConnectionLines({ 
  mappings, 
  canvasRef, 
  hoveredConnection, 
  onConnectionHover 
}) {
  const [connections, setConnections] = useState([]);
  const [containerRect, setContainerRect] = useState(null);

  const calculateConnections = useCallback(() => {
    if (!canvasRef.current || mappings.size === 0) {
      setConnections([]);
      return;
    }

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setContainerRect(rect);

    const newConnections = [];

    mappings.forEach((source, fieldId) => {
      // Find source element
      const sourceSelector = `[data-source-path="${source.path}"]`;
      const sourceElement = container.querySelector(sourceSelector);
      
      // Find destination element  
      const destSelector = `[data-field-id="${fieldId}"]`;
      const destElement = container.querySelector(destSelector);

      if (sourceElement && destElement) {
        const sourceRect = sourceElement.getBoundingClientRect();
        const destRect = destElement.getBoundingClientRect();

        // Calculate positions relative to container
        const sourcePos = {
          x: sourceRect.right - rect.left,
          y: sourceRect.top + sourceRect.height / 2 - rect.top
        };

        const destPos = {
          x: destRect.left - rect.left,
          y: destRect.top + destRect.height / 2 - rect.top
        };

        newConnections.push({
          id: fieldId,
          sourcePos,
          destPos,
          source: source
        });
      }
    });

    setConnections(newConnections);
  }, [mappings, canvasRef]);

  // Recalculate connections when mappings change
  useEffect(() => {
    const timer = setTimeout(calculateConnections, 100);
    return () => clearTimeout(timer);
  }, [calculateConnections]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      calculateConnections();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateConnections]);

  // Recalculate when page loads or DOM changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      calculateConnections();
    });

    if (canvasRef.current?.parentElement) {
      observer.observe(canvasRef.current.parentElement, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => observer.disconnect();
  }, [calculateConnections]);

  if (!containerRect) return null;

  return (
    <g>
      {connections.map((connection) => (
        <ConnectionLine
          key={connection.id}
          sourcePos={connection.sourcePos}
          destPos={connection.destPos}
          isHovered={hoveredConnection === connection.id}
          mappingId={connection.id}
          onHover={onConnectionHover}
        />
      ))}
    </g>
  );
}