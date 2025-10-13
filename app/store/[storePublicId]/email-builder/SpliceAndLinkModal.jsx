"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Plus, Minus, Download } from 'lucide-react';
import { GridOverlay } from './GridOverlay';
import styles from './splice-link.module.css';

// Helper functions for block calculation and image slicing
export function calculateBlocksFromGrid(gridConfig) {
  const blocks = [];

  // Sort rows by Y position
  const sortedRows = [...gridConfig.rows].sort((a, b) => a.y - b.y);

  // Process header row (Row 1)
  if (sortedRows.length === 0) {
    // No lines, entire image is one block
    if (gridConfig.headerColumns && gridConfig.headerColumns.length > 0) {
      const sortedCols = [...gridConfig.headerColumns].sort((a, b) => a.x - b.x);

      // Columns are dividing lines that split into N+1 sections
      const numBlocks = sortedCols.length + 1;

      for (let i = 0; i < numBlocks; i++) {
        const blockX = i === 0 ? 0 : sortedCols[i - 1].x;
        const blockWidth = i === numBlocks - 1
          ? gridConfig.width - blockX
          : sortedCols[i].x - blockX;

        blocks.push({
          rowIndex: 0,
          colIndex: i,
          x: blockX,
          y: 0,
          width: blockWidth,
          height: gridConfig.height,
          link: "",
          altText: "",
          title: `Block 1-${i + 1}`
        });
      }
    } else {
      // Single full-width block
      blocks.push({
        rowIndex: 0,
        colIndex: 0,
        x: 0,
        y: 0,
        width: gridConfig.width,
        height: gridConfig.height,
        link: "",
        altText: "",
        title: "Block 1-1"
      });
    }
  } else {
    // Process header section (above first line)
    const firstRowY = sortedRows[0].y;
    if (firstRowY > 0) {
      if (gridConfig.headerColumns && gridConfig.headerColumns.length > 0) {
        const sortedCols = [...gridConfig.headerColumns].sort((a, b) => a.x - b.x);

        // Columns are dividing lines that split the header into N+1 sections
        const numBlocks = sortedCols.length + 1;

        for (let i = 0; i < numBlocks; i++) {
          const blockX = i === 0 ? 0 : sortedCols[i - 1].x;
          const blockWidth = i === numBlocks - 1
            ? gridConfig.width - blockX
            : sortedCols[i].x - blockX;

          blocks.push({
            rowIndex: 0,
            colIndex: i,
            x: blockX,
            y: 0,
            width: blockWidth,
            height: firstRowY,
            link: "",
            altText: "",
            title: `Block 1-${i + 1}`
          });
        }
      } else {
        blocks.push({
          rowIndex: 0,
          colIndex: 0,
          x: 0,
          y: 0,
          width: gridConfig.width,
          height: firstRowY,
          link: "",
          altText: "",
          title: "Block 1-1"
        });
      }
    }

    // Process sections between lines and below last line
    sortedRows.forEach((row, rowIndex) => {
      const rowStartY = row.y;
      const rowEndY = rowIndex < sortedRows.length - 1
        ? sortedRows[rowIndex + 1].y
        : gridConfig.height;
      const rowHeight = rowEndY - rowStartY;

      if (rowHeight > 0 && row.columns && row.columns.length > 0) {
        const sortedCols = [...row.columns].sort((a, b) => a.x - b.x);

        // Columns are dividing lines that split the row into N+1 sections
        // For example: 1 column at x=500 creates 2 blocks: [0-500] and [500-width]
        const numBlocks = sortedCols.length + 1;

        for (let i = 0; i < numBlocks; i++) {
          const blockX = i === 0 ? 0 : sortedCols[i - 1].x;
          const blockWidth = i === numBlocks - 1
            ? gridConfig.width - blockX
            : sortedCols[i].x - blockX;

          blocks.push({
            rowIndex: rowIndex + 1,
            colIndex: i,
            x: blockX,
            y: rowStartY,
            width: blockWidth,
            height: rowHeight,
            link: "",
            altText: "",
            title: `Block ${rowIndex + 2}-${i + 1}`
          });
        }
      } else if (rowHeight > 0) {
        // No columns, full width block
        blocks.push({
          rowIndex: rowIndex + 1,
          colIndex: 0,
          x: 0,
          y: rowStartY,
          width: gridConfig.width,
          height: rowHeight,
          link: "",
          altText: "",
          title: `Block ${rowIndex + 2}-1`
        });
      }
    });
  }

  return blocks;
}

