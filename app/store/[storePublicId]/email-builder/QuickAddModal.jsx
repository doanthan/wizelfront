import React from 'react';
import { getQuickAddCategoriesWithIcons } from './quick_add_components/index';
import { useBrand } from './BrandContext';
import styles from './email-builder.module.css';

const QuickAddModal = ({
  isQuickAddOpen,
  activeQuickAddCategory,
  activeQuickAddItem,
  onClose,
  onCategoryChange,
  onItemChange,
  onInsert,
  brandData = {} // Deprecated: Use BrandContext instead
}) => {
  const hoverTimeoutRef = React.useRef(null);
  const { selectedBrand, applyBrandToQuickAddBlocks } = useBrand();

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Get quick add categories with brand data applied
  const quickAddCategories = React.useMemo(
    () => getQuickAddCategoriesWithIcons(selectedBrand || brandData),
    [selectedBrand, brandData]
  );

  if (!isQuickAddOpen) return null;

  const handleCategoryHover = (category) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set new timeout for category change (300ms delay)
    hoverTimeoutRef.current = setTimeout(() => {
      onCategoryChange(category);
      onItemChange(category.components[0]);
    }, 300);
  };

  const handleCategoryLeave = () => {
    // Clear timeout if user moves away before delay completes
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleCategoryFocus = (category) => {
    // Immediate change on focus (keyboard navigation)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    onCategoryChange(category);
    onItemChange(category.components[0]);
  };

  return (
    <div
      className={styles.quickAddOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Quick add"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.quickAddPanel}>
        <aside className={styles.quickAddMenu}>
          <nav className={styles.quickAddMenuList}>
            {quickAddCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.quickAddMenuItem} ${
                  activeQuickAddCategory.id === category.id ? styles.quickAddMenuItemActive : ""
                }`}
                onMouseEnter={() => handleCategoryHover(category)}
                onMouseLeave={handleCategoryLeave}
                onFocus={() => handleCategoryFocus(category)}
              >
                <category.icon className="icon" aria-hidden />
                <div>
                  <span className={styles.quickAddMenuTitle}>{category.title}</span>
                  <p className={styles.quickAddMenuDescription}>{category.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>
        <div className={styles.quickAddContent}>
          <div className={styles.quickAddItems}>
            {activeQuickAddCategory.components.map((item) => {
              const isActive = activeQuickAddItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.quickAddCard} ${isActive ? styles.quickAddCardActive : ""}`}
                  onMouseEnter={() => onItemChange(item)}
                  onFocus={() => onItemChange(item)}
                  onClick={() => onInsert(item)}
                >
                  <div className={styles.quickAddCardPreview}>{item.renderPreview(selectedBrand)}</div>
                  <div className={styles.quickAddCardMeta}>
                    <span className={styles.quickAddCardTitle}>{item.name}</span>
                    {item.description && <span className={styles.quickAddCardDescription}>{item.description}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;