// DragDropManager - Central state management for drag operations
class DragDropManager {
  constructor() {
    this.dropTargets = new Map();
    this.dragState = null;
    this.listeners = new Set();
    this.activeDropTarget = null;
  }

  // Register a drop target
  registerDropTarget(id, config) {
    this.dropTargets.set(id, {
      id,
      element: config.element,
      accepts: config.accepts || [],
      data: config.data || {},
      onDragEnter: config.onDragEnter,
      onDragLeave: config.onDragLeave,
      onDragOver: config.onDragOver,
      onDrop: config.onDrop,
      isActive: false
    });
  }

  // Unregister a drop target
  unregisterDropTarget(id) {
    this.dropTargets.delete(id);
  }

  // Start drag operation
  startDrag(item, dragType) {
    console.log('[DragDropManager] startDrag called', { item, dragType });
    this.dragState = {
      item,
      type: dragType,
      isDragging: true
    };
    this.notifyListeners();
    console.log('[DragDropManager] Notified', this.listeners.size, 'listeners');
  }

  // End drag operation
  endDrag() {
    console.log('[DragDropManager] endDrag called');
    this.dragState = null;
    this.activeDropTarget = null;
    this.notifyListeners();
    console.log('[DragDropManager] Drag ended, notified', this.listeners.size, 'listeners');
  }

  // Find drop target at point
  findDropTargetAtPoint(x, y) {
    const targetsAtPoint = [];
    
    // Find all targets containing the point
    for (const [id, target] of this.dropTargets) {
      if (!target.element) continue;
      
      const rect = target.element.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && 
          y >= rect.top && y <= rect.bottom) {
        targetsAtPoint.push({ target, rect });
      }
    }
    
    // Prefer smallest (most specific) target
    if (targetsAtPoint.length > 1) {
      targetsAtPoint.sort((a, b) => {
        const areaA = (a.rect.right - a.rect.left) * (a.rect.bottom - a.rect.top);
        const areaB = (b.rect.right - b.rect.left) * (b.rect.bottom - b.rect.top);
        return areaA - areaB;
      });
    }
    
    return targetsAtPoint[0]?.target || null;
  }

  // Check if drop is valid
  canDrop(dropTarget, dragType) {
    if (!dropTarget || !dropTarget.accepts) return false;
    return dropTarget.accepts.includes(dragType) || 
           dropTarget.accepts.includes('*');
  }

  // Update active drop target
  updateActiveDropTarget(x, y) {
    const newTarget = this.findDropTargetAtPoint(x, y);
    
    if (newTarget !== this.activeDropTarget) {
      // Leave old target
      if (this.activeDropTarget?.onDragLeave) {
        this.activeDropTarget.onDragLeave();
      }
      
      // Enter new target
      if (newTarget && this.canDrop(newTarget, this.dragState?.type)) {
        if (newTarget.onDragEnter) {
          newTarget.onDragEnter(this.dragState);
        }
        this.activeDropTarget = newTarget;
      } else {
        this.activeDropTarget = null;
      }
    }
    
    // Drag over current target
    if (this.activeDropTarget?.onDragOver) {
      this.activeDropTarget.onDragOver(this.dragState);
    }
  }

  // Handle drop
  handleDrop() {
    if (this.activeDropTarget?.onDrop && this.dragState) {
      this.activeDropTarget.onDrop(this.dragState);
    }
    this.endDrag();
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.dragState));
  }

  // Get current drag state
  getDragState() {
    return this.dragState;
  }
}

// Create singleton instance
const dragDropManager = new DragDropManager();

export default dragDropManager;