"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Line, Text as KonvaText, Transformer } from 'react-konva';
import {
  X, Type, Square, Circle as CircleIcon, Upload, Trash2,
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  ZoomIn, ZoomOut, Grid, Undo2, Redo2, Download, Copy,
  Eye, EyeOff, ChevronUp, ChevronDown, Scissors, Image as ImageIcon,
  Layers, Clipboard, Lock, Unlock, ArrowUp, ArrowDown, FlipHorizontal,
  FlipVertical, RotateCw
} from 'lucide-react';
import styles from './image-editor.module.css';

// Professional snap settings (Figma-style)
const SNAP_THRESHOLD = 5; // Tighter snap for precision
const GRID_SIZE = 20; // 20px grid like Figma

// Performance utility: Throttle function to limit execution rate
const throttle = (func, delay) => {
  let lastCall = 0;
  let lastResult;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall < delay) {
      return lastResult;
    }
    lastCall = now;
    lastResult = func.apply(this, args);
    return lastResult;
  };
};

const ImageEditorModal = ({ isOpen, imageUrl, onClose, onSave }) => {
  // Core state
  const [layers, setLayers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [tool, setTool] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });

  // UI state
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [copiedLayers, setCopiedLayers] = useState([]);
  const [editingTextId, setEditingTextId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedLayerId, setDraggedLayerId] = useState(null);
  const [dragOverLayerId, setDragOverLayerId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [showCanvasBoundary, setShowCanvasBoundary] = useState(true);

  // Enhanced guides
  const [smartGuides, setSmartGuides] = useState([]);
  const [sliceMode, setSliceMode] = useState(false);
  const [sliceGrid, setSliceGrid] = useState({ rows: 2, cols: 2 });

  // History
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Refs
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const fileInputRef = useRef(null);
  const layerNodesRef = useRef(new Map());
  const transformerStyleConfigRef = useRef({
    cornerSize: 14,
    sideLength: 26,
    sideThickness: 10,
    rotateSize: 16,
    rotateAnchorOffset: 26,
    borderWidth: 2,
    handleGap: 0,
    rotateGap: 12,
    borderColor: '#2563EB',
    anchorFill: '#ffffff',
    rotateFill: '#60A5FA',
    rotateStroke: '#2563EB',
  });
  const containerRef = useRef(null);

  // History management - using functional updates for better performance (defined early for use in effects)
  const addToHistory = useCallback((newLayers) => {
    // Serialize layers, ensuring imageSrc is preserved for image layers
    const serializedLayers = newLayers.map(layer => {
      const layerCopy = { ...layer };

      // For image layers, ensure imageSrc is stored
      if (layer.type === 'image' && layer.image) {
        if (!layerCopy.imageSrc) {
          // Try to get from image.src
          layerCopy.imageSrc = layer.image.src;
        }
        // Remove the image object itself (can't be serialized)
        delete layerCopy.image;
      }

      return layerCopy;
    });

    // Use a ref-based approach to get current step, then update both
    setHistoryStep(prevStep => {
      const trimPoint = prevStep + 1;
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, trimPoint);
        newHistory.push(serializedLayers);
        return newHistory;
      });
      return trimPoint; // This will be the new index (prevStep + 1)
    });
  }, []); // No dependencies!

  // Auto-focus container when modal opens for keyboard/paste events
  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isOpen]);

  // Initialize with base image
  useEffect(() => {
    if (!isOpen || !imageUrl) {
      setLayers([]);
      setSelectedIds([]);
      setHistory([]);
      setHistoryStep(-1);
      setZoom(1);
      setStagePos({ x: 0, y: 0 });
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const baseLayer = {
        id: `layer-${Date.now()}`,
        type: 'image',
        name: 'Background',
        image: img,
        imageSrc: imageUrl, // Store the source for history restoration
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
        originalWidth: img.width,
        originalHeight: img.height,
        // Crop properties for smart resizing
        crop: {
          x: 0,
          y: 0,
          width: img.width,
          height: img.height
        },
        visible: true,
        locked: false,
        rotation: 0
      };

      setStageSize({ width: img.width, height: img.height });
      const initialState = [baseLayer];
      setLayers(initialState);
      addToHistory(initialState);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl, addToHistory]);

  const undo = useCallback(async () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const previousState = history[historyStep - 1].map(layer => ({ ...layer }));

      // Restore images - wait for them to load
      const imageLoadPromises = previousState.map(layer => {
        if (layer.type === 'image' && layer.imageSrc) {
          return new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              layer.image = img;
              resolve();
            };
            img.onerror = () => {
              console.error('Failed to load image:', layer.imageSrc);
              resolve(); // Resolve anyway to not block
            };
            img.src = layer.imageSrc;
          });
        }
        return Promise.resolve();
      });

      await Promise.all(imageLoadPromises);
      setLayers(previousState);
    }
  }, [history, historyStep]);

  const redo = useCallback(async () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const nextState = history[historyStep + 1].map(layer => ({ ...layer }));

      // Restore images - wait for them to load
      const imageLoadPromises = nextState.map(layer => {
        if (layer.type === 'image' && layer.imageSrc) {
          return new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              layer.image = img;
              resolve();
            };
            img.onerror = () => {
              console.error('Failed to load image:', layer.imageSrc);
              resolve(); // Resolve anyway to not block
            };
            img.src = layer.imageSrc;
          });
        }
        return Promise.resolve();
      });

      await Promise.all(imageLoadPromises);
      setLayers(nextState);
    }
  }, [history, historyStep]);

  // Update layers with history
  const updateLayers = useCallback((newLayers) => {
    setLayers(newLayers);
    addToHistory(newLayers);
  }, [addToHistory]);

  // Toggle layer lock/unlock
  const toggleLayerLock = useCallback((id) => {
    const newLayers = layers.map(layer =>
      layer.id === id ? { ...layer, locked: !layer.locked } : layer
    );
    updateLayers(newLayers);
  }, [layers, updateLayers]);

  // Layer manipulation handlers (defined early for keyboard shortcuts)
  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return;

    const layersToCopy = selectedIds
      .map(id => layers.find(l => l.id === id))
      .filter(Boolean);

    // Deep copy the layers, preserving image data
    const copied = layersToCopy.map(layer => {
      const layerCopy = { ...layer };

      // For image layers, preserve the imageSrc for reconstruction
      if (layer.type === 'image' && layer.image) {
        if (!layer.imageSrc) {
          // If imageSrc doesn't exist, try to get it from the image element
          layerCopy.imageSrc = layer.image.src;
        }
      }

      return layerCopy;
    });

    setCopiedLayers(copied);
  }, [selectedIds, layers]);

  const handlePasteFromCopy = useCallback(() => {
    if (copiedLayers.length === 0) return;

    const newLayers = [];
    copiedLayers.forEach(layer => {
      const newLayer = {
        ...layer,
        id: `layer-${Date.now()}-${Math.random()}`,
        name: `${layer.name} Copy`,
        x: (layer.x || 0) + 20,
        y: (layer.y || 0) + 20
      };

      // For image layers, need to recreate the Image object
      if (layer.type === 'image' && layer.imageSrc) {
        const img = new window.Image();
        img.onload = () => {
          newLayer.image = img;
          setLayers(prev => {
            const updated = [...prev, newLayer];
            addToHistory(updated);
            return updated;
          });
          setSelectedIds([newLayer.id]);
        };
        img.src = layer.imageSrc;
      } else {
        newLayers.push(newLayer);
      }
    });

    if (newLayers.length > 0) {
      updateLayers([...layers, ...newLayers]);
      setSelectedIds(newLayers.map(l => l.id));
    }
  }, [copiedLayers, layers, updateLayers, addToHistory]);

  const handleDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return;

    const newLayers = [];
    selectedIds.forEach(id => {
      const layer = layers.find(l => l.id === id);
      if (layer) {
        const newLayer = {
          ...layer,
          id: Date.now() + Math.random(),
          name: `${layer.name} Copy`,
          x: (layer.x || 0) + 20,
          y: (layer.y || 0) + 20
        };
        newLayers.push(newLayer);
      }
    });

    updateLayers([...layers, ...newLayers]);
    setSelectedIds(newLayers.map(l => l.id));
  }, [selectedIds, layers, updateLayers]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const newLayers = layers.filter(l => !selectedIds.includes(l.id));
    updateLayers(newLayers);
    setSelectedIds([]);
  }, [selectedIds, layers, updateLayers]);

  const applyTransformerHandleStyles = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const config = transformerStyleConfigRef.current;
    // Scale handles inversely with zoom, with max size constraint
    const effectiveZoom = Math.max(zoom, 0.5); // Prevent handles from getting too large
    const borderStrokeWidth = (config.borderWidth ?? 2) / effectiveZoom;
    const cornerHandleSize = (config.cornerSize ?? 16) / effectiveZoom;
    const sideHandleLength = (config.sideLength ?? 34) / effectiveZoom;
    const sideHandleThickness = (config.sideThickness ?? 12) / effectiveZoom;
    const rotateSize = (config.rotateSize ?? 18) / effectiveZoom;
    const rotateAnchorOffset = (config.rotateAnchorOffset ?? 28) / effectiveZoom;
    const glowBlur = 10 / effectiveZoom;
    const handleGap = (config.handleGap ?? 0) / effectiveZoom;

    transformer.anchorStroke(config.borderColor ?? '#2563EB');
    transformer.anchorFill(config.anchorFill ?? '#ffffff');
    transformer.anchorStrokeWidth(borderStrokeWidth);
    transformer.borderStroke(config.borderColor ?? '#2563EB');
    transformer.borderStrokeWidth(borderStrokeWidth);
    transformer.padding(0);
    transformer.rotateAnchorOffset(rotateAnchorOffset);

    transformer.anchorStyleFunc((anchor) => {
      const isCorner = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].some(name => anchor.hasName(name));
      const isHorizontal = ['top-center', 'bottom-center'].some(name => anchor.hasName(name));
      const isVertical = ['middle-left', 'middle-right'].some(name => anchor.hasName(name));
      const isRotate = anchor.hasName('rotater');

      anchor.stroke((isRotate ? config.rotateStroke : config.borderColor) ?? '#2563EB');
      anchor.strokeWidth(isRotate ? 1.5 / zoom : borderStrokeWidth);
      anchor.fill(isRotate ? (config.rotateFill ?? '#60A5FA') : (config.anchorFill ?? '#ffffff'));
      anchor.shadowColor('rgba(37, 99, 235, 0.35)');
      anchor.shadowBlur(isRotate ? glowBlur * 1.1 : glowBlur);
      anchor.shadowOpacity(isRotate ? 0.5 : 0.35);
      anchor.shadowOffsetX(0);
      anchor.shadowOffsetY(0);
      anchor.hitStrokeWidth(Math.max(sideHandleLength, sideHandleThickness));

      if (isCorner) {
        anchor.width(cornerHandleSize);
        anchor.height(cornerHandleSize);
        anchor.offsetX(cornerHandleSize / 2);
        anchor.offsetY(cornerHandleSize / 2);
        anchor.cornerRadius(4 / zoom);
      } else if (isHorizontal) {
        anchor.width(sideHandleLength);
        anchor.height(sideHandleThickness);
        anchor.offsetX(sideHandleLength / 2);
        anchor.offsetY(sideHandleThickness / 2 + (anchor.hasName('top-center') ? -handleGap : handleGap));
        anchor.cornerRadius(sideHandleThickness / 2);
      } else if (isVertical) {
        anchor.width(sideHandleThickness);
        anchor.height(sideHandleLength);
        anchor.offsetX(sideHandleThickness / 2 + (anchor.hasName('middle-left') ? -handleGap : handleGap));
        anchor.offsetY(sideHandleLength / 2);
        anchor.cornerRadius(sideHandleThickness / 2);
      } else if (isRotate) {
        anchor.width(rotateSize);
        anchor.height(rotateSize);
        anchor.offsetX(rotateSize / 2);
        anchor.offsetY(rotateSize / 2 + (config.rotateGap ?? 12) / zoom);
        anchor.cornerRadius(rotateSize / 2);
      }
    });

    const rotateLine = transformer.findOne('.rotater-line');
    if (rotateLine) {
      rotateLine.stroke('#2563EB');
      rotateLine.strokeWidth(1.5 / zoom);
    }

    transformer.getLayer()?.batchDraw();
  }, [zoom]);

  // Transformer management with enhanced styling
  useEffect(() => {
    if (!transformerRef.current || selectedIds.length === 0) {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return;
    }

    const selectedNodes = selectedIds
      .map(id => layerNodesRef.current.get(id))
      .filter(node => node);

    const transformer = transformerRef.current;
    if (selectedNodes.length > 0) {
      transformer.nodes(selectedNodes);

      // Configure transformer based on layer type
      const selectedLayers = selectedIds.map(id => layers.find(l => l.id === id)).filter(Boolean);
      const hasImageOrCircle = selectedLayers.some(layer => layer.type === 'image' || layer.type === 'circle');
      const isOnlyText = selectedLayers.length === 1 && selectedLayers[0].type === 'text';

      const baseStyle = {
        cornerSize: 14,
        sideLength: 24,
        sideThickness: 9,
        rotateSize: 16,
        rotateAnchorOffset: 26,
        borderWidth: 2,
        handleGap: 0,
        rotateGap: 12,
        borderColor: '#2563EB',
        anchorFill: '#ffffff',
        rotateFill: '#60A5FA',
        rotateStroke: '#2563EB',
      };

      let styleConfig = baseStyle;

      if (isOnlyText) {
        styleConfig = {
          ...baseStyle,
          cornerSize: 11,
          sideLength: 18,
          sideThickness: 7,
          rotateSize: 14,
          rotateAnchorOffset: 32,
          borderWidth: 1.6,
          rotateGap: 10,
        };
      } else if (hasImageOrCircle) {
        styleConfig = {
          ...baseStyle,
          sideLength: 22,
          sideThickness: 8,
          rotateAnchorOffset: 30,
        };
      }

      transformerStyleConfigRef.current = styleConfig;

      // Text: corner handles + horizontal middle handles
      if (isOnlyText) {
        transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']);
        transformer.rotateEnabled(true);
        transformer.keepRatio(false);
      } else {
        // All other elements: full transform controls
        transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'middle-right', 'middle-left', 'bottom-center']);
        transformer.rotateEnabled(true);
        transformer.keepRatio(hasImageOrCircle);
      }

      applyTransformerHandleStyles();
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }

  }, [selectedIds, zoom, layers, applyTransformerHandleStyles]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }

      // Paste - don't handle here, let the paste event handler below handle it
      // This allows both copying existing layers AND pasting images from clipboard

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }

      // Deselect
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }

      // Grid toggle
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        setShowGrid(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, undo, redo, selectedIds, layers, handleDeleteSelected, handleCopy, handleDuplicate]);

  // Context menu handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      // Close context menu on click outside
      if (contextMenu && !e.target.closest(`.${styles.contextMenu}`)) {
        setContextMenu(null);
      }
    };

    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, contextMenu]);

  // Paste image from clipboard or copied layers
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Check if there's an image in clipboard
      let hasImage = false;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          hasImage = true;
          e.preventDefault();
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
              // Smart sizing: scale down if image is too large for canvas
              const padding = 100; // Leave 100px padding around the image
              const maxWidth = stageSize.width - padding;
              const maxHeight = stageSize.height - padding;

              let finalWidth = img.width;
              let finalHeight = img.height;

              // Check if image exceeds canvas bounds
              if (img.width > maxWidth || img.height > maxHeight) {
                // Calculate scale to fit within bounds while maintaining aspect ratio
                const scaleX = maxWidth / img.width;
                const scaleY = maxHeight / img.height;
                const scale = Math.min(scaleX, scaleY);

                finalWidth = img.width * scale;
                finalHeight = img.height * scale;
              }

              // Center the image on canvas
              const x = (stageSize.width - finalWidth) / 2;
              const y = (stageSize.height - finalHeight) / 2;

              const newLayer = {
                id: `layer-${Date.now()}`,
                type: 'image',
                name: `Image ${layers.length + 1}`,
                image: img,
                imageSrc: event.target.result,
                x: x,
                y: y,
                width: finalWidth,
                height: finalHeight,
                originalWidth: img.width,
                originalHeight: img.height,
                // Crop properties for smart resizing
                crop: {
                  x: 0,
                  y: 0,
                  width: img.width,
                  height: img.height
                },
                visible: true,
                locked: false,
                rotation: 0
              };
              updateLayers([...layers, newLayer]);
              setSelectedIds([newLayer.id]);
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(blob);
          break; // Only paste first image
        }
      }

      // If no image in clipboard, paste from copied layers (internal copy)
      if (!hasImage && copiedLayers.length > 0) {
        e.preventDefault();
        handlePasteFromCopy();
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, layers, updateLayers, copiedLayers, stageSize.width, stageSize.height, handlePasteFromCopy]);

  // Get layer bounds
  const getLayerBounds = useCallback((layer) => {
    const x = layer.x || 0;
    const y = layer.y || 0;
    const width = layer.width || (layer.radius ? layer.radius * 2 : 0);
    const height = layer.height || (layer.radius ? layer.radius * 2 : 0);

    return {
      left: x,
      right: x + width,
      top: y,
      bottom: y + height,
      centerX: x + width / 2,
      centerY: y + height / 2,
      width,
      height
    };
  }, []);

  // Enhanced smart guides detection
  const detectSmartGuides = useCallback((currentLayer, currentBounds) => {
    const guides = [];
    const threshold = SNAP_THRESHOLD / zoom;

    // Canvas center guides
    const canvasCenterX = stageSize.width / 2;
    const canvasCenterY = stageSize.height / 2;

    if (Math.abs(currentBounds.centerX - canvasCenterX) < threshold) {
      guides.push({
        type: 'vertical',
        position: canvasCenterX,
        label: 'Center',
        color: '#ff00ff'
      });
    }

    if (Math.abs(currentBounds.centerY - canvasCenterY) < threshold) {
      guides.push({
        type: 'horizontal',
        position: canvasCenterY,
        label: 'Center',
        color: '#ff00ff'
      });
    }

    // Canvas edge guides
    if (Math.abs(currentBounds.left) < threshold) {
      guides.push({
        type: 'vertical',
        position: 0,
        label: '0',
        color: '#00ff00'
      });
    }

    if (Math.abs(currentBounds.right - stageSize.width) < threshold) {
      guides.push({
        type: 'vertical',
        position: stageSize.width,
        label: `${stageSize.width}`,
        color: '#00ff00'
      });
    }

    if (Math.abs(currentBounds.top) < threshold) {
      guides.push({
        type: 'horizontal',
        position: 0,
        label: '0',
        color: '#00ff00'
      });
    }

    if (Math.abs(currentBounds.bottom - stageSize.height) < threshold) {
      guides.push({
        type: 'horizontal',
        position: stageSize.height,
        label: `${stageSize.height}`,
        color: '#00ff00'
      });
    }

    // Compare with other layers
    layers.forEach(layer => {
      if (layer.id === currentLayer.id || !layer.visible || selectedIds.includes(layer.id)) return;

      const otherBounds = getLayerBounds(layer);

      // Edge to edge alignment
      // Left edges
      if (Math.abs(currentBounds.left - otherBounds.left) < threshold) {
        guides.push({
          type: 'vertical',
          position: otherBounds.left,
          label: 'Align Left',
          color: '#ff00ff',
          snapX: otherBounds.left
        });
      }

      // Right edges
      if (Math.abs(currentBounds.right - otherBounds.right) < threshold) {
        guides.push({
          type: 'vertical',
          position: otherBounds.right,
          label: 'Align Right',
          color: '#ff00ff',
          snapX: otherBounds.right - currentBounds.width
        });
      }

      // Top edges
      if (Math.abs(currentBounds.top - otherBounds.top) < threshold) {
        guides.push({
          type: 'horizontal',
          position: otherBounds.top,
          label: 'Align Top',
          color: '#ff00ff',
          snapY: otherBounds.top
        });
      }

      // Bottom edges
      if (Math.abs(currentBounds.bottom - otherBounds.bottom) < threshold) {
        guides.push({
          type: 'horizontal',
          position: otherBounds.bottom,
          label: 'Align Bottom',
          color: '#ff00ff',
          snapY: otherBounds.bottom - currentBounds.height
        });
      }

      // Center alignment
      if (Math.abs(currentBounds.centerX - otherBounds.centerX) < threshold) {
        guides.push({
          type: 'vertical',
          position: otherBounds.centerX,
          label: 'Center Vertical',
          color: '#ff00ff',
          snapX: otherBounds.centerX - currentBounds.width / 2
        });
      }

      if (Math.abs(currentBounds.centerY - otherBounds.centerY) < threshold) {
        guides.push({
          type: 'horizontal',
          position: otherBounds.centerY,
          label: 'Center Horizontal',
          color: '#ff00ff',
          snapY: otherBounds.centerY - currentBounds.height / 2
        });
      }

      // Edge to center alignment
      if (Math.abs(currentBounds.left - otherBounds.centerX) < threshold) {
        guides.push({
          type: 'vertical',
          position: otherBounds.centerX,
          label: '',
          color: '#ff00ff',
          snapX: otherBounds.centerX
        });
      }

      if (Math.abs(currentBounds.right - otherBounds.centerX) < threshold) {
        guides.push({
          type: 'vertical',
          position: otherBounds.centerX,
          label: '',
          color: '#ff00ff',
          snapX: otherBounds.centerX - currentBounds.width
        });
      }

      if (Math.abs(currentBounds.top - otherBounds.centerY) < threshold) {
        guides.push({
          type: 'horizontal',
          position: otherBounds.centerY,
          label: '',
          color: '#ff00ff',
          snapY: otherBounds.centerY
        });
      }

      if (Math.abs(currentBounds.bottom - otherBounds.centerY) < threshold) {
        guides.push({
          type: 'horizontal',
          position: otherBounds.centerY,
          label: '',
          color: '#ff00ff',
          snapY: otherBounds.centerY - currentBounds.height
        });
      }

      // Same size detection
      if (Math.abs(currentBounds.width - otherBounds.width) < 2) {
        guides.push({
          type: 'info',
          label: `Same width: ${Math.round(otherBounds.width)}px`,
          color: '#00d4ff'
        });
      }

      if (Math.abs(currentBounds.height - otherBounds.height) < 2) {
        guides.push({
          type: 'info',
          label: `Same height: ${Math.round(otherBounds.height)}px`,
          color: '#00d4ff'
        });
      }
    });

    return guides;
  }, [layers, selectedIds, zoom, stageSize, getLayerBounds]);

  // Apply snapping based on smart guides
  const applySmartSnap = useCallback((pos, currentLayer) => {
    let { x, y } = pos;
    const currentBounds = {
      ...getLayerBounds({ ...currentLayer, x, y }),
      left: x,
      top: y
    };

    const guides = detectSmartGuides(currentLayer, currentBounds);
    setSmartGuides(guides);

    // Apply snap positions
    let snappedX = x;
    let snappedY = y;

    guides.forEach(guide => {
      if (guide.snapX !== undefined) snappedX = guide.snapX;
      if (guide.snapY !== undefined) snappedY = guide.snapY;
    });

    // Grid snapping (override if enabled)
    if (snapToGrid) {
      snappedX = Math.round(snappedX / GRID_SIZE) * GRID_SIZE;
      snappedY = Math.round(snappedY / GRID_SIZE) * GRID_SIZE;
    }

    return { x: snappedX, y: snappedY };
  }, [snapToGrid, detectSmartGuides, getLayerBounds]);

  // Stage interaction
  const handleStageClick = (e) => {
    // If a tool is selected, add the shape regardless of what was clicked
    if (tool) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

      if (!pos) {
        console.error('Could not get pointer position');
        return;
      }

      const stageTransform = stage.getAbsoluteTransform().copy().invert();
      const relativePos = stageTransform.point(pos);

      const newShape = {
        id: `layer-${Date.now()}`,
        x: relativePos.x,
        y: relativePos.y,
        type: tool,
        visible: true,
        locked: false,
        rotation: 0
      };

      if (tool === 'text') {
        newShape.name = 'Text';
        newShape.text = 'Click to edit';
        newShape.fontSize = 32;
        newShape.fill = '#FFFFFF';
        newShape.fontFamily = 'Arial';
        newShape.width = 200; // Initial text box width
      } else if (tool === 'rect') {
        newShape.name = 'Rectangle';
        newShape.width = 150;
        newShape.height = 100;
        newShape.fill = '#60A5FA';
      } else if (tool === 'circle') {
        newShape.name = 'Circle';
        newShape.radius = 75;
        newShape.fill = '#8B5CF6';
      }

      updateLayers([...layers, newShape]);
      setSelectedIds([newShape.id]);
      setTool(null);
      return;
    }

    // Otherwise, handle normal click behavior (select/deselect)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target === e.target.getLayer();
    if (clickedOnEmpty) {
      setSelectedIds([]);
      setSmartGuides([]);
    }
  };

  const handleLayerDragStart = useCallback((layer, e) => {
    setSmartGuides([]);
    if (!e?.target) return;

    // Store initial drag position for background image threshold
    setDragStartPos({ x: e.target.x(), y: e.target.y() });

    const container = e.target.getStage().container();
    if (layer.type === 'text') {
      container.style.cursor = 'text';
    } else if (layer.type === 'image') {
      container.style.cursor = 'default';
    } else {
      container.style.cursor = 'move';
    }
  }, []);

  // Throttled version of handleLayerDragMove for better performance during drag
  const handleLayerDragMove = useCallback((layer, e) => {
    if (!layer) return;

    const latestLayer = layers.find(l => l.id === layer.id);
    if (!latestLayer) return;

    // Check if this is the background image
    const isBackgroundImage = layer.name === 'Background';

    // Apply drag threshold for background image to prevent accidental movement
    if (isBackgroundImage && dragStartPos) {
      const currentPos = { x: e.target.x(), y: e.target.y() };
      const distance = Math.sqrt(
        Math.pow(currentPos.x - dragStartPos.x, 2) +
        Math.pow(currentPos.y - dragStartPos.y, 2)
      );

      // Require 10px drag distance before moving background
      const DRAG_THRESHOLD = 10;
      if (distance < DRAG_THRESHOLD) {
        // Reset position to start - don't allow movement yet
        e.target.x(dragStartPos.x);
        e.target.y(dragStartPos.y);
        return;
      }
    }

    const pos = { x: e.target.x(), y: e.target.y() };
    const snapped = applySmartSnap(pos, latestLayer);
    e.target.x(snapped.x);
    e.target.y(snapped.y);

    if (layer.type === 'image') {
      const container = e.target.getStage().container();
      container.style.cursor = 'default';
    }
  }, [layers, applySmartSnap, dragStartPos]);

  const handleLayerDragEnd = useCallback((layer, e) => {
    setSmartGuides([]);
    setDragStartPos(null); // Clear drag threshold tracking

    const newLayers = layers.map(existing =>
      existing.id === layer.id
        ? { ...existing, x: e.target.x(), y: e.target.y() }
        : existing
    );
    updateLayers(newLayers);

    // Reapply handle styles after drag
    requestAnimationFrame(() => {
      applyTransformerHandleStyles();
    });

    if (e?.target) {
      const container = e.target.getStage().container();
      container.style.cursor = layer.type === 'text' ? 'text' : 'default';
    }
  }, [layers, updateLayers, applyTransformerHandleStyles]);

  // Apply transform updates (used by both live transform and transform end)
  const applyLayerTransform = useCallback((id, node, shouldUpdateHistory = true) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const newLayers = layers.map(layer => {
      if (layer.id !== id) return layer;

      // Update position and rotation from the node after transform
      const updates = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation()
      };

      if (layer.type === 'rect') {
        updates.width = Math.max(5, node.width() * scaleX);
        updates.height = Math.max(5, node.height() * scaleY);
      } else if (layer.type === 'circle') {
        updates.radius = Math.max(5, node.radius() * Math.max(scaleX, scaleY));
      } else if (layer.type === 'image') {
        // Smart cropping for images (Canva-style)
        const newWidth = Math.max(5, node.width() * scaleX);
        const newHeight = Math.max(5, node.height() * scaleY);

        // Calculate aspect ratios
        const currentAspect = layer.width / layer.height;
        const newAspect = newWidth / newHeight;
        const originalAspect = layer.originalWidth / layer.originalHeight;

        // Initialize crop if not exists
        if (!layer.crop) {
          layer.crop = {
            x: 0,
            y: 0,
            width: layer.originalWidth,
            height: layer.originalHeight
          };
        }

        updates.width = newWidth;
        updates.height = newHeight;

        // Adjust crop based on how the resize changes the aspect ratio
        const crop = { ...layer.crop };

        // If aspect ratio changed significantly, adjust the crop
        if (Math.abs(newAspect - currentAspect) > 0.01) {
          // Maintain the scale of the image content
          const viewportAspect = newWidth / newHeight;

          if (viewportAspect > originalAspect) {
            // Viewport is wider - crop height, show full width
            crop.width = layer.originalWidth;
            crop.height = layer.originalWidth / viewportAspect;
            crop.x = 0;
            crop.y = Math.max(0, (layer.originalHeight - crop.height) / 2);
          } else {
            // Viewport is taller - crop width, show full height
            crop.height = layer.originalHeight;
            crop.width = layer.originalHeight * viewportAspect;
            crop.y = 0;
            crop.x = Math.max(0, (layer.originalWidth - crop.width) / 2);
          }
        }

        updates.crop = crop;
      } else if (layer.type === 'text') {
        // Intelligent text resizing based on drag type
        const isHorizontalDrag = Math.abs(scaleY - 1) < 0.01; // Y scale is ~1, meaning horizontal drag

        if (isHorizontalDrag) {
          // Horizontal middle handle drag - change width only (text wraps)
          updates.width = Math.max(50, (layer.width || 200) * scaleX);
        } else {
          // Corner drag - scale font size only (Canva-style)
          // Use the average of both scales for proportional resizing
          const avgScale = (scaleX + scaleY) / 2;
          updates.fontSize = Math.max(8, layer.fontSize * avgScale);

          // Keep the text box width scaled as well
          updates.width = Math.max(50, (layer.width || 200) * scaleX);
        }
      }

      return { ...layer, ...updates };
    });

    node.scaleX(1);
    node.scaleY(1);

    if (shouldUpdateHistory) {
      updateLayers(newLayers);
    } else {
      // Just update state without adding to history (for live preview)
      setLayers(newLayers);
    }
  }, [layers, updateLayers]);

  // Transform start handler (fires when transform begins)
  const handleLayerTransformStart = useCallback((id, e) => {
    const transformer = transformerRef.current;
    const stage = e.target.getStage();
    const container = stage?.container();

    if (!transformer || !container) return;

    // Detect if we're rotating or resizing based on which anchor is being dragged
    const currentTarget = stage.getPointerPosition();
    const transformerNode = transformer.getNode();

    // Check if the active anchor is the rotater
    const activeAnchor = transformer.getActiveAnchor();

    if (activeAnchor === 'rotater') {
      container.style.cursor = 'grabbing'; // or 'grab' for rotation
    } else {
      container.style.cursor = 'nwse-resize'; // arrow cursor for resizing
    }
  }, []);

  // Live transform handler (fires continuously during drag)
  const handleLayerTransformLive = useCallback((id, e) => {
    applyLayerTransform(id, e.target, false);
  }, [applyLayerTransform]);

  // Transform end handler (fires when drag is complete)
  const handleLayerTransform = useCallback((id, e) => {
    applyLayerTransform(id, e.target, true);

    // Reset cursor after transform
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = 'default';
    }
  }, [applyLayerTransform]);

  const handleLayerTransformEnd = useCallback(() => {
    setSmartGuides([]);

    // Reset cursor
    const stage = stageRef.current;
    if (stage) {
      const container = stage.container();
      container.style.cursor = 'default';
    }

    // Reapply handle styles after transform
    requestAnimationFrame(() => {
      applyTransformerHandleStyles();
    });
  }, [applyTransformerHandleStyles]);

  // Optimized mouse event handlers for layers
  const handleMouseEnterMove = useCallback((e) => {
    const container = e.target.getStage().container();
    container.style.cursor = 'move';
  }, []);

  const handleMouseEnterText = useCallback((e) => {
    const container = e.target.getStage().container();
    container.style.cursor = 'text';
  }, []);

  const handleMouseEnterPointer = useCallback((e) => {
    const container = e.target.getStage().container();
    container.style.cursor = 'pointer';
  }, []);

  const handleMouseEnterDefault = useCallback((e) => {
    const container = e.target.getStage().container();
    container.style.cursor = 'default';
  }, []);

  const handleMouseLeaveDefault = useCallback((e) => {
    const container = e.target.getStage().container();
    container.style.cursor = 'default';
  }, []);

  // Memoized boundBoxFunc for Transformer to prevent recreation on each render
  const transformerBoundBoxFunc = useCallback((oldBox, newBox) => {
    // Minimum size constraint
    if (newBox.width < 5 || newBox.height < 5) {
      return oldBox;
    }
    return newBox;
  }, []);

  // Memoize pixelRatio to prevent recalculation on every render
  const stagePixelRatio = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  }, []);

  // Layer management
  const handleLayerClick = (id, e) => {
    if (e.evt.shiftKey) {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  // Handle right-click on layer (canvas)
  const handleLayerContextMenu = (id, e) => {
    e.evt.preventDefault();

    // Select the layer if not already selected
    if (!selectedIds.includes(id)) {
      setSelectedIds([id]);
    }

    // Position context menu at cursor
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      layerId: id
    });
  };

  // Handle right-click on layer panel
  const handleLayerPanelContextMenu = (id, e) => {
    e.preventDefault();

    // Select the layer if not already selected
    if (!selectedIds.includes(id)) {
      setSelectedIds([id]);
    }

    // Position context menu at cursor
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      layerId: id
    });
  };

  // Layer panel drag-and-drop handlers for reordering
  const handleLayerPanelDragStart = (layerId, e) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerPanelDragOver = (layerId, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (layerId !== draggedLayerId) {
      setDragOverLayerId(layerId);
    }
  };

  const handleLayerPanelDragLeave = () => {
    setDragOverLayerId(null);
  };

  const handleLayerPanelDrop = (targetLayerId, e) => {
    e.preventDefault();

    if (!draggedLayerId || draggedLayerId === targetLayerId) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    const draggedIndex = layers.findIndex(l => l.id === draggedLayerId);
    const targetIndex = layers.findIndex(l => l.id === targetLayerId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLayers = [...layers];
    const [draggedLayer] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(targetIndex, 0, draggedLayer);

    updateLayers(newLayers);
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const handleLayerPanelDragEnd = () => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  // Handle double-click on text to edit
  const handleTextDblClick = (id) => {
    const layer = layers.find(l => l.id === id);
    if (layer && layer.type === 'text') {
      setEditingTextId(id);

      // Create textarea for editing
      const textNode = layerNodesRef.current.get(id);
      const stage = stageRef.current;
      if (!textNode || !stage) return;

      // Hide text node and transformer
      textNode.hide();
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }

      // Get text position on screen
      const textPosition = textNode.absolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      const areaPosition = {
        x: stageBox.left + textPosition.x * zoom,
        y: stageBox.top + textPosition.y * zoom,
      };

      // Create textarea
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      // Style textarea
      textarea.value = layer.text;
      textarea.style.position = 'absolute';
      textarea.style.top = areaPosition.y + 'px';
      textarea.style.left = areaPosition.x + 'px';
      textarea.style.width = (layer.width || 200) * zoom + 'px';
      textarea.style.fontSize = layer.fontSize * zoom + 'px';
      textarea.style.fontFamily = layer.fontFamily || 'Arial';
      textarea.style.color = layer.fill || '#FFFFFF';
      textarea.style.background = 'rgba(0, 0, 0, 0.8)';
      textarea.style.border = '2px solid #60A5FA';
      textarea.style.padding = '8px';
      textarea.style.margin = '0px';
      textarea.style.overflow = 'hidden';
      textarea.style.resize = 'none';
      textarea.style.outline = 'none';
      textarea.style.lineHeight = '1.2';
      textarea.style.transformOrigin = 'left top';
      textarea.style.borderRadius = '4px';
      textarea.style.zIndex = '10001';
      textarea.style.textAlign = layer.align || 'center';

      textarea.focus();
      textarea.select();

      // Handle finish editing
      const removeTextarea = () => {
        textarea.parentNode?.removeChild(textarea);
        window.removeEventListener('click', handleOutsideClick);
        textNode.show();
        setEditingTextId(null);
      };

      const handleOutsideClick = (e) => {
        if (e.target !== textarea) {
          // Update text
          const newLayers = layers.map(l =>
            l.id === id ? { ...l, text: textarea.value } : l
          );
          updateLayers(newLayers);
          removeTextarea();
        }
      };

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          removeTextarea();
        }
        // Allow Enter for new lines
        if (e.key === 'Enter' && !e.shiftKey) {
          e.stopPropagation();
        }
      });

      textarea.addEventListener('blur', () => {
        const newLayers = layers.map(l =>
          l.id === id ? { ...l, text: textarea.value } : l
        );
        updateLayers(newLayers);
        removeTextarea();
      });

      setTimeout(() => {
        window.addEventListener('click', handleOutsideClick);
      }, 0);
    }
  };

  const toggleLayerVisibility = (id) => {
    const newLayers = layers.map(layer =>
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    );
    updateLayers(newLayers);
  };

  const moveLayerUp = (id) => {
    const index = layers.findIndex(l => l.id === id);
    if (index < layers.length - 1) {
      const newLayers = [...layers];
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      updateLayers(newLayers);
    }
  };

  const moveLayerDown = (id) => {
    const index = layers.findIndex(l => l.id === id);
    if (index > 0) {
      const newLayers = [...layers];
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      updateLayers(newLayers);
    }
  };

  // Alignment tools
  const alignLayers = (alignment) => {
    if (selectedIds.length === 0) return;

    const selectedLayers = layers.filter(l => selectedIds.includes(l.id));
    if (selectedLayers.length === 0) return;

    // Calculate bounds
    const bounds = selectedLayers.reduce((acc, layer) => {
      const layerBounds = getLayerBounds(layer);

      return {
        minX: Math.min(acc.minX, layerBounds.left),
        maxX: Math.max(acc.maxX, layerBounds.right),
        minY: Math.min(acc.minY, layerBounds.top),
        maxY: Math.max(acc.maxY, layerBounds.bottom)
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const newLayers = layers.map(layer => {
      if (!selectedIds.includes(layer.id)) return layer;

      const layerBounds = getLayerBounds(layer);
      const updates = {};

      switch (alignment) {
        case 'left':
          updates.x = bounds.minX;
          break;
        case 'center':
          updates.x = centerX - layerBounds.width / 2;
          break;
        case 'right':
          updates.x = bounds.maxX - layerBounds.width;
          break;
        case 'top':
          updates.y = bounds.minY;
          break;
        case 'middle':
          updates.y = centerY - layerBounds.height / 2;
          break;
        case 'bottom':
          updates.y = bounds.maxY - layerBounds.height;
          break;
      }

      return { ...layer, ...updates };
    });

    updateLayers(newLayers);
  };

  // File upload
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          // Smart sizing: scale down if image is too large for canvas
          const padding = 100; // Leave 100px padding around the image
          const maxWidth = stageSize.width - padding;
          const maxHeight = stageSize.height - padding;

          let finalWidth = img.width;
          let finalHeight = img.height;

          // Check if image exceeds canvas bounds
          if (img.width > maxWidth || img.height > maxHeight) {
            // Calculate scale to fit within bounds while maintaining aspect ratio
            const scaleX = maxWidth / img.width;
            const scaleY = maxHeight / img.height;
            const scale = Math.min(scaleX, scaleY);

            finalWidth = img.width * scale;
            finalHeight = img.height * scale;
          }

          // Position with offset for multiple files, centered if single file
          const offsetX = index * 20;
          const offsetY = index * 20;
          const x = (stageSize.width - finalWidth) / 2 + offsetX;
          const y = (stageSize.height - finalHeight) / 2 + offsetY;

          const newLayer = {
            id: `layer-${Date.now()}-${index}`,
            type: 'image',
            name: file.name.replace(/\.[^/.]+$/, ""),
            image: img,
            imageSrc: event.target.result,
            x: x,
            y: y,
            width: finalWidth,
            height: finalHeight,
            originalWidth: img.width,
            originalHeight: img.height,
            // Crop properties for smart resizing
            crop: {
              x: 0,
              y: 0,
              width: img.width,
              height: img.height
            },
            visible: true,
            locked: false,
            rotation: 0
          };

          setLayers(prev => {
            const newLayers = [...prev, newLayer];
            addToHistory(newLayers);
            return newLayers;
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Zoom and Pan
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    // Handle zoom with scroll wheel
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const scaleBy = 1.05;
      const newScale = e.evt.deltaY > 0
        ? Math.max(oldScale / scaleBy, 0.1)
        : Math.min(oldScale * scaleBy, 3);

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setZoom(newScale);
      setStagePos(newPos);
    } else {
      // Pan with scroll wheel
      const newPos = {
        x: stagePos.x - e.evt.deltaX,
        y: stagePos.y - e.evt.deltaY,
      };
      setStagePos(newPos);
    }
  };

  const handleStageDragEnd = (e) => {
    setStagePos({
      x: e.target.x(),
      y: e.target.y()
    });
  };

  // Export
  const handleSave = () => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage) return;

    if (sliceMode) {
      // Export sliced version for email
      handleExportSliced();
    } else {
      // Export as single image - always at original canvas dimensions
      // Save current state
      const currentZoom = zoom;
      const currentPos = { ...stagePos };
      const currentSelection = [...selectedIds];

      // Hide transformer and deselect to remove handles
      if (transformer) {
        transformer.nodes([]);
      }
      setSelectedIds([]);
      setShowCanvasBoundary(false);

      // Temporarily reset zoom and position for export
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });

      // Small delay to ensure UI updates before export
      setTimeout(() => {
        const dataURL = stage.toDataURL({
          mimeType: 'image/jpeg',
          quality: 0.9,
          pixelRatio: 1,
          x: 0,
          y: 0,
          width: stageSize.width,
          height: stageSize.height
        });

        // Restore zoom, position, selection, and canvas boundary
        stage.scale({ x: currentZoom, y: currentZoom });
        stage.position(currentPos);
        setSelectedIds(currentSelection);
        setShowCanvasBoundary(true);

        onSave(dataURL);
        onClose();
      }, 50);
    }
  };

  const handleExportSliced = () => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage) return;

    // Save current state
    const currentZoom = zoom;
    const currentPos = { ...stagePos };
    const currentSelection = [...selectedIds];

    // Hide transformer and deselect to remove handles
    if (transformer) {
      transformer.nodes([]);
    }
    setSelectedIds([]);
    setShowCanvasBoundary(false);

    // Temporarily reset zoom and position for export
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    // Small delay to ensure UI updates before export
    setTimeout(() => {
      const { rows, cols } = sliceGrid;
      const sliceWidth = stageSize.width / cols;
      const sliceHeight = stageSize.height / rows;

      const slices = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const dataURL = stage.toDataURL({
            mimeType: 'image/jpeg',
            quality: 0.9,
            pixelRatio: 1,
            x: col * sliceWidth,
            y: row * sliceHeight,
            width: sliceWidth,
            height: sliceHeight
          });

          slices.push({
            row,
            col,
            dataURL,
            width: sliceWidth,
            height: sliceHeight
          });
        }
      }

      // Generate HTML table
      const html = generateSlicedEmailHTML(slices, rows, cols);

      // For now, save the full image and log the HTML
      console.log('Sliced Email HTML:', html);

      const dataURL = stage.toDataURL({
        mimeType: 'image/jpeg',
        quality: 0.9,
        pixelRatio: 1,
        x: 0,
        y: 0,
        width: stageSize.width,
        height: stageSize.height
      });

      // Restore zoom, position, selection, and canvas boundary
      stage.scale({ x: currentZoom, y: currentZoom });
      stage.position(currentPos);
      setSelectedIds(currentSelection);
      setShowCanvasBoundary(true);

      onSave(dataURL, { sliced: true, html, slices });
      onClose();
    }, 50);
  };

  const generateSlicedEmailHTML = (slices, rows, cols) => {
    let html = '<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">\n';

    for (let row = 0; row < rows; row++) {
      html += '  <tr>\n';
      for (let col = 0; col < cols; col++) {
        const slice = slices.find(s => s.row === row && s.col === col);
        html += `    <td style="padding: 0; margin: 0; line-height: 0;">\n`;
        html += `      <img src="${slice.dataURL}" width="${Math.round(slice.width)}" height="${Math.round(slice.height)}" alt="" style="display: block; border: 0;" />\n`;
        html += `    </td>\n`;
      }
      html += '  </tr>\n';
    }

    html += '</table>';
    return html;
  };

  // Render grid (Figma-style professional grid)
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const width = stageSize.width;
    const height = stageSize.height;
    const gridSize = GRID_SIZE;

    // Vertical lines with varying opacity for major/minor grid
    for (let i = 0; i <= width; i += gridSize) {
      const isMajorLine = i % (gridSize * 5) === 0;
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, height]}
          stroke={isMajorLine ? 'rgba(96, 165, 250, 0.15)' : 'rgba(148, 163, 184, 0.08)'}
          strokeWidth={isMajorLine ? 0.5 / zoom : 0.5 / zoom}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }

    // Horizontal lines with varying opacity for major/minor grid
    for (let i = 0; i <= height; i += gridSize) {
      const isMajorLine = i % (gridSize * 5) === 0;
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, width, i]}
          stroke={isMajorLine ? 'rgba(96, 165, 250, 0.15)' : 'rgba(148, 163, 184, 0.08)'}
          strokeWidth={isMajorLine ? 0.5 / zoom : 0.5 / zoom}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }

    return lines;
  };

  // Render smart guides (Figma-style professional guides)
  const renderSmartGuides = () => {
    const guideElements = [];

    smartGuides.forEach((guide, i) => {
      // Professional guide color - vibrant but not overwhelming
      const guideColor = '#FF00FF'; // Magenta like Figma
      const labelBgColor = '#FF00FF';
      const labelTextColor = '#FFFFFF';

      if (guide.type === 'vertical') {
        // Main guide line - solid, no dashes for cleaner look
        guideElements.push(
          <Line
            key={`guide-v-${i}`}
            points={[guide.position, 0, guide.position, stageSize.height]}
            stroke={guideColor}
            strokeWidth={1 / zoom}
            listening={false}
            perfectDrawEnabled={false}
            shadowEnabled={false}
          />
        );

        // Label with background (Figma-style)
        if (guide.label) {
          const labelWidth = 40 / zoom;
          const labelHeight = 18 / zoom;
          const labelX = guide.position + 8 / zoom;
          const labelY = 8 / zoom;

          // Label background
          guideElements.push(
            <Rect
              key={`guide-v-bg-${i}`}
              x={labelX}
              y={labelY}
              width={labelWidth}
              height={labelHeight}
              fill={labelBgColor}
              cornerRadius={3 / zoom}
              listening={false}
            />
          );

          // Label text
          guideElements.push(
            <KonvaText
              key={`guide-v-text-${i}`}
              x={labelX}
              y={labelY}
              width={labelWidth}
              height={labelHeight}
              text={guide.label}
              fontSize={11 / zoom}
              fontFamily="'Inter', system-ui, -apple-system, sans-serif"
              fontStyle="500"
              fill={labelTextColor}
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          );
        }
      } else if (guide.type === 'horizontal') {
        // Main guide line - solid, no dashes
        guideElements.push(
          <Line
            key={`guide-h-${i}`}
            points={[0, guide.position, stageSize.width, guide.position]}
            stroke={guideColor}
            strokeWidth={1 / zoom}
            listening={false}
            perfectDrawEnabled={false}
            shadowEnabled={false}
          />
        );

        // Label with background (Figma-style)
        if (guide.label) {
          const labelWidth = 40 / zoom;
          const labelHeight = 18 / zoom;
          const labelX = 8 / zoom;
          const labelY = guide.position + 8 / zoom;

          // Label background
          guideElements.push(
            <Rect
              key={`guide-h-bg-${i}`}
              x={labelX}
              y={labelY}
              width={labelWidth}
              height={labelHeight}
              fill={labelBgColor}
              cornerRadius={3 / zoom}
              listening={false}
            />
          );

          // Label text
          guideElements.push(
            <KonvaText
              key={`guide-h-text-${i}`}
              x={labelX}
              y={labelY}
              width={labelWidth}
              height={labelHeight}
              text={guide.label}
              fontSize={11 / zoom}
              fontFamily="'Inter', system-ui, -apple-system, sans-serif"
              fontStyle="500"
              fill={labelTextColor}
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          );
        }
      }
    });

    return guideElements;
  };

  // Render slice grid
  const renderSliceGrid = () => {
    if (!sliceMode) return null;

    const lines = [];
    const { rows, cols } = sliceGrid;
    const sliceWidth = stageSize.width / cols;
    const sliceHeight = stageSize.height / rows;

    // Vertical lines
    for (let i = 1; i < cols; i++) {
      lines.push(
        <Line
          key={`slice-v-${i}`}
          points={[i * sliceWidth, 0, i * sliceWidth, stageSize.height]}
          stroke="#ff0000"
          strokeWidth={2 / zoom}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }

    // Horizontal lines
    for (let i = 1; i < rows; i++) {
      lines.push(
        <Line
          key={`slice-h-${i}`}
          points={[0, i * sliceHeight, stageSize.width, i * sliceHeight]}
          stroke="#ff0000"
          strokeWidth={2 / zoom}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }

    return lines;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={styles.fullscreenOverlay}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className={styles.fullscreenContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2>Image Editor</h2>
          </div>

          <div className={styles.headerCenter}>
            {/* Main toolbar */}
            <div className={styles.toolbar}>
              {/* Tools */}
              <button
                className={`${styles.toolButton} ${tool === 'text' ? styles.toolButtonActive : ''}`}
                onClick={() => setTool('text')}
                title="Add Text (T)"
              >
                <Type size={18} />
              </button>
              <button
                className={`${styles.toolButton} ${tool === 'rect' ? styles.toolButtonActive : ''}`}
                onClick={() => setTool('rect')}
                title="Add Rectangle (R)"
              >
                <Square size={18} />
              </button>
              <button
                className={`${styles.toolButton} ${tool === 'circle' ? styles.toolButtonActive : ''}`}
                onClick={() => setTool('circle')}
                title="Add Circle (C)"
              >
                <CircleIcon size={18} />
              </button>

              <div className={styles.toolbarDivider} />

              {/* Alignment */}
              <button
                className={styles.toolButton}
                onClick={() => alignLayers('left')}
                disabled={selectedIds.length === 0}
                title="Align Left"
              >
                <AlignLeft size={18} />
              </button>
              <button
                className={styles.toolButton}
                onClick={() => alignLayers('center')}
                disabled={selectedIds.length === 0}
                title="Align Center"
              >
                <AlignCenter size={18} />
              </button>
              <button
                className={styles.toolButton}
                onClick={() => alignLayers('right')}
                disabled={selectedIds.length === 0}
                title="Align Right"
              >
                <AlignRight size={18} />
              </button>
              <button
                className={styles.toolButton}
                onClick={() => alignLayers('top')}
                disabled={selectedIds.length === 0}
                title="Align Top"
              >
                <AlignVerticalJustifyStart size={18} />
              </button>
              <button
                className={styles.toolButton}
                onClick={() => alignLayers('middle')}
                disabled={selectedIds.length === 0}
                title="Align Middle"
              >
                <AlignVerticalJustifyCenter size={18} />
              </button>
              <button
                className={styles.toolButton}
                onClick={() => alignLayers('bottom')}
                disabled={selectedIds.length === 0}
                title="Align Bottom"
              >
                <AlignVerticalJustifyEnd size={18} />
              </button>

              <div className={styles.toolbarDivider} />

              {/* Upload */}
              <button
                className={styles.toolButton}
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image"
              >
                <Upload size={18} />
              </button>

              {/* Duplicate */}
              <button
                className={styles.toolButton}
                onClick={handleDuplicate}
                disabled={selectedIds.length === 0}
                title="Duplicate (Ctrl+D)"
              >
                <Copy size={18} />
              </button>

              {/* Delete */}
              <button
                className={styles.toolButton}
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                title="Delete (Del)"
              >
                <Trash2 size={18} />
              </button>

              <div className={styles.toolbarDivider} />

              {/* Grid */}
              <button
                className={`${styles.toolButton} ${showGrid ? styles.toolButtonActive : ''}`}
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Grid (Ctrl+')"
              >
                <Grid size={18} />
              </button>

              {/* Slice mode */}
              <button
                className={`${styles.toolButton} ${sliceMode ? styles.toolButtonActive : ''}`}
                onClick={() => setSliceMode(!sliceMode)}
                title="Slice for Email"
              >
                <Scissors size={18} />
              </button>

              <div className={styles.toolbarDivider} />

              {/* Zoom */}
              <button
                className={styles.toolButton}
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
              <button
                className={styles.toolButton}
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>

              <div className={styles.toolbarDivider} />

              {/* Undo/Redo */}
              <button
                className={styles.toolButton}
                onClick={undo}
                disabled={historyStep <= 0}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={18} />
              </button>
              <button
                className={styles.toolButton}
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={18} />
              </button>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className={styles.mainContent}>
          {/* Left panel - Layers */}
          <div className={styles.leftPanel}>
            <div className={styles.panelHeader}>
              <Layers size={16} />
              <span>Layers</span>
            </div>
            <div className={styles.layersList}>
              {[...layers].reverse().map((layer, index) => {
                const reversedIndex = layers.length - 1 - index;
                return (
                  <div
                    key={layer.id}
                    className={`${styles.layerItem} ${selectedIds.includes(layer.id) ? styles.layerItemSelected : ''} ${draggedLayerId === layer.id ? styles.layerItemDragging : ''} ${dragOverLayerId === layer.id ? styles.layerItemDragOver : ''}`}
                    draggable
                    onClick={() => handleLayerClick(layer.id, { evt: { shiftKey: false } })}
                    onContextMenu={(e) => handleLayerPanelContextMenu(layer.id, e)}
                    onDragStart={(e) => handleLayerPanelDragStart(layer.id, e)}
                    onDragOver={(e) => handleLayerPanelDragOver(layer.id, e)}
                    onDragLeave={handleLayerPanelDragLeave}
                    onDrop={(e) => handleLayerPanelDrop(layer.id, e)}
                    onDragEnd={handleLayerPanelDragEnd}
                  >
                    <div className={styles.layerItemLeft}>
                      <button
                        className={styles.layerVisibilityButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                      >
                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <div className={styles.layerIcon}>
                        {layer.type === 'image' && <ImageIcon size={14} />}
                        {layer.type === 'text' && <Type size={14} />}
                        {layer.type === 'rect' && <Square size={14} />}
                        {layer.type === 'circle' && <CircleIcon size={14} />}
                      </div>
                      <span className={styles.layerName}>{layer.name}</span>
                    </div>
                    <div className={styles.layerItemRight}>
                      <button
                        className={styles.layerActionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayerUp(layer.id);
                        }}
                        disabled={reversedIndex === 0}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        className={styles.layerActionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayerDown(layer.id);
                        }}
                        disabled={reversedIndex === layers.length - 1}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center - Canvas */}
          <div className={styles.canvasArea}>
            <div className={styles.canvasContainer}>
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                scaleX={zoom}
                scaleY={zoom}
                x={stagePos.x}
                y={stagePos.y}
                pixelRatio={stagePixelRatio}
                onClick={handleStageClick}
                onTap={handleStageClick}
                onWheel={handleWheel}
                draggable={false}
                style={{
                  backgroundColor: 'transparent',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(148, 163, 184, 0.2)',
                  borderRadius: '4px',
                  cursor: 'default'
                }}
              >
                <Layer>
                  {/* Base artboard fill */}
                  <Rect
                    x={0}
                    y={0}
                    width={stageSize.width}
                    height={stageSize.height}
                    fill="#ffffff"
                    listening={false}
                    perfectDrawEnabled={false}
                  />

                  {/* Canvas Boundary - Figma/Canva-style artboard indicator */}
                  {showCanvasBoundary && (
                    <Rect
                      x={0}
                      y={0}
                      width={stageSize.width}
                      height={stageSize.height}
                      stroke="#E5E7EB"
                      strokeWidth={1 / zoom}
                      shadowColor="rgba(0, 0, 0, 0.1)"
                      shadowBlur={10 / zoom}
                      shadowOffset={{ x: 0, y: 2 / zoom }}
                      listening={false}
                      perfectDrawEnabled={false}
                    />
                  )}

                  {/* Grid */}
                  {renderGrid()}

                  {/* Layers */}
                  {layers.map((layer) => {
                    if (!layer.visible) return null;

                    if (layer.type === 'image') {
                      // Use crop if available, otherwise show full image
                      const crop = layer.crop || {
                        x: 0,
                        y: 0,
                        width: layer.originalWidth || layer.width,
                        height: layer.originalHeight || layer.height
                      };

                      // Background image requires selection before dragging
                      const isBackgroundImage = layer.name === 'Background';
                      const canDrag = !layer.locked && (!isBackgroundImage || selectedIds.includes(layer.id));

                      return (
                        <KonvaImage
                          key={layer.id}
                          id={layer.id}
                          ref={(node) => {
                            if (node) {
                              layerNodesRef.current.set(layer.id, node);
                            }
                          }}
                          image={layer.image}
                          x={layer.x}
                          y={layer.y}
                          width={layer.width}
                          height={layer.height}
                          crop={crop}
                          rotation={layer.rotation || 0}
                          draggable={canDrag}
                          perfectDrawEnabled={false}
                          shadowForStrokeEnabled={false}
                          hitStrokeWidth={0}
                          onClick={(e) => handleLayerClick(layer.id, e)}
                          onTap={(e) => handleLayerClick(layer.id, e)}
                          onContextMenu={(e) => handleLayerContextMenu(layer.id, e)}
                          onMouseEnter={(isBackgroundImage && !selectedIds.includes(layer.id)) ? handleMouseEnterPointer : handleMouseEnterMove}
                          onMouseLeave={handleMouseLeaveDefault}
                          onDragStart={(e) => handleLayerDragStart(layer, e)}
                          onDragMove={(e) => handleLayerDragMove(layer, e)}
                          onDragEnd={(e) => handleLayerDragEnd(layer, e)}
                          onTransformStart={(e) => handleLayerTransformStart(layer.id, e)}
                          onTransform={(e) => handleLayerTransformLive(layer.id, e)}
                          onTransformEnd={(e) => handleLayerTransform(layer.id, e)}
                        />
                      );
                    } else if (layer.type === 'text') {
                      return (
                        <KonvaText
                          key={layer.id}
                          id={layer.id}
                          ref={(node) => {
                            if (node) {
                              layerNodesRef.current.set(layer.id, node);
                            }
                          }}
                          x={layer.x}
                          y={layer.y}
                          text={layer.text}
                          fontSize={layer.fontSize}
                          fontFamily={layer.fontFamily || 'Arial'}
                          fill={layer.fill}
                          width={layer.width || 200}
                          wrap="word"
                          align={layer.align || 'center'}
                          rotation={layer.rotation || 0}
                          draggable={!layer.locked}
                          perfectDrawEnabled={false}
                          shadowForStrokeEnabled={false}
                          onClick={(e) => handleLayerClick(layer.id, e)}
                          onTap={(e) => handleLayerClick(layer.id, e)}
                          onContextMenu={(e) => handleLayerContextMenu(layer.id, e)}
                          onDblClick={() => handleTextDblClick(layer.id)}
                          onDblTap={() => handleTextDblClick(layer.id)}
                          onMouseEnter={handleMouseEnterText}
                          onMouseLeave={handleMouseLeaveDefault}
                          onDragStart={(e) => handleLayerDragStart(layer, e)}
                          onDragMove={(e) => handleLayerDragMove(layer, e)}
                          onDragEnd={(e) => handleLayerDragEnd(layer, e)}
                          onTransformStart={(e) => handleLayerTransformStart(layer.id, e)}
                          onTransform={(e) => handleLayerTransformLive(layer.id, e)}
                          onTransformEnd={(e) => handleLayerTransform(layer.id, e)}
                        />
                      );
                    } else if (layer.type === 'rect') {
                      return (
                        <Rect
                          key={layer.id}
                          id={layer.id}
                          ref={(node) => {
                            if (node) {
                              layerNodesRef.current.set(layer.id, node);
                            }
                          }}
                          x={layer.x}
                          y={layer.y}
                          width={layer.width}
                          height={layer.height}
                          fill={layer.fill}
                          rotation={layer.rotation || 0}
                          draggable={!layer.locked}
                          perfectDrawEnabled={false}
                          shadowForStrokeEnabled={false}
                          onClick={(e) => handleLayerClick(layer.id, e)}
                          onTap={(e) => handleLayerClick(layer.id, e)}
                          onContextMenu={(e) => handleLayerContextMenu(layer.id, e)}
                          onMouseEnter={handleMouseEnterMove}
                          onMouseLeave={handleMouseLeaveDefault}
                          onDragStart={(e) => handleLayerDragStart(layer, e)}
                          onDragMove={(e) => handleLayerDragMove(layer, e)}
                          onDragEnd={(e) => handleLayerDragEnd(layer, e)}
                          onTransformStart={(e) => handleLayerTransformStart(layer.id, e)}
                          onTransform={(e) => handleLayerTransformLive(layer.id, e)}
                          onTransformEnd={(e) => handleLayerTransform(layer.id, e)}
                        />
                      );
                    } else if (layer.type === 'circle') {
                      return (
                        <Circle
                          key={layer.id}
                          id={layer.id}
                          ref={(node) => {
                            if (node) {
                              layerNodesRef.current.set(layer.id, node);
                            }
                          }}
                          x={layer.x}
                          y={layer.y}
                          radius={layer.radius}
                          fill={layer.fill}
                          rotation={layer.rotation || 0}
                          draggable={!layer.locked}
                          perfectDrawEnabled={false}
                          shadowForStrokeEnabled={false}
                          onClick={(e) => handleLayerClick(layer.id, e)}
                          onTap={(e) => handleLayerClick(layer.id, e)}
                          onContextMenu={(e) => handleLayerContextMenu(layer.id, e)}
                          onMouseEnter={handleMouseEnterMove}
                          onMouseLeave={handleMouseLeaveDefault}
                          onDragStart={(e) => handleLayerDragStart(layer, e)}
                          onDragMove={(e) => handleLayerDragMove(layer, e)}
                          onDragEnd={(e) => handleLayerDragEnd(layer, e)}
                          onTransformStart={(e) => handleLayerTransformStart(layer.id, e)}
                          onTransform={(e) => handleLayerTransformLive(layer.id, e)}
                          onTransformEnd={(e) => handleLayerTransform(layer.id, e)}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Smart Guides */}
                  {renderSmartGuides()}

                  {/* Slice grid */}
                  {renderSliceGrid()}

                  {/* Transformer with Canva-like pill handles */}
                  <Transformer
                    ref={transformerRef}
                    rotateEnabled={true}
                    rotateAnchorOffset={0}
                    rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'middle-right', 'middle-left', 'bottom-center']}
                    keepRatio={false}
                    ignoreStroke={false}
                    shouldOverdrawWholeArea={false}
                    centeredScaling={false}
                    boundBoxFunc={transformerBoundBoxFunc}
                  />
                </Layer>
              </Stage>
            </div>

            {/* Slice controls */}
            {sliceMode && (
              <div className={styles.sliceControls}>
                <div className={styles.sliceControlGroup}>
                  <label>Rows:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={sliceGrid.rows}
                    onChange={(e) => setSliceGrid({ ...sliceGrid, rows: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className={styles.sliceControlGroup}>
                  <label>Cols:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={sliceGrid.cols}
                    onChange={(e) => setSliceGrid({ ...sliceGrid, cols: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right panel - Properties */}
          <div className={styles.rightPanel}>
            <div className={styles.panelHeader}>
              <span>Properties</span>
            </div>
            <div className={styles.propertiesContent}>
              {selectedIds.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Select a layer to edit properties</p>
                </div>
              )}
              {selectedIds.length === 1 && (() => {
                const layer = layers.find(l => l.id === selectedIds[0]);
                if (!layer) return null;

                return (
                  <div className={styles.propertyGroups}>
                    <div className={styles.propertyGroup}>
                      <label>Name</label>
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => {
                          const newLayers = layers.map(l =>
                            l.id === layer.id ? { ...l, name: e.target.value } : l
                          );
                          updateLayers(newLayers);
                        }}
                      />
                    </div>

                    <div className={styles.propertyGroup}>
                      <label>Position</label>
                      <div className={styles.propertyRow}>
                        <div className={styles.propertyField}>
                          <span>X</span>
                          <input
                            type="number"
                            value={Math.round(layer.x || 0)}
                            onChange={(e) => {
                              const newLayers = layers.map(l =>
                                l.id === layer.id ? { ...l, x: parseFloat(e.target.value) || 0 } : l
                              );
                              updateLayers(newLayers);
                            }}
                          />
                        </div>
                        <div className={styles.propertyField}>
                          <span>Y</span>
                          <input
                            type="number"
                            value={Math.round(layer.y || 0)}
                            onChange={(e) => {
                              const newLayers = layers.map(l =>
                                l.id === layer.id ? { ...l, y: parseFloat(e.target.value) || 0 } : l
                              );
                              updateLayers(newLayers);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {(layer.type === 'rect' || layer.type === 'image') && (
                      <div className={styles.propertyGroup}>
                        <label>Size</label>
                        <div className={styles.propertyRow}>
                          <div className={styles.propertyField}>
                            <span>W</span>
                            <input
                              type="number"
                              value={Math.round(layer.width || 0)}
                              onChange={(e) => {
                                const newLayers = layers.map(l =>
                                  l.id === layer.id ? { ...l, width: parseFloat(e.target.value) || 0 } : l
                                );
                                updateLayers(newLayers);
                              }}
                            />
                          </div>
                          <div className={styles.propertyField}>
                            <span>H</span>
                            <input
                              type="number"
                              value={Math.round(layer.height || 0)}
                              onChange={(e) => {
                                const newLayers = layers.map(l =>
                                  l.id === layer.id ? { ...l, height: parseFloat(e.target.value) || 0 } : l
                                );
                                updateLayers(newLayers);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {layer.type === 'circle' && (
                      <div className={styles.propertyGroup}>
                        <label>Radius</label>
                        <input
                          type="number"
                          value={Math.round(layer.radius || 0)}
                          onChange={(e) => {
                            const newLayers = layers.map(l =>
                              l.id === layer.id ? { ...l, radius: parseFloat(e.target.value) || 0 } : l
                            );
                            updateLayers(newLayers);
                          }}
                        />
                      </div>
                    )}

                    {layer.type === 'text' && (
                      <>
                        <div className={styles.propertyGroup}>
                          <label>Text</label>
                          <div
                            onClick={() => handleTextDblClick(layer.id)}
                            style={{
                              padding: '12px',
                              background: 'rgba(96, 165, 250, 0.1)',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#E4E4E7',
                              fontSize: '0.875rem',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
                              e.currentTarget.style.borderColor = '#60A5FA';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
                              e.currentTarget.style.borderColor = '#374151';
                            }}
                          >
                            Double-click text on canvas to edit
                          </div>
                        </div>
                        <div className={styles.propertyGroup}>
                          <label>Font Size</label>
                          <input
                            type="number"
                            value={Math.round(layer.fontSize || 16)}
                            onChange={(e) => {
                              const newLayers = layers.map(l =>
                                l.id === layer.id ? { ...l, fontSize: parseFloat(e.target.value) || 16 } : l
                              );
                              updateLayers(newLayers);
                            }}
                          />
                        </div>
                      </>
                    )}

                    {(layer.type === 'rect' || layer.type === 'circle' || layer.type === 'text') && (
                      <div className={styles.propertyGroup}>
                        <label>Fill Color</label>
                        <input
                          type="color"
                          value={layer.fill || '#000000'}
                          onChange={(e) => {
                            const newLayers = layers.map(l =>
                              l.id === layer.id ? { ...l, fill: e.target.value } : l
                            );
                            updateLayers(newLayers);
                          }}
                        />
                      </div>
                    )}

                    <div className={styles.propertyGroup}>
                      <label>Rotation</label>
                      <input
                        type="number"
                        value={Math.round(layer.rotation || 0)}
                        onChange={(e) => {
                          const newLayers = layers.map(l =>
                            l.id === layer.id ? { ...l, rotation: parseFloat(e.target.value) || 0 } : l
                          );
                          updateLayers(newLayers);
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
              {selectedIds.length > 1 && (
                <div className={styles.emptyState}>
                  <p>{selectedIds.length} layers selected</p>
                </div>
              )}
            </div>

            {/* Snap options */}
            <div className={styles.snapOptions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                />
                <span>Snap to Grid</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <div className={styles.helpText}>
              💡 Drag canvas to pan • Ctrl+Scroll to zoom • Scroll to pan • Paste images with Ctrl+V
            </div>
          </div>
          <div className={styles.footerRight}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.saveButton} onClick={handleSave}>
              <Download size={16} />
              {sliceMode ? 'Export Sliced' : 'Save Image'}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Context Menu */}
        {contextMenu && (
          <div
            className={styles.contextMenu}
            style={{
              left: contextMenu.x,
              top: contextMenu.y
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={styles.contextMenuItem}
              onClick={() => {
                handleCopy();
                setContextMenu(null);
              }}
            >
              <div className={styles.contextMenuItemLeft}>
                <Copy className={styles.contextMenuIcon} />
                <span>Copy</span>
              </div>
              <span className={styles.contextMenuShortcut}>⌘C</span>
            </div>

            <div
              className={`${styles.contextMenuItem} ${copiedLayers.length === 0 ? styles.contextMenuItemDisabled : ''}`}
              onClick={() => {
                if (copiedLayers.length > 0) {
                  handlePasteFromCopy();
                  setContextMenu(null);
                }
              }}
            >
              <div className={styles.contextMenuItemLeft}>
                <Clipboard className={styles.contextMenuIcon} />
                <span>Paste</span>
              </div>
              <span className={styles.contextMenuShortcut}>⌘V</span>
            </div>

            <div
              className={styles.contextMenuItem}
              onClick={() => {
                handleDuplicate();
                setContextMenu(null);
              }}
            >
              <div className={styles.contextMenuItemLeft}>
                <Copy className={styles.contextMenuIcon} />
                <span>Duplicate</span>
              </div>
              <span className={styles.contextMenuShortcut}>⌘D</span>
            </div>

            <div className={styles.contextMenuDivider} />

            <div
              className={styles.contextMenuItem}
              onClick={() => {
                handleDeleteSelected();
                setContextMenu(null);
              }}
            >
              <div className={styles.contextMenuItemLeft}>
                <Trash2 className={styles.contextMenuIcon} />
                <span>Delete</span>
              </div>
              <span className={styles.contextMenuShortcut}>DEL</span>
            </div>

            <div className={styles.contextMenuDivider} />

            {(() => {
              const layer = layers.find(l => l.id === contextMenu.layerId);
              if (!layer) return null;

              return (
                <>
                  <div
                    className={styles.contextMenuItem}
                    onClick={() => {
                      toggleLayerVisibility(contextMenu.layerId);
                      setContextMenu(null);
                    }}
                  >
                    <div className={styles.contextMenuItemLeft}>
                      {layer.visible ? <EyeOff className={styles.contextMenuIcon} /> : <Eye className={styles.contextMenuIcon} />}
                      <span>{layer.visible ? 'Hide' : 'Show'}</span>
                    </div>
                  </div>

                  <div
                    className={styles.contextMenuItem}
                    onClick={() => {
                      toggleLayerLock(contextMenu.layerId);
                      setContextMenu(null);
                    }}
                  >
                    <div className={styles.contextMenuItemLeft}>
                      {layer.locked ? <Unlock className={styles.contextMenuIcon} /> : <Lock className={styles.contextMenuIcon} />}
                      <span>{layer.locked ? 'Unlock' : 'Lock'}</span>
                    </div>
                  </div>
                </>
              );
            })()}

            <div className={styles.contextMenuDivider} />

            <div
              className={styles.contextMenuItem}
              onClick={() => {
                moveLayerUp(contextMenu.layerId);
                setContextMenu(null);
              }}
            >
              <div className={styles.contextMenuItemLeft}>
                <ArrowUp className={styles.contextMenuIcon} />
                <span>Bring Forward</span>
              </div>
              <span className={styles.contextMenuShortcut}>⌘]</span>
            </div>

            <div
              className={styles.contextMenuItem}
              onClick={() => {
                moveLayerDown(contextMenu.layerId);
                setContextMenu(null);
              }}
            >
              <div className={styles.contextMenuItemLeft}>
                <ArrowDown className={styles.contextMenuIcon} />
                <span>Send Backward</span>
              </div>
              <span className={styles.contextMenuShortcut}>⌘[</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditorModal;