export async function sliceImage(imageUrl, blocks) {
  // Load image
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // Create canvas for slicing
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  const results = [];

  // Process each block
  for (const block of blocks) {
    // Set canvas size to block size
    canvas.width = block.width;
    canvas.height = block.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the specific block area from source image
    ctx.drawImage(
      img,
      block.x, block.y, block.width, block.height,  // source rectangle
      0, 0, block.width, block.height               // destination rectangle
    );

    // Convert to data URL and blob
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const blob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });

    results.push({ blob, block, dataUrl });
  }

  return results;
}

export function SpliceAndLinkModal({ isOpen, imageUrl, onClose, onApply }) {
  const [currentImage, setCurrentImage] = useState(imageUrl || "");
  const [importUrl, setImportUrl] = useState("");
  const [gridConfig, setGridConfig] = useState({
    imageUrl: "",
    width: 600,
    height: 400,
    rows: [],
    headerColumns: []
  });
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState({
    width: 600,
    height: 400
  });
  const [displayDimensions, setDisplayDimensions] = useState({
    width: 600,
    height: 400
  });
  const [blocks, setBlocks] = useState([]);
  const [slicedImages, setSlicedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Update current image when prop changes
  useEffect(() => {
    if (imageUrl) {
      setCurrentImage(imageUrl);
    }
  }, [imageUrl]);

  // File upload handler
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setCurrentImage(dataUrl);
      // Reset grid when new image loads
      setGridConfig({
        imageUrl: "",
        width: 600,
        height: 400,
        rows: [],
        headerColumns: []
      });
      setBlocks([]);
      setSlicedImages([]);
    };
    reader.readAsDataURL(file);
  }, []);

  // URL import handler
  const handleUrlImport = useCallback(() => {
    if (!importUrl.trim()) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setCurrentImage(importUrl);
      setImportUrl("");
      // Reset grid
      setGridConfig({
        imageUrl: "",
        width: 600,
        height: 400,
        rows: [],
        headerColumns: []
      });
      setBlocks([]);
      setSlicedImages([]);
    };
    img.onerror = () => {
      alert("Failed to load image from URL");
    };
    img.src = importUrl;
  }, [importUrl]);

  // Add line function
  const addLine = useCallback(() => {
    const newRowId = `row-${Date.now()}`;

    let newY = 100;  // Default: start first line at 100px from top

    if (gridConfig.rows.length > 0) {
      // Find the maximum Y position of existing lines
      const maxY = Math.max(...gridConfig.rows.map(row => row.y));
      newY = maxY + 80;  // Add 80px spacing below the last line
    }

    // Ensure line doesn't go beyond image bounds
    if (newY > imageNaturalDimensions.height - 50) {
      newY = imageNaturalDimensions.height - 50;
    }

    // Add new line to grid config
    setGridConfig(prev => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: newRowId,
          y: newY,
          columns: []
        }
      ]
    }));
  }, [gridConfig, imageNaturalDimensions]);

  // Remove line function
  const removeLine = useCallback((rowIndex) => {
    setGridConfig(prev => ({
      ...prev,
      rows: prev.rows.filter((_, index) => index !== rowIndex)
    }));
  }, []);

  // Add column function
  const addColumn = useCallback((rowIndex) => {
    if (rowIndex === 0) {
      // Adding column to header section
      if (gridConfig.headerColumns.length >= 8) return;

      const newColumnId = `header-col-${gridConfig.headerColumns.length + 1}`;

      // Place new column at 50% of remaining space on the right
      const lastColumnX = gridConfig.headerColumns.length > 0
        ? gridConfig.headerColumns[gridConfig.headerColumns.length - 1].x
        : 0;
      const remainingSpace = imageNaturalDimensions.width - lastColumnX;
      const newColumnX = lastColumnX + (remainingSpace / 2);

      const newColumns = [
        ...gridConfig.headerColumns,
        {
          id: newColumnId,
          x: newColumnX
        }
      ];

      setGridConfig(prev => ({
        ...prev,
        headerColumns: newColumns
      }));
      return;
    }

    // Adding column to a regular row (not header)
    const lineIndex = rowIndex - 1;
    if (lineIndex < 0 || lineIndex >= gridConfig.rows.length) return;

    const targetRow = gridConfig.rows[lineIndex];
    if (!targetRow || targetRow.columns.length >= 8) return;

    const newColumnId = `${targetRow.id}-col-${targetRow.columns.length + 1}`;

    // Place new column at 50% of remaining space on the right
    const lastColumnX = targetRow.columns.length > 0
      ? targetRow.columns[targetRow.columns.length - 1].x
      : 0;
    const remainingSpace = imageNaturalDimensions.width - lastColumnX;
    const newColumnX = lastColumnX + (remainingSpace / 2);

    const newColumns = [
      ...targetRow.columns,
      {
        id: newColumnId,
        x: newColumnX
      }
    ];

    // Update the specific line's columns
    setGridConfig(prev => ({
      ...prev,
      rows: prev.rows.map((r, index) =>
        index === lineIndex
          ? { ...r, columns: newColumns }
          : r
      )
    }));
  }, [gridConfig, imageNaturalDimensions]);

  // Remove column function
  const removeColumn = useCallback((rowIndex) => {
    if (rowIndex === 0) {
      // Remove from header
      if (gridConfig.headerColumns.length === 0) return;
      setGridConfig(prev => ({
        ...prev,
        headerColumns: prev.headerColumns.slice(0, -1)
      }));
      return;
    }

    const lineIndex = rowIndex - 1;
    if (lineIndex < 0 || lineIndex >= gridConfig.rows.length) return;

    setGridConfig(prev => ({
      ...prev,
      rows: prev.rows.map((r, index) =>
        index === lineIndex
          ? { ...r, columns: r.columns.slice(0, -1) }
          : r
      )
    }));
  }, [gridConfig]);

  // Generate blocks and slice image
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const calculatedBlocks = calculateBlocksFromGrid(gridConfig);
      setBlocks(calculatedBlocks);

      if (currentImage && calculatedBlocks.length > 0) {
        const sliced = await sliceImage(currentImage, calculatedBlocks);
        setSlicedImages(sliced);
      }
    } catch (error) {
      console.error("Error generating blocks:", error);
      alert("Failed to generate blocks. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [gridConfig, currentImage]);

  // Update display dimensions when image loads
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setImageNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setDisplayDimensions({
      width: img.offsetWidth,
      height: img.offsetHeight
    });
    setGridConfig(prev => ({
      ...prev,
      width: img.naturalWidth,
      height: img.naturalHeight,
      imageUrl: currentImage
    }));
  }, [currentImage]);

  // Update display dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        setDisplayDimensions({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const totalRows = gridConfig.rows.length + 1;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 100
          }}
        >
          <X size={20} />
        </button>

        <div className={styles.modalBody}>
          <div className={styles.contentArea}>
            {/* Image Display with Grid Overlay */}
            <div className={styles.imageSection} ref={scrollContainerRef}>
              <div className={styles.imageContainer}>
                <img
                  ref={imageRef}
                  src={currentImage || "/api/placeholder/600/400"}
                  alt="Email template"
                  className={styles.templateImage}
                  onLoad={handleImageLoad}
                />
                {currentImage && (
                  <GridOverlay
                    gridConfig={gridConfig}
                    onGridUpdate={setGridConfig}
                    imageWidth={imageNaturalDimensions.width}
                    imageHeight={imageNaturalDimensions.height}
                    displayWidth={displayDimensions.width}
                    displayHeight={displayDimensions.height}
                    scrollContainer={scrollContainerRef.current}
                  />
                )}
              </div>
            </div>

            {/* Rows Panel */}
            <div className={styles.rowsPanel}>
              <div className={styles.panelHeader}>
                <h3>Rows & Columns</h3>
                <button
                  className={styles.addLineButton}
                  onClick={addLine}
                >
                  <Plus size={16} />
                  Add Line
                </button>
              </div>

              <div className={styles.rowsList}>
                {Array.from({ length: totalRows }, (_, index) => {
                  const isFirstRow = index === 0;
                  const correspondingLineIndex = index - 1;
                  const hasCorrespondingLine =
                    correspondingLineIndex >= 0 &&
                    correspondingLineIndex < gridConfig.rows.length;
                  const row = hasCorrespondingLine
                    ? gridConfig.rows[correspondingLineIndex]
                    : null;

                  const rowColumns = isFirstRow
                    ? gridConfig.headerColumns
                    : (row?.columns || []);

                  return (
                    <div key={`row-${index}`} className={styles.rowCard}>
                      <div className={styles.rowCardHeader}>
                        <div className={styles.rowCardTitle}>
                          <div className={styles.rowIndicator}></div>
                          <span>
                            Row {index + 1}
                            {index === 0 && " (Header)"}
                          </span>
                        </div>

                        <div className={styles.rowCardActions}>
                          <button
                            className={styles.iconButton}
                            onClick={() => addColumn(index)}
                            disabled={rowColumns.length >= 8}
                            title="Add column"
                          >
                            <Plus size={14} />
                          </button>
                          {rowColumns.length > 0 && (
                            <button
                              className={styles.iconButton}
                              onClick={() => removeColumn(index)}
                              title="Remove column"
                            >
                              <Minus size={14} />
                            </button>
                          )}
                          {hasCorrespondingLine && (
                            <button
                              className={styles.iconButton}
                              onClick={() => removeLine(correspondingLineIndex)}
                              title="Remove line"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={styles.rowCardBody}>
                        <div className={styles.columnCount}>
                          {rowColumns.length} {rowColumns.length === 1 ? 'column' : 'columns'}
                        </div>
                        {rowColumns.length > 0 && (
                          <div className={styles.columnIndicators}>
                            {Array.from({ length: rowColumns.length }, (_, i) => (
                              <div key={i} className={styles.columnIndicator}></div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.modalActions}>
            <button
              className={styles.generateButton}
              onClick={handleGenerate}
              disabled={isGenerating || !currentImage}
            >
              {isGenerating ? 'Generating...' : 'Generate & Preview'}
            </button>
            {slicedImages.length > 0 && (
              <button
                className={styles.applyButton}
                onClick={() => onApply && onApply(slicedImages, blocks, gridConfig)}
              >
                Apply to Email
              </button>
            )}
          </div>

          {/* Preview Section */}
          {slicedImages.length > 0 && (
            <div className={styles.previewSection}>
              <h3>Generated Blocks ({slicedImages.length})</h3>
              <div className={styles.previewGrid}>
                {slicedImages.map((item, idx) => (
                  <div key={idx} className={styles.previewBlock}>
                    <img src={item.dataUrl} alt={item.block.title} />
                    <div className={styles.previewBlockInfo}>
                      <span>{item.block.title}</span>
                      <span className={styles.previewBlockSize}>
                        {item.block.width}×{item.block.height}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
