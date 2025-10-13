import React, { useState, useMemo } from 'react';
import { Columns, Columns2, Columns3, Columns4 } from 'lucide-react';
import styles from './email-builder.module.css';

const ColumnModal = ({ isOpen, onClose, onSelect }) => {
  const [selectedColumns, setSelectedColumns] = useState(2);
  const [selectedDistribution, setSelectedDistribution] = useState('equal');

  const columnOptions = [
    { value: 1, label: '1', icon: Columns },
    { value: 2, label: '2', icon: Columns2 },
    { value: 3, label: '3', icon: Columns3 },
    { value: 4, label: '4', icon: Columns4 }
  ];

  // Distribution options based on selected number of columns
  const distributionOptions = useMemo(() => {
    switch (selectedColumns) {
      case 1:
        return [{ id: 'equal', label: 'Full Width', widths: [100] }];
      case 2:
        return [
          { id: 'equal', label: 'Equal Widths (50% / 50%)', widths: [50, 50] },
          { id: '66-33', label: '66% / 33%', widths: [66.67, 33.33] },
          { id: '33-66', label: '33% / 66%', widths: [33.33, 66.67] },
          { id: '75-25', label: '75% / 25%', widths: [75, 25] },
          { id: '25-75', label: '25% / 75%', widths: [25, 75] }
        ];
      case 3:
        return [
          { id: 'equal', label: 'Equal Widths (33% / 33% / 33%)', widths: [33.33, 33.33, 33.33] },
          { id: '50-25-25', label: '50% / 25% / 25%', widths: [50, 25, 25] },
          { id: '25-50-25', label: '25% / 50% / 25%', widths: [25, 50, 25] },
          { id: '25-25-50', label: '25% / 25% / 50%', widths: [25, 25, 50] },
          { id: '40-30-30', label: '40% / 30% / 30%', widths: [40, 30, 30] }
        ];
      case 4:
        return [
          { id: 'equal', label: 'Equal Widths (25% / 25% / 25% / 25%)', widths: [25, 25, 25, 25] },
          { id: '40-20-20-20', label: '40% / 20% / 20% / 20%', widths: [40, 20, 20, 20] },
          { id: '20-20-20-40', label: '20% / 20% / 20% / 40%', widths: [20, 20, 20, 40] },
          { id: '30-30-20-20', label: '30% / 30% / 20% / 20%', widths: [30, 30, 20, 20] },
          { id: '20-20-30-30', label: '20% / 20% / 30% / 30%', widths: [20, 20, 30, 30] }
        ];
      default:
        return [];
    }
  }, [selectedColumns]);

  const handleColumnChange = (numColumns) => {
    setSelectedColumns(numColumns);
    setSelectedDistribution('equal'); // Reset to equal distribution when changing columns
  };

  const handleSelect = () => {
    const distribution = distributionOptions.find(d => d.id === selectedDistribution);
    onSelect(selectedColumns, distribution?.widths || distributionOptions[0].widths);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.columnModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Select number of columns"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.columnModalPanel}>
        <div className={styles.columnModalHeader}>
          <h3 className={styles.columnModalTitle}>Add Columns</h3>
        </div>

        <div className={styles.columnModalBody}>
          {/* Column count selection */}
          <div className={styles.columnCountSection}>
            <div className={styles.columnCountGrid}>
              {columnOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.columnCountButton} ${
                      selectedColumns === option.value ? styles.columnCountButtonActive : ''
                    }`}
                    onClick={() => handleColumnChange(option.value)}
                  >
                    <Icon className="icon" aria-hidden />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Width distribution section */}
          {selectedColumns > 1 && (
            <div className={styles.distributionSection}>
              <div className={styles.distributionLabel}>Width Distribution</div>
              <div className={styles.distributionOptions}>
                {distributionOptions.map((dist) => (
                  <button
                    key={dist.id}
                    type="button"
                    className={`${styles.distributionButton} ${
                      selectedDistribution === dist.id ? styles.distributionButtonActive : ''
                    }`}
                    onClick={() => setSelectedDistribution(dist.id)}
                  >
                    <div className={styles.distributionPreview}>
                      {dist.widths.map((width, idx) => (
                        <div
                          key={idx}
                          className={styles.distributionBar}
                          style={{ width: `${width}%` }}
                        />
                      ))}
                    </div>
                    <span className={styles.distributionText}>{dist.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.columnModalActions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSelect}
          >
            Add Columns
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnModal;