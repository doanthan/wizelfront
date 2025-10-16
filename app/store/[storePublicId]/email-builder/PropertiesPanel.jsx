import React from 'react';
import { ChevronsRight } from 'lucide-react';
import { blockLabels } from './constants';
import { useBrand } from './BrandContext';
import styles from './email-builder.module.css';

// Import modular property components
import SectionProperties from './properties/SectionProperties';
import ImageProperties from './properties/ImageProperties';
import TextProperties from './properties/TextProperties';
import ButtonProperties from './properties/ButtonProperties';
import DividerProperties from './properties/DividerProperties';
import CommonProperties from './properties/CommonProperties';

/**
 * PropertiesPanel - Main properties panel container
 * Smart container that renders appropriate property component based on selectedBlock.type
 */
const PropertiesPanel = ({
  propertiesRef,
  selectedBlock,
  isPropertiesFloating,
  isPropertiesOpen,
  onToggleProperties,
  updateBlock,
  onImageUrlChange,
  propertiesPanelClassName,
  onEditImage,
  onSpliceAndLink
}) => {
  const { getBrandColors } = useBrand();
  const brandColors = getBrandColors();

  return (
    <aside
      className={propertiesPanelClassName}
      aria-label="Component properties"
      ref={propertiesRef}
      tabIndex={-1}
    >
      {isPropertiesFloating && (
        <button
          className={styles.propertiesToggle}
          type="button"
          onClick={onToggleProperties}
          aria-expanded={isPropertiesOpen}
          aria-label={isPropertiesOpen ? "Collapse properties" : "Expand properties"}
        >
          <ChevronsRight
            className={`${styles.panelToggleIcon} ${isPropertiesOpen ? styles.panelToggleIconOpen : ""} icon`}
          />
        </button>
      )}
      <div className={styles.propertiesContent}>
        {!selectedBlock ? (
          <div className={styles.propertiesEmpty}>
            <h3>No block selected</h3>
            <p>Select a component on the canvas to edit its content and style.</p>
          </div>
        ) : (
          <>
            {/* Heading for non-button, non-image blocks */}
            {selectedBlock && selectedBlock.type !== "button" && selectedBlock.type !== "image" && (
              <div className={styles.propertiesHeading}>
                <span className={styles.propertiesBadge}>{blockLabels[selectedBlock.type] ?? "Component"}</span>
                <p>
                  {(selectedBlock.type === "text" || selectedBlock.type === "paragraph" || selectedBlock.type === "headline")
                    ? "Double-click the text to edit directly with rich formatting options, or use the fields below."
                    : "Edit content, spacing, and alignment for this block."}
                </p>
              </div>
            )}

            {/* Heading for image blocks */}
            {selectedBlock && selectedBlock.type === "image" && (
              <div className={styles.propertiesHeading}>
                <span className={styles.propertiesBadge}>Image</span>
              </div>
            )}

            <form className={styles.propertiesForm} onSubmit={(event) => event.preventDefault()}>

              {/* Section Properties */}
              {selectedBlock.type === "section" && (
                <SectionProperties
                  selectedBlock={selectedBlock}
                  updateBlock={updateBlock}
                  brandColors={brandColors}
                />
              )}

              {/* Image Properties (includes image-table) */}
              {(selectedBlock.type === "image" || selectedBlock.type === "image-table") && (
                <ImageProperties
                  selectedBlock={selectedBlock}
                  updateBlock={updateBlock}
                  onImageUrlChange={onImageUrlChange}
                  onEditImage={onEditImage}
                  onSpliceAndLink={onSpliceAndLink}
                  brandColors={brandColors}
                />
              )}

              {/* Divider Properties */}
              {selectedBlock.type === "divider" && (
                <DividerProperties
                  selectedBlock={selectedBlock}
                  updateBlock={updateBlock}
                  brandColors={brandColors}
                />
              )}

              {/* Text Properties (text, paragraph, headline) */}
              {(selectedBlock.type === "text" || selectedBlock.type === "paragraph" || selectedBlock.type === "headline") && (
                <>
                  <TextProperties
                    selectedBlock={selectedBlock}
                    updateBlock={updateBlock}
                    brandColors={brandColors}
                  />
                  <CommonProperties
                    selectedBlock={selectedBlock}
                    updateBlock={updateBlock}
                  />
                </>
              )}

              {/* Button Properties */}
              {selectedBlock.type === "button" && (
                <ButtonProperties
                  selectedBlock={selectedBlock}
                  updateBlock={updateBlock}
                  brandColors={brandColors}
                />
              )}

            </form>
          </>
        )}
      </div>
    </aside>
  );
};

export default PropertiesPanel;
