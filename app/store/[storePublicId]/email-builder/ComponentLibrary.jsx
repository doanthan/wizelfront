import React from 'react';
import { Plus } from 'lucide-react';
import styles from './email-builder.module.css';

const ComponentLibrary = ({
  libraryRef,
  groupedLibrary,
  onQuickAddOpen,
  isQuickAddOpen,
  onLibraryDragStart,
  onDragEnd,
  onLibraryItemClick
}) => {
  return (
    <aside
      className={`${styles.sidebar} ${styles.library}`}
      aria-label="Component library"
      ref={libraryRef}
      tabIndex={-1}
    >
      <div className={styles.libraryTopBar}>
        <button
          className={styles.quickAddButton}
          type="button"
          onClick={onQuickAddOpen}
          aria-expanded={isQuickAddOpen}
        >
          <Plus className="icon" />
          <span>Quick add</span>
        </button>
      </div>
      <div className={styles.libraryContent}>
        {groupedLibrary.map((group) => (
          <div key={group.category} className={styles.librarySection}>
            <div className={styles.sectionTitle}>{group.category}</div>
            <div className={styles.componentGrid}>
              {group.items.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className={`${styles.componentCard} ${item.type === 'section' ? styles.dragOnly : ''}`}
                  draggable
                  onDragStart={onLibraryDragStart(item.type)}
                  onDragEnd={onDragEnd}
                  onClick={() => onLibraryItemClick(item)}
                  title={item.type === 'section' ? 'Drag to add section' : `Add ${item.title}`}
                >
                  <item.icon className="icon" aria-hidden />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ComponentLibrary;