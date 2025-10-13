"use client";

import React, { useState } from 'react';
import styles from './email-builder.module.css';

/**
 * ImageTableBlock - Renders a table of spliced images
 * This component displays sliced images in a grid/table layout
 * optimized for email HTML output
 */
export default function ImageTableBlock({ block, isSelected, onClick }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!block.imageTableData) return null;

  const { rows, gridMetadata } = block.imageTableData;

  return (
    <div
      className={`${styles.imageTableBlock} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto'
      }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed'
        }}
      >
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.cells.map((cell, cellIndex) => {
                const cellKey = `${rowIndex}-${cellIndex}`;
                const isHovered = hoveredCell === cellKey;

                return (
                  <td
                    key={cellKey}
                    style={{
                      padding: 0,
                      margin: 0,
                      verticalAlign: 'top',
                      position: 'relative',
                      border: isHovered ? '2px solid #3b82f6' : '1px solid transparent',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={() => setHoveredCell(cellKey)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {cell.link ? (
                      <a
                        href={cell.link}
                        style={{
                          display: 'block',
                          textDecoration: 'none',
                          border: 'none'
                        }}
                        onClick={(e) => e.preventDefault()}
                      >
                        <img
                          src={cell.imageUrl}
                          alt={cell.altText || `Block ${cell.title}`}
                          width={cell.width}
                          height={cell.height}
                          style={{
                            display: 'block',
                            width: '100%',
                            height: 'auto',
                            border: 'none',
                            outline: 'none'
                          }}
                        />
                      </a>
                    ) : (
                      <img
                        src={cell.imageUrl}
                        alt={cell.altText || `Block ${cell.title}`}
                        width={cell.width}
                        height={cell.height}
                        style={{
                          display: 'block',
                          width: '100%',
                          height: 'auto',
                          border: 'none',
                          outline: 'none'
                        }}
                      />
                    )}

                    {/* Hover overlay with cell info */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          background: 'rgba(59, 130, 246, 0.9)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          pointerEvents: 'none',
                          zIndex: 10
                        }}
                      >
                        {cell.title}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Selection indicator */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />
      )}

      {/* Block info badge */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600,
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        Image Table ({rows.reduce((sum, row) => sum + row.cells.length, 0)} blocks)
      </div>
    </div>
  );
}

/**
 * Helper function to convert sliced images and blocks into table structure
 */
export function createImageTableData(slicedImages, blocks, gridConfig) {
  // Group blocks by row
  const rowGroups = {};

  blocks.forEach(block => {
    if (!rowGroups[block.rowIndex]) {
      rowGroups[block.rowIndex] = [];
    }
    rowGroups[block.rowIndex].push(block);
  });

  // Sort rows by index
  const sortedRowIndices = Object.keys(rowGroups).sort((a, b) => Number(a) - Number(b));

  // Create table structure
  const rows = sortedRowIndices.map(rowIndex => {
    const rowBlocks = rowGroups[rowIndex].sort((a, b) => a.colIndex - b.colIndex);

    const cells = rowBlocks.map(block => {
      const slicedImage = slicedImages.find(
        img => img.block.rowIndex === block.rowIndex && img.block.colIndex === block.colIndex
      );

      return {
        imageUrl: slicedImage ? slicedImage.dataUrl : '',
        width: block.width,
        height: block.height,
        link: block.link || '',
        altText: block.altText || '',
        title: block.title,
        rowIndex: block.rowIndex,
        colIndex: block.colIndex
      };
    });

    return { cells };
  });

  return {
    rows,
    gridMetadata: {
      originalWidth: gridConfig.width,
      originalHeight: gridConfig.height,
      totalBlocks: blocks.length,
      totalRows: rows.length
    }
  };
}

/**
 * Generate email-safe HTML for image table block
 */
export function generateImageTableHTML(block) {
  if (!block.imageTableData) return '';

  const { rows, gridMetadata } = block.imageTableData;

  let html = '<!-- Image Table Block -->\n';
  html += '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; border-collapse: collapse;">\n';

  rows.forEach((row, rowIndex) => {
    html += '  <tr>\n';

    row.cells.forEach((cell, cellIndex) => {
      html += `    <td width="${cell.width}" height="${cell.height}" style="padding: 0; margin: 0; vertical-align: top;">\n`;

      if (cell.link) {
        html += `      <a href="${cell.link}" style="display: block; text-decoration: none; border: none;">\n`;
      }

      html += `        <img src="${cell.imageUrl}" alt="${cell.altText}" width="${cell.width}" height="${cell.height}" style="display: block; width: 100%; height: auto; border: none; outline: none;" />\n`;

      if (cell.link) {
        html += '      </a>\n';
      }

      html += '    </td>\n';
    });

    html += '  </tr>\n';
  });

  html += '</table>\n';
  html += '<!-- End Image Table Block -->\n';

  return html;
}
