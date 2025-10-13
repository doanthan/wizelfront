import React, { useState } from 'react';
import { ChevronDown, Moon, Sun, Check } from 'lucide-react';
import styles from './email-builder.module.css';
import { generateEmailHTML, copyToClipboard } from './emailHtmlGenerator';
import BrandSelector from './BrandSelector';

const EmailBuilderHeader = ({ theme, onToggleTheme, blocks, documentTitle }) => {
  const [shareStatus, setShareStatus] = useState('idle'); // idle, copying, copied
  const handleShare = async () => {
    if (!blocks || blocks.length === 0) {
      alert('No content to share. Please add some blocks to your email first.');
      return;
    }

    setShareStatus('copying');

    try {
      // Generate the email HTML
      const html = generateEmailHTML(blocks, {
        title: documentTitle || 'Email Campaign',
        preheaderText: 'View this email in your browser',
        backgroundColor: '#f7fafc',
        maxWidth: 600
      });

      // Copy to clipboard
      const success = await copyToClipboard(html);

      if (success) {
        setShareStatus('copied');
        // Reset status after 2 seconds
        setTimeout(() => setShareStatus('idle'), 2000);
      } else {
        setShareStatus('idle');
        alert('Failed to copy HTML to clipboard. Please try again.');
      }
    } catch (error) {
      console.error('Error generating HTML:', error);
      setShareStatus('idle');
      alert('An error occurred while generating the HTML. Please try again.');
    }
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>AI</div>
        <div className={styles.brandCopy}>
          <span className={styles.brandName}>Aurora Studio</span>
          <span className={styles.brandTagline}>Modular email creation</span>
        </div>
      </div>
      <div className={styles.documentMeta}>
        <input
          className={styles.documentTitle}
          defaultValue="Spring Promotion"
          aria-label="Document title"
        />
        <div className={styles.documentStatus}>
          <span className={styles.statusIndicator} aria-hidden />
          <span>Saved moments ago</span>
        </div>
      </div>
      <div className={styles.topActions}>
        <BrandSelector />
        <button
          className="btn btn-ghost"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
        >
          {theme === "light" ? <Sun className="icon" /> : <Moon className="icon" />}
        </button>
        <button className="btn btn-secondary" type="button">
          Preview
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={handleShare}
          disabled={shareStatus === 'copying'}
        >
          {shareStatus === 'copied' ? (
            <>
              <Check className="icon" style={{ width: '16px', height: '16px' }} />
              HTML Copied!
            </>
          ) : shareStatus === 'copying' ? (
            'Generating...'
          ) : (
            'Share'
          )}
        </button>
        <div className={styles.userMenu} role="button" tabIndex={0}>
          <img src="https://i.pravatar.cc/40?img=12" alt="Viv" />
          <span>Viv</span>
          <ChevronDown className="icon" aria-hidden />
        </div>
      </div>
    </header>
  );
};

export default EmailBuilderHeader;