import React from 'react';
import { Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './email-builder.module.css';

const LeftPanel = ({
  block,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  if (!block) return null;

  // Only show for container blocks (section, columns)
  const isContainerBlock = block.type === 'section' || block.type === 'columns';
  if (!isContainerBlock) return null;

  const getBlockLabel = (type) => {
    switch (type) {
      case 'section': return 'Section';
      case 'columns': return 'Columns';
      default: return type;
    }
  };

  return (
    <div className={styles.leftFloatingPanel}>
      <div className={styles.panelLabel}>
        {getBlockLabel(block.type)}
      </div>
      <div className={styles.panelActions}>
        {canMoveUp && (
          <button
            type="button"
            className={styles.panelActionButton}
            onClick={onMoveUp}
            aria-label="Move up"
            title="Move up"
          >
            <ChevronUp className="icon" />
          </button>
        )}
        {canMoveDown && (
          <button
            type="button"
            className={styles.panelActionButton}
            onClick={onMoveDown}
            aria-label="Move down"
            title="Move down"
          >
            <ChevronDown className="icon" />
          </button>
        )}
        <button
          type="button"
          className={styles.panelActionButton}
          onClick={onDuplicate}
          aria-label="Duplicate"
          title="Duplicate"
        >
          <Copy className="icon" />
        </button>
        <button
          type="button"
          className={styles.panelActionButton}
          onClick={onDelete}
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 className="icon" />
        </button>
      </div>
    </div>
  );
};

export default LeftPanel;