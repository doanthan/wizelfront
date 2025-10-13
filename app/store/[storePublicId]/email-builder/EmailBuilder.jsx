"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Import route-specific CSS
import "./email-builder.css";

// Import new components
import EmailBuilderHeader from './EmailBuilderHeader';
import ComponentLibrary from './ComponentLibrary';
import EmailCanvas from './EmailCanvas';
import PropertiesPanel from './PropertiesPanel';
import QuickAddModal from './QuickAddModal';
import TextToolbar from './TextToolbar';
import BlockRenderer from './BlockRenderer';
import ColumnModal from './ColumnModal';
import LeftPanel from './LeftPanel';
import ImageEditorModal from './ImageEditorModal';
import { SpliceAndLinkModal } from './SpliceAndLinkModal';
import { BrandProvider } from './BrandContext';
import AuthDebug from './auth-debug';

// Import utilities and constants
import { library, CATEGORY_ORDER, defaultQuickAddCategory, defaultQuickAddItem } from './constants';
import { createBlock, createId, assignDragData, extractDragData, groupLibraryByCategory } from './utils';
import { useTheme, usePropertiesPanel, useDragAndDrop, useTextEditor } from './hooks';
import { useBrand } from './BrandContext';

import styles from "./email-builder.module.css";

const findBlockById = (blocks, targetId) => {
  if (!Array.isArray(blocks) || !targetId) {
    return null;
  }

  for (const block of blocks) {
    if (!block) continue;

    if (block.id === targetId) {
      return block;
    }

    if (block.type === 'section' && Array.isArray(block.children)) {
      const foundInSection = findBlockById(block.children, targetId);
      if (foundInSection) return foundInSection;
    }

    if (block.type === 'columns' && Array.isArray(block.columnChildren)) {
      for (const column of block.columnChildren) {
        const foundInColumn = findBlockById(column, targetId);
        if (foundInColumn) return foundInColumn;
      }
    }
  }

  return null;
};

const findParentBlock = (blocks, targetId, parent = null) => {
  if (!Array.isArray(blocks) || !targetId) {
    return null;
  }

  for (const block of blocks) {
    if (!block) continue;

    if (block.id === targetId) {
      return parent;
    }

    if (block.type === 'section' && Array.isArray(block.children)) {
      const foundInSection = findParentBlock(block.children, targetId, block);
      if (foundInSection) return foundInSection;
    }

    if (block.type === 'columns' && Array.isArray(block.columnChildren)) {
      for (const column of block.columnChildren) {
        const foundInColumn = findParentBlock(column, targetId, block);
        if (foundInColumn) return foundInColumn;
      }
    }
  }

  return null;
};

const updateBlockInTree = (blocks, targetId, updates) => {
  if (!Array.isArray(blocks) || !targetId) {
    return blocks;
  }

  let hasChanged = false;

  const nextBlocks = blocks.map((block) => {
    if (!block) return block;

    if (block.id === targetId) {
      hasChanged = true;
      return { ...block, ...updates };
    }

    let updatedBlock = block;

    if (block.type === 'section' && Array.isArray(block.children)) {
      const updatedChildren = updateBlockInTree(block.children, targetId, updates);
      if (updatedChildren !== block.children) {
        hasChanged = true;
        updatedBlock = { ...updatedBlock, children: updatedChildren };
      }
    }

    if (block.type === 'columns' && Array.isArray(block.columnChildren)) {
      let columnsChanged = false;
      const updatedColumnChildren = block.columnChildren.map((column) => {
        const updatedColumn = updateBlockInTree(column, targetId, updates);
        if (updatedColumn !== column) {
          columnsChanged = true;
          return updatedColumn;
        }
        return column;
      });

      if (columnsChanged) {
        hasChanged = true;
        updatedBlock = { ...updatedBlock, columnChildren: updatedColumnChildren };
      }
    }

    return updatedBlock;
  });

  return hasChanged ? nextBlocks : blocks;
};

// Inner component that has access to brand context
function EmailBuilderInner() {
  // Brand context
  const { applyBrandToBlock, applyBrandToQuickAddBlocks } = useBrand();

  // Brand-aware block creation
  const createBrandedBlock = useCallback((type, overrides = {}) => {
    const baseBlock = createBlock(type, overrides);
    const brandedOverrides = applyBrandToBlock(type, baseBlock);
    return { ...baseBlock, ...brandedOverrides };
  }, [applyBrandToBlock]);

  // State
  const [blocks, setBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activeQuickAddCategory, setActiveQuickAddCategory] = useState(defaultQuickAddCategory);
  const [activeQuickAddItem, setActiveQuickAddItem] = useState(defaultQuickAddItem);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [pendingColumnDrop, setPendingColumnDrop] = useState(null); // Stores {index} for drop location
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [editingImageId, setEditingImageId] = useState(null);
  const [editingImageUrl, setEditingImageUrl] = useState(null);
  const [isSpliceAndLinkOpen, setIsSpliceAndLinkOpen] = useState(false);
  const [splicingImageId, setSplicingImageId] = useState(null);
  const [splicingImageUrl, setSplicingImageUrl] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('Spring Promotion');

  // Custom hooks
  const { theme, toggleTheme } = useTheme();
  const { isPropertiesOpen, isPropertiesFloating, togglePropertiesPanel, setIsPropertiesOpen } = usePropertiesPanel();
  const {
    dragContext,
    setDragContext,
    isDraggingOver,
    setIsDraggingOver,
    activeDropIndex,
    setActiveDropIndex,
    dragOverSectionId,
    setDragOverSectionId,
    resetDragState
  } = useDragAndDrop();
  const {
    editingBlockId,
    setEditingBlockId,
    isTextToolbarVisible,
    setIsTextToolbarVisible,
    textToolbarPosition,
    setTextToolbarPosition,
    currentTextStyles
  } = useTextEditor();

  // Refs
  const libraryRef = useRef(null);
  const canvasRef = useRef(null);
  const propertiesRef = useRef(null);
  const blockRefs = useRef(new Map());
  const textToolbarRef = useRef(null);
  const contentEditableRefs = useRef(new Map());

  // Computed values
  const selectedBlock = useMemo(() => {
    if (!selectedId) return null;
    return findBlockById(blocks, selectedId);
  }, [blocks, selectedId]);

  const selectedBlockIndex = useMemo(() => blocks.findIndex((block) => block.id === selectedId), [blocks, selectedId]);
  const groupedLibrary = useMemo(() => groupLibraryByCategory(library, CATEGORY_ORDER), []);
  const isCanvasEmpty = blocks.length === 0;

  // Find parent container for selected block
  const parentContainer = useMemo(() => {
    if (!selectedId) return null;
    return findParentBlock(blocks, selectedId);
  }, [blocks, selectedId]);

  const parentContainerIndex = useMemo(() => {
    if (!parentContainer) return -1;
    return blocks.findIndex(block => block.id === parentContainer.id);
  }, [blocks, parentContainer]);

  // Check if selected block is a container (section/columns)
  const isContainerBlock = selectedBlock && (selectedBlock.type === 'section' || selectedBlock.type === 'columns');

  const propertiesPanelClassName = [
    styles.properties,
    isPropertiesFloating ? styles.propertiesFloating : undefined,
    isPropertiesFloating && isPropertiesOpen ? styles.propertiesFloatingOpen : undefined
  ]
    .filter(Boolean)
    .join(" ");

  const canvasInnerClassName = [
    styles.canvasViewportInner,
    dragContext ? styles.canvasViewportInnerActive : undefined,
    dragContext && activeDropIndex === blocks.length ? styles.canvasViewportInnerTail : undefined
  ]
    .filter(Boolean)
    .join(" ");

  // Helper functions
  const registerBlockRef = useCallback(
    (id) => (node) => {
      if (node) {
        blockRefs.current.set(id, node);
      } else {
        blockRefs.current.delete(id);
      }
    },
    []
  );

  const updateBlock = useCallback((id, updates) => {
    setBlocks(prev => updateBlockInTree(prev, id, updates));
  }, []);

  // Event handlers
  const handleQuickAddOpen = useCallback(() => {
    setIsQuickAddOpen(true);
  }, []);

  const handleQuickAddClose = useCallback(() => {
    setIsQuickAddOpen(false);
  }, []);

  const handleLibraryDragStart = useCallback((type) => (event) => {
    const payload = { source: "library", type };
    assignDragData(event, payload);
    setDragContext(payload);
  }, [setDragContext]);

  const handleLibraryItemClick = useCallback((item) => {
    if (item.type === "section") {
      // Section blocks should only be added via drag and drop
      return;
    } else if (item.type === "columns") {
      // For now, create columns block directly - TODO: implement column modal
      const newBlock = createBrandedBlock(item.type);
      setBlocks((prev) => [...prev, newBlock]);
      setSelectedId(newBlock.id);
    } else {
      const newBlock = createBrandedBlock(item.type);
      setBlocks((prev) => [...prev, newBlock]);
      setSelectedId(newBlock.id);
    }
  }, [createBrandedBlock]);

  const handleCanvasDragEnter = useCallback((event) => {
    if (!dragContext) return;
    event.preventDefault();
    setIsDraggingOver(true);
    if (!blocks.length) {
      setActiveDropIndex(0);
    }
  }, [dragContext, blocks.length, setIsDraggingOver, setActiveDropIndex]);

  const handleCanvasDragOver = useCallback((event) => {
    if (!dragContext) return;
    event.preventDefault();
    setIsDraggingOver(true);
    if (!blocks.length) {
      setActiveDropIndex(0);
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = dragContext.source === "canvas" ? "move" : "copy";
      }
      return;
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = dragContext.source === "canvas" ? "move" : "copy";
    }

    const { clientY } = event;
    let nextIndex = blocks.length;

    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];
      const element = blockRefs.current.get(block.id);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY < midpoint) {
        nextIndex = index;
        break;
      }
    }

    if (activeDropIndex !== nextIndex) {
      setActiveDropIndex(nextIndex);
    }
  }, [dragContext, blocks, activeDropIndex, setIsDraggingOver, setActiveDropIndex]);

  const handleCanvasDragLeave = useCallback((event) => {
    if (!dragContext) return;
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDraggingOver(false);
    setActiveDropIndex(null);
  }, [dragContext, setIsDraggingOver, setActiveDropIndex]);

  const handleDropAtIndex = useCallback((event, index) => {
    if (!dragContext) return;
    event.preventDefault();
    event.stopPropagation();

    const currentDragContext = dragContext;
    resetDragState();

    if (currentDragContext.source === "library") {
      // If dropping a columns block, open the modal
      if (currentDragContext.type === "columns") {
        setPendingColumnDrop({ index });
        setIsColumnModalOpen(true);
      } else {
        const newBlock = createBrandedBlock(currentDragContext.type);
        setBlocks(prev => {
          const updated = [...prev];
          updated.splice(index, 0, newBlock);
          return updated;
        });
        setSelectedId(newBlock.id);
      }
    } else if (currentDragContext.source === "canvas") {
      setBlocks(prev => {
        const updated = [...prev];
        const [movedBlock] = updated.splice(currentDragContext.index, 1);
        const newIndex = index > currentDragContext.index ? index - 1 : index;
        updated.splice(newIndex, 0, movedBlock);
        return updated;
      });
    }
  }, [dragContext, resetDragState, createBrandedBlock]);

  const handleCanvasDrop = useCallback((event) => {
    event.preventDefault();
    if (!dragContext || !isCanvasEmpty) return;

    const payload = extractDragData(event);
    if (payload?.source === "library") {
      // If dropping a columns block, open the modal
      if (payload.type === "columns") {
        setPendingColumnDrop({ index: 0 });
        setIsColumnModalOpen(true);
      } else {
        const newBlock = createBrandedBlock(payload.type);
        setBlocks([newBlock]);
        setSelectedId(newBlock.id);
      }
    }
    resetDragState();
  }, [dragContext, isCanvasEmpty, resetDragState, createBrandedBlock]);

  const handleSelectBlock = useCallback((id) => () => {
    setSelectedId(id);
  }, []);

  // Deep clone function that generates new IDs for all nested blocks
  const deepCloneWithNewIds = useCallback((blockToClone) => {
    const clonedBlock = { ...blockToClone, id: createId() };

    // Handle section children
    if (blockToClone.type === 'section' && Array.isArray(blockToClone.children)) {
      clonedBlock.children = blockToClone.children.map(child => deepCloneWithNewIds(child));
    }

    // Handle column children
    if (blockToClone.type === 'columns' && Array.isArray(blockToClone.columnChildren)) {
      clonedBlock.columnChildren = blockToClone.columnChildren.map(column => {
        if (Array.isArray(column)) {
          return column.map(child => deepCloneWithNewIds(child));
        }
        return column;
      });
    }

    return clonedBlock;
  }, []);

  const handleDeleteBlock = useCallback((id) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
    setSelectedId(null);
  }, []);

  const handleDuplicateBlock = useCallback((block) => {
    const duplicatedBlock = deepCloneWithNewIds(block);
    const index = blocks.findIndex(b => b.id === block.id);
    setBlocks(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicatedBlock);
      return updated;
    });
    setSelectedId(duplicatedBlock.id);
  }, [blocks, deepCloneWithNewIds]);

  const handleCanvasBlockDragStart = useCallback((block, index) => (event) => {
    const payload = { source: "canvas", id: block.id, index };
    event.dataTransfer.effectAllowed = "move";
    assignDragData(event, payload);
    setDragContext(payload);
    setActiveDropIndex(index);
    setIsDraggingOver(true);
  }, [setDragContext, setActiveDropIndex, setIsDraggingOver]);

  const handleDragEnd = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  // Properties panel handlers
  const handleImageUrlChange = useCallback((value) => {
    if (selectedBlock) {
      updateBlock(selectedBlock.id, { imageUrl: value });
    }
  }, [selectedBlock, updateBlock]);

  // Image editor handlers
  const handleEditImage = useCallback((blockId, imageUrl) => {
    setEditingImageId(blockId);
    setEditingImageUrl(imageUrl);
    setIsImageEditorOpen(true);
  }, []);

  const handleSaveEditedImage = useCallback((dataURL) => {
    if (editingImageId) {
      updateBlock(editingImageId, { imageUrl: dataURL });
    }
    setIsImageEditorOpen(false);
    setEditingImageId(null);
    setEditingImageUrl(null);
  }, [editingImageId, updateBlock]);

  const handleCloseImageEditor = useCallback(() => {
    setIsImageEditorOpen(false);
    setEditingImageId(null);
    setEditingImageUrl(null);
  }, []);

  // Splice & Link modal handlers
  const handleSpliceAndLink = useCallback((blockId, imageUrl) => {
    setSplicingImageId(blockId);
    setSplicingImageUrl(imageUrl);
    setIsSpliceAndLinkOpen(true);
  }, []);

  const handleApplySpliceAndLink = useCallback((slicedImages, blocks, gridConfig) => {
    if (!splicingImageId || !slicedImages || !blocks || blocks.length === 0) {
      console.error('Invalid data for splice and link');
      return;
    }

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

    // Create section children (one columns block per row)
    const sectionChildren = sortedRowIndices.map(rowIndex => {
      const rowBlocks = rowGroups[rowIndex].sort((a, b) => a.colIndex - b.colIndex);
      const numColumns = rowBlocks.length;

      // Calculate column widths based on block widths
      const totalWidth = rowBlocks.reduce((sum, block) => sum + block.width, 0);
      const columnWidths = rowBlocks.map(block => (block.width / totalWidth) * 100);

      // Create image blocks for each column
      const columnChildren = rowBlocks.map(block => {
        const slicedImage = slicedImages.find(
          img => img.block.rowIndex === block.rowIndex && img.block.colIndex === block.colIndex
        );

        const imageBlock = createBrandedBlock('image', {
          imageUrl: slicedImage ? slicedImage.dataUrl : '',
          padding: 0,
          alignment: 'left',
          content: block.altText || ''
        });

        return [imageBlock]; // Each column contains an array of blocks
      });

      // Create columns block for this row
      const columnsBlock = createBrandedBlock('columns', {
        columns: numColumns,
        columnWidths: columnWidths,
        columnChildren: columnChildren,
        padding: 0,
        isSpliced: true, // Flag to indicate this is from splice & link
        columnGap: 0 // No gap between columns
      });

      return columnsBlock;
    });

    // Create section block containing all rows
    const sectionBlock = createBrandedBlock('section', {
      children: sectionChildren,
      padding: 0,
      backgroundColor: 'transparent',
      isSpliced: true, // Flag to indicate this is from splice & link
      rowGap: 0 // No gap between rows
    });

    // Replace the original image block with the section block
    setBlocks(prev => prev.map(block => {
      if (block.id === splicingImageId) {
        return sectionBlock;
      }
      return block;
    }));

    // Select the new section
    setSelectedId(sectionBlock.id);

    // Close modal
    setIsSpliceAndLinkOpen(false);
    setSplicingImageId(null);
    setSplicingImageUrl(null);
  }, [splicingImageId, createBrandedBlock]);

  const handleCloseSpliceAndLink = useCallback(() => {
    setIsSpliceAndLinkOpen(false);
    setSplicingImageId(null);
    setSplicingImageUrl(null);
  }, []);

  // Text toolbar handlers
  const handleTextCommand = useCallback((command, value) => {
    if (typeof document !== 'undefined') {
      // Note: document.execCommand is deprecated but still functional
      // TODO: Replace with modern contentEditable API
      document.execCommand(command, false, value);
    }
  }, []);

  const handleFontChange = useCallback((fontFamily) => {
    if (editingBlockId) {
      updateBlock(editingBlockId, { fontFamily });
    }
  }, [editingBlockId, updateBlock]);

  const handleFontSizeChange = useCallback((fontSize) => {
    if (editingBlockId) {
      updateBlock(editingBlockId, { fontSize: Number(fontSize) });
    }
  }, [editingBlockId, updateBlock]);

  const handleTextColorChange = useCallback((color) => {
    if (editingBlockId) {
      updateBlock(editingBlockId, { textColor: color });
    }
  }, [editingBlockId, updateBlock]);

  // Quick Add handlers
  const handleQuickAddInsert = useCallback((item) => {
    if (!item || !item.blocks) {
      console.error('Invalid quick add item:', item);
      return;
    }

    // Apply brand styles to all blocks in the Quick Add item
    const brandedBlocks = applyBrandToQuickAddBlocks(item.blocks);

    // Helper function to recursively create blocks with children
    const createBlockWithChildren = (blockData) => {
      const { type, overrides, children } = blockData;

      // Create the base block with branded overrides
      const block = createBrandedBlock(type, overrides);

      // If this block has children (section or columns)
      if (children && Array.isArray(children)) {
        if (type === 'section') {
          // For sections, children go into the children array
          block.children = children.map(createBlockWithChildren);
        } else if (type === 'columns') {
          // For columns, children are distributed into columnChildren
          block.columnChildren = children.map(child => {
            if (Array.isArray(child)) {
              // Already an array of blocks for this column
              return child.map(createBlockWithChildren);
            } else {
              // Single block, wrap in array
              return [createBlockWithChildren(child)];
            }
          });
        }
      }

      return block;
    };

    // Create all blocks from the branded quick add item
    const newBlocks = brandedBlocks.map(createBlockWithChildren);

    // Add blocks to the canvas
    setBlocks(prev => [...prev, ...newBlocks]);

    // Select the first newly added block
    if (newBlocks.length > 0) {
      setSelectedId(newBlocks[0].id);
    }

    // Close the modal
    setIsQuickAddOpen(false);
  }, [createBrandedBlock, applyBrandToQuickAddBlocks]);

  // Column Modal handlers
  const handleColumnModalClose = useCallback(() => {
    setIsColumnModalOpen(false);
    setPendingColumnDrop(null);
  }, []);

  const handleColumnModalSelect = useCallback((numColumns, widths) => {
    if (!pendingColumnDrop) return;

    const newBlock = createBrandedBlock('columns');
    // Update the block with the selected number of columns and widths
    newBlock.columns = numColumns;
    newBlock.columnWidths = widths;

    // Determine if it's equal distribution
    const isEqual = widths.every(w => Math.abs(w - widths[0]) < 0.1);
    newBlock.columnSizes = isEqual ? 'equal' : 'custom';

    // Generate content for each column
    const columnContent = Array(numColumns)
      .fill(null)
      .map((_, i) => `Column ${i + 1}`)
      .join('\n');
    newBlock.content = columnContent;

    setBlocks(prev => {
      const updated = [...prev];
      updated.splice(pendingColumnDrop.index, 0, newBlock);
      return updated;
    });
    setSelectedId(newBlock.id);

    // Close modal and reset
    setIsColumnModalOpen(false);
    setPendingColumnDrop(null);
  }, [pendingColumnDrop, createBrandedBlock]);

  // Left panel handlers
  const handleMoveBlockUp = useCallback(() => {
    if (selectedBlockIndex <= 0) return;
    setBlocks(prev => {
      const updated = [...prev];
      [updated[selectedBlockIndex - 1], updated[selectedBlockIndex]] =
        [updated[selectedBlockIndex], updated[selectedBlockIndex - 1]];
      return updated;
    });
  }, [selectedBlockIndex]);

  const handleMoveBlockDown = useCallback(() => {
    if (selectedBlockIndex < 0 || selectedBlockIndex >= blocks.length - 1) return;
    setBlocks(prev => {
      const updated = [...prev];
      [updated[selectedBlockIndex], updated[selectedBlockIndex + 1]] =
        [updated[selectedBlockIndex + 1], updated[selectedBlockIndex]];
      return updated;
    });
  }, [selectedBlockIndex, blocks.length]);

  // Section handlers
  const handleDropInSection = useCallback((event, sectionId) => {
    event.preventDefault();
    event.stopPropagation();

    const dragData = extractDragData(event);
    if (!dragData) return;

    if (dragData.source === "library") {
      const newBlock = createBrandedBlock(dragData.type);

      // Remove padding for blocks inside sections
      if (newBlock.padding !== undefined) {
        newBlock.padding = 0;
      }
      if (newBlock.blockPaddingTop !== undefined) {
        newBlock.blockPaddingTop = 0;
        newBlock.blockPaddingBottom = 0;
        newBlock.blockPaddingLeft = 0;
        newBlock.blockPaddingRight = 0;
      }

      setBlocks(prev => prev.map(block => {
        if (block.id === sectionId) {
          const children = block.children || [];
          return { ...block, children: [...children, newBlock] };
        }
        return block;
      }));
      setSelectedId(newBlock.id);
    } else if (dragData.source === "section" && dragData.sectionId === sectionId) {
      // Handle reordering within the same section
      // TODO: Implement if needed
    }
  }, [createBrandedBlock]);

  const handleDuplicateBlockInSection = useCallback((sectionId, childBlock) => {
    const duplicatedBlock = deepCloneWithNewIds(childBlock);
    setBlocks(prev => prev.map(block => {
      if (block.id === sectionId) {
        const children = block.children || [];
        const childIndex = children.findIndex(b => b.id === childBlock.id);
        const newChildren = [...children];
        newChildren.splice(childIndex + 1, 0, duplicatedBlock);
        return { ...block, children: newChildren };
      }
      return block;
    }));
    setSelectedId(duplicatedBlock.id);
  }, [deepCloneWithNewIds]);

  const handleDeleteBlockFromSection = useCallback((sectionId, childBlockId) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === sectionId) {
        const children = block.children || [];
        return { ...block, children: children.filter(b => b.id !== childBlockId) };
      }
      return block;
    }));
    setSelectedId(null);
  }, []);

  // Effect for floating properties panel
  useEffect(() => {
    if (isPropertiesFloating && selectedBlock && !isPropertiesOpen) {
      setIsPropertiesOpen(true);
    }
  }, [selectedBlock, isPropertiesFloating, isPropertiesOpen, setIsPropertiesOpen]);

  return (
    <div className={styles.appShell}>
      <EmailBuilderHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        blocks={blocks}
        documentTitle={documentTitle}
      />

      <main className={styles.workspace}>
        <ComponentLibrary
          libraryRef={libraryRef}
          groupedLibrary={groupedLibrary}
          onQuickAddOpen={handleQuickAddOpen}
          isQuickAddOpen={isQuickAddOpen}
          onLibraryDragStart={handleLibraryDragStart}
          onDragEnd={handleDragEnd}
          onLibraryItemClick={handleLibraryItemClick}
        />

        <EmailCanvas
          canvasRef={canvasRef}
          blocks={blocks}
          selectedId={selectedId}
          selectedBlockIndex={selectedBlockIndex}
          parentContainer={parentContainer}
          parentContainerIndex={parentContainerIndex}
          isDraggingOver={isDraggingOver}
          dragContext={dragContext}
          activeDropIndex={activeDropIndex}
          isQuickAddOpen={isQuickAddOpen}
          editingBlockId={editingBlockId}
          contentEditableRefs={contentEditableRefs}
          canvasInnerClassName={canvasInnerClassName}
          registerBlockRef={registerBlockRef}
          blockRefs={blockRefs}
          onCanvasDragEnter={handleCanvasDragEnter}
          onCanvasDragOver={handleCanvasDragOver}
          onCanvasDragLeave={handleCanvasDragLeave}
          onCanvasDrop={handleCanvasDrop}
          onDropAtIndex={handleDropAtIndex}
          onSelectBlock={handleSelectBlock}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onMoveBlockUp={handleMoveBlockUp}
          onMoveBlockDown={handleMoveBlockDown}
          onQuickAddOpen={handleQuickAddOpen}
          onCanvasBlockDragStart={handleCanvasBlockDragStart}
          onDragEnd={handleDragEnd}
          setEditingBlockId={setEditingBlockId}
          setActiveDropIndex={setActiveDropIndex}
          renderBlockContent={(block) => (
            <BlockRenderer
              block={block}
              selectedId={selectedId}
              editingBlockId={editingBlockId}
              dragOverSectionId={dragOverSectionId}
              contentEditableRefs={contentEditableRefs}
              updateBlock={updateBlock}
              setSelectedId={setSelectedId}
              setEditingBlockId={setEditingBlockId}
              setIsTextToolbarVisible={setIsTextToolbarVisible}
              setTextToolbarPosition={setTextToolbarPosition}
              setDragOverSectionId={setDragOverSectionId}
              setDragContext={setDragContext}
              handleDropInSection={handleDropInSection}
              handleDragEnd={handleDragEnd}
              handleDuplicateBlockInSection={handleDuplicateBlockInSection}
              handleDeleteBlockFromSection={handleDeleteBlockFromSection}
            />
          )}
        />

        {/* Show right panel for all blocks except columns */}
        {selectedBlock && selectedBlock.type !== 'columns' && (
          <PropertiesPanel
            propertiesRef={propertiesRef}
            selectedBlock={selectedBlock}
            isPropertiesFloating={isPropertiesFloating}
            isPropertiesOpen={isPropertiesOpen}
            onToggleProperties={togglePropertiesPanel}
            updateBlock={updateBlock}
            onImageUrlChange={handleImageUrlChange}
            onEditImage={handleEditImage}
            onSpliceAndLink={handleSpliceAndLink}
            propertiesPanelClassName={propertiesPanelClassName}
          />
        )}
      </main>

      <QuickAddModal
        isQuickAddOpen={isQuickAddOpen}
        activeQuickAddCategory={activeQuickAddCategory}
        activeQuickAddItem={activeQuickAddItem}
        onClose={handleQuickAddClose}
        onCategoryChange={setActiveQuickAddCategory}
        onItemChange={setActiveQuickAddItem}
        onInsert={handleQuickAddInsert}
      />

      <TextToolbar
        isVisible={isTextToolbarVisible}
        textToolbarRef={textToolbarRef}
        textToolbarPosition={textToolbarPosition}
        editingBlockId={editingBlockId}
        currentTextStyles={currentTextStyles}
        onCommand={handleTextCommand}
        onFontChange={handleFontChange}
        onFontSizeChange={handleFontSizeChange}
        onColorChange={handleTextColorChange}
      />

      <ColumnModal
        isOpen={isColumnModalOpen}
        onClose={handleColumnModalClose}
        onSelect={handleColumnModalSelect}
      />

      <ImageEditorModal
        isOpen={isImageEditorOpen}
        imageUrl={editingImageUrl}
        onSave={handleSaveEditedImage}
        onClose={handleCloseImageEditor}
      />

      <SpliceAndLinkModal
        isOpen={isSpliceAndLinkOpen}
        imageUrl={splicingImageUrl}
        onApply={handleApplySpliceAndLink}
        onClose={handleCloseSpliceAndLink}
      />
    </div>
  );
}

// Wrapper component that provides brand context
export default function EmailBuilder() {
  return (
    <div className="email-builder-container">
      <BrandProvider>
        <EmailBuilderInner />
      </BrandProvider>
      {/* Auth debugging component - remove in production */}
      <AuthDebug />
    </div>
  );
}
