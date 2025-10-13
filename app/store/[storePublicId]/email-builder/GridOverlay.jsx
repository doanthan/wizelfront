"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from './splice-link.module.css';

export function GridOverlay({
  gridConfig,
  onGridUpdate,
  imageWidth,        // Natural width
  imageHeight,       // Natural height
  displayWidth,      // Display width
  displayHeight,     // Display height
  scrollContainer    // Ref to scroll container
}) {
  const [dragging, setDragging] = useState(null);
  const autoScrollInterval = useRef(null);

  // Calculate scale factors
  const scaleX = displayWidth / imageWidth;
  const scaleY = displayHeight / imageHeight;

  // Auto-scroll functionality
  const handleAutoScroll = useCallback((clientY) => {
    if (!scrollContainer || dragging?.type !== "row") return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const scrollThreshold = 50;  // pixels from edge to trigger scroll
    const scrollSpeed = 5;       // pixels per scroll step

    // Clear existing interval
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }

    // Scroll up if near top edge
    if (clientY - containerRect.top < scrollThreshold &&
        scrollContainer.scrollTop > 0) {
      autoScrollInterval.current = setInterval(() => {
        scrollContainer.scrollTop = Math.max(
          0,
          scrollContainer.scrollTop - scrollSpeed
        );
      }, 16);  // ~60fps
    }
    // Scroll down if near bottom edge
    else if (containerRect.bottom - clientY < scrollThreshold) {
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      if (scrollContainer.scrollTop < maxScroll) {
        autoScrollInterval.current = setInterval(() => {
          scrollContainer.scrollTop = Math.min(
            maxScroll,
            scrollContainer.scrollTop + scrollSpeed
          );
        }, 16);
      }
    }
  }, [scrollContainer, dragging]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  }, []);

  // Mouse down handler
  const handleMouseDown = useCallback((e, type, id, rowIndex) => {
    e.preventDefault();
    e.stopPropagation();

    const initialScrollTop = scrollContainer?.scrollTop || 0;

    if (type === "row") {
      const row = gridConfig.rows.find(r => r.id === id);
      if (row) {
        setDragging({
          type: "row",
          id,
          startY: e.clientY,
          startX: 0,
          originalY: row.y,
          originalX: 0,
          initialScrollTop
        });
      }
    } else if (type === "header-column") {
      const column = gridConfig.headerColumns?.find(c => c.id === id);
      if (column) {
        setDragging({
          type: "header-column",
          id,
          startX: e.clientX,
          startY: 0,
          originalX: column.x,
          originalY: 0,
          initialScrollTop
        });
      }
    } else if (type === "column") {
      const row = gridConfig.rows[rowIndex];
      const column = row?.columns.find(c => c.id === id);
      if (column) {
        setDragging({
          type: "column",
          id,
          rowIndex,
          startX: e.clientX,
          startY: 0,
          originalX: column.x,
          originalY: 0,
          initialScrollTop
        });
      }
    }
  }, [gridConfig, scrollContainer]);

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;

    if (dragging.type === "row") {
      // Handle row dragging with auto-scroll
      handleAutoScroll(e.clientY);

      // Calculate new Y position
      const containerRect = scrollContainer?.getBoundingClientRect();
      if (!containerRect) return;

      const mouseYRelativeToContainer =
        e.clientY - containerRect.top + (scrollContainer?.scrollTop || 0);
      const newY = Math.max(0, Math.min(
        imageHeight - 10,
        mouseYRelativeToContainer / scaleY
      ));

      // Apply constraints (don't overlap with adjacent rows)
      const currentRowIndex = gridConfig.rows.findIndex(r => r.id === dragging.id);
      const sortedRows = [...gridConfig.rows].sort((a, b) => a.y - b.y);

      const prevRow = currentRowIndex > 0 ? sortedRows[currentRowIndex - 1] : null;
      const nextRow = currentRowIndex < sortedRows.length - 1
        ? sortedRows[currentRowIndex + 1]
        : null;

      const minSpacing = 20;
      let constrainedY = newY;
      if (prevRow) {
        constrainedY = Math.max(constrainedY, prevRow.y + minSpacing);
      }
      if (nextRow) {
        constrainedY = Math.min(constrainedY, nextRow.y - minSpacing);
      }

      // Snap to 10px grid
      const snappedY = Math.round(constrainedY / 10) * 10;

      // Update grid config
      const updatedConfig = {
        ...gridConfig,
        rows: gridConfig.rows.map(row =>
          row.id === dragging.id ? { ...row, y: snappedY } : row
        )
      };
      onGridUpdate(updatedConfig);

    } else if (dragging.type === "header-column") {
      // Handle header column dragging
      const deltaX = (e.clientX - dragging.startX) / scaleX;
      const newX = Math.max(0, Math.min(
        imageWidth - 10,
        dragging.originalX + deltaX
      ));
      const snappedX = Math.round(newX / 10) * 10;

      const updatedConfig = {
        ...gridConfig,
        headerColumns: gridConfig.headerColumns?.map(col =>
          col.id === dragging.id ? { ...col, x: snappedX } : col
        ) || []
      };
      onGridUpdate(updatedConfig);

    } else if (dragging.type === "column") {
      // Handle regular column dragging
      const deltaX = (e.clientX - dragging.startX) / scaleX;
      const newX = Math.max(0, Math.min(
        imageWidth - 10,
        dragging.originalX + deltaX
      ));
      const snappedX = Math.round(newX / 10) * 10;

      const updatedConfig = {
        ...gridConfig,
        rows: gridConfig.rows.map((row, index) =>
          index === dragging.rowIndex
            ? {
                ...row,
                columns: row.columns.map(col =>
                  col.id === dragging.id ? { ...col, x: snappedX } : col
                )
              }
            : row
        )
      };
      onGridUpdate(updatedConfig);
    }
  }, [dragging, gridConfig, onGridUpdate, imageWidth, imageHeight, scaleX, scaleY, handleAutoScroll, scrollContainer]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setDragging(null);
    stopAutoScroll();
  }, [stopAutoScroll]);

  // Event listeners
  useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  // Render overlay
  return (
    <div
      className={styles.gridOverlay}
      style={{ width: displayWidth, height: displayHeight }}
    >
      {/* Render header columns */}
      {gridConfig.headerColumns?.map((column, colIndex) => {
        const headerHeight = gridConfig.rows.length > 0
          ? gridConfig.rows[0].y
          : imageHeight;

        return (
          <div
            key={column.id}
            className={styles.columnLine}
            style={{
              left: `${column.x * scaleX}px`,
              top: "0px",
              height: `${headerHeight * scaleY}px`
            }}
            onMouseDown={(e) => handleMouseDown(e, "header-column", column.id)}
          >
            <div className={styles.columnLabel}>
              Col {colIndex + 1}
            </div>
          </div>
        );
      })}

      {/* Render horizontal lines */}
      {gridConfig.rows.map((row, index) => (
        <div
          key={row.id}
          className={styles.rowLine}
          style={{ top: `${row.y * scaleY}px` }}
          onMouseDown={(e) => handleMouseDown(e, "row", row.id)}
        >
          <div className={styles.rowLabel}>
            Row {index + 1}
          </div>
        </div>
      ))}

      {/* Render columns for each line */}
      {gridConfig.rows.map((row, rowIndex) =>
        row.columns.map((column, colIndex) => {
          // Calculate column height (from this line to next line or bottom)
          const columnHeight = rowIndex < gridConfig.rows.length - 1
            ? gridConfig.rows[rowIndex + 1].y - row.y
            : imageHeight - row.y;

          return (
            <div
              key={column.id}
              className={styles.columnLine}
              style={{
                left: `${column.x * scaleX}px`,
                top: `${row.y * scaleY}px`,
                height: `${columnHeight * scaleY}px`
              }}
              onMouseDown={(e) => handleMouseDown(e, "column", column.id, rowIndex)}
            >
              <div className={styles.columnLabel}>
                Col {colIndex + 1}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
