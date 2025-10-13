/**
 * Email HTML Generator
 * Converts email builder blocks to production-ready, email-client compatible HTML
 *
 * Key Features:
 * - Table-based layouts for maximum compatibility
 * - Inline CSS (no external stylesheets)
 * - Outlook VML fallbacks for buttons and backgrounds
 * - Mobile-responsive design with media queries
 * - 600px max width standard for emails
 */

/**
 * Escapes HTML entities to prevent XSS
 */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates a text block (headline, paragraph, or text)
 */
function generateTextBlock(block) {
  const tagMap = {
    headline: 'h1',
    paragraph: 'p',
    text: 'div'
  };

  const tag = tagMap[block.type] || 'div';
  const fontSize = block.fontSize || 16;
  const fontFamily = block.fontFamily || 'Arial, Helvetica, sans-serif';
  const textColor = block.textColor || '#2d3748';
  const alignment = block.alignment || 'left';
  const lineHeight = block.lineHeight || (block.type === 'paragraph' ? 1.6 : 1.3);
  const padding = block.padding || 20;
  const letterSpacing = block.letterSpacing ? `${block.letterSpacing}px` : '0';

  const styles = [
    `font-size: ${fontSize}px`,
    `font-family: ${fontFamily}`,
    `color: ${textColor}`,
    `text-align: ${alignment}`,
    `line-height: ${lineHeight}`,
    `letter-spacing: ${letterSpacing}`,
    `margin: 0`,
    `padding: 0`,
    `mso-line-height-rule: exactly` // Outlook line-height fix
  ].join('; ');

  const content = escapeHtml(block.content || '');

  return `
    <tr>
      <td style="padding: ${padding}px;">
        <${tag} style="${styles}">${content}</${tag}>
      </td>
    </tr>`;
}

/**
 * Generates a button block with Outlook VML fallback
 */
function generateButtonBlock(block) {
  const backgroundColor = block.backgroundColor || '#007bff';
  const textColor = block.textColor || '#ffffff';
  const fontSize = block.fontSize || 16;
  const fontFamily = block.fontFamily || 'Arial, Helvetica, sans-serif';
  const fontWeight = block.fontWeight || '500';
  const borderRadius = block.borderRadius || 4;
  const buttonPaddingX = block.buttonPaddingX || 24;
  const buttonPaddingY = block.buttonPaddingY || 12;
  const padding = block.padding || 16;
  const alignment = block.alignment || 'center';
  const buttonUrl = block.buttonUrl || '#';
  const content = escapeHtml(block.content || 'Click Here');
  const borderWidth = block.borderWidth || 0;
  const borderColor = block.borderColor || backgroundColor;
  const minWidth = block.minWidth || 120;

  const buttonHeight = (buttonPaddingY * 2) + (fontSize * 1.2);
  const buttonWidth = Math.max(minWidth, content.length * 8 + (buttonPaddingX * 2));

  return `
    <tr>
      <td style="padding: ${padding}px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 ${alignment === 'center' ? 'auto' : (alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0')};">
          <tr>
            <td align="center" bgcolor="${backgroundColor}" role="presentation" style="border: ${borderWidth}px solid ${borderColor}; border-radius: ${borderRadius}px; background-color: ${backgroundColor};">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${buttonUrl}" style="height:${buttonHeight}px; v-text-anchor:middle; width:${buttonWidth}px;" arcsize="${Math.min(50, (borderRadius / Math.max(buttonPaddingY, 1)) * 100)}%" stroke="f" fillcolor="${backgroundColor}">
                <w:anchorlock/>
                <center style="color:${textColor}; font-family:${fontFamily}; font-size:${fontSize}px; font-weight:${fontWeight};">
                  ${content}
                </center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${buttonUrl}" target="${block.buttonTarget || '_blank'}" style="background-color: ${backgroundColor}; border: ${borderWidth}px solid ${borderColor}; border-radius: ${borderRadius}px; color: ${textColor}; display: inline-block; font-family: ${fontFamily}; font-size: ${fontSize}px; font-weight: ${fontWeight}; line-height: 1.2; padding: ${buttonPaddingY}px ${buttonPaddingX}px; text-align: center; text-decoration: none; min-width: ${minWidth}px; min-height: 44px; box-sizing: border-box; -webkit-text-size-adjust: none; mso-hide: all;">
                ${content}
              </a>
              <!--<![endif]-->
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/**
 * Generates an image block
 */
function generateImageBlock(block) {
  const imageUrl = block.imageUrl || '/img.png';
  const alt = escapeHtml(block.content || '');
  const padding = block.padding || 0;
  const alignment = block.alignment || 'left';

  return `
    <tr>
      <td style="padding: ${padding}px; text-align: ${alignment}; line-height: 0;">
        <img src="${imageUrl}" alt="${alt}" style="display: block; max-width: 100%; width: 100%; height: auto; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; margin: 0;" />
      </td>
    </tr>`;
}

/**
 * Generates a divider block with SVG
 */
function generateDividerBlock(block) {
  const {
    dividerStyle = 'line',
    dividerColor = '#E5E7EB',
    dividerHeight = 40,
    dividerWidth = 100,
    padding = 20
  } = block;

  const width = 600; // Max email width
  const actualWidth = Math.round((width * dividerWidth) / 100);
  const height = dividerHeight;

  let svgPath = '';

  switch (dividerStyle) {
    case 'wave':
      svgPath = `<path d="M0,${height / 2} Q${actualWidth / 4},${height * 0.2} ${actualWidth / 2},${height / 2} T${actualWidth},${height / 2}" fill="none" stroke="${dividerColor}" stroke-width="2"/>`;
      break;
    case 'zigzag':
      const zigzagPoints = [];
      const segments = 10;
      const segmentWidth = actualWidth / segments;
      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth;
        const y = i % 2 === 0 ? height * 0.3 : height * 0.7;
        zigzagPoints.push(`${x},${y}`);
      }
      svgPath = `<polyline points="${zigzagPoints.join(' ')}" fill="none" stroke="${dividerColor}" stroke-width="2"/>`;
      break;
    case 'dots':
      const dots = [];
      const dotCount = 20;
      const dotSpacing = actualWidth / (dotCount - 1);
      for (let i = 0; i < dotCount; i++) {
        const cx = i * dotSpacing;
        dots.push(`<circle cx="${cx}" cy="${height / 2}" r="2" fill="${dividerColor}"/>`);
      }
      svgPath = dots.join('');
      break;
    case 'dashed':
      svgPath = `<line x1="0" y1="${height / 2}" x2="${actualWidth}" y2="${height / 2}" stroke="${dividerColor}" stroke-width="2" stroke-dasharray="8 4"/>`;
      break;
    case 'double':
      svgPath = `<line x1="0" y1="${height * 0.4}" x2="${actualWidth}" y2="${height * 0.4}" stroke="${dividerColor}" stroke-width="2"/><line x1="0" y1="${height * 0.6}" x2="${actualWidth}" y2="${height * 0.6}" stroke="${dividerColor}" stroke-width="2"/>`;
      break;
    case 'line':
    default:
      svgPath = `<line x1="0" y1="${height / 2}" x2="${actualWidth}" y2="${height / 2}" stroke="${dividerColor}" stroke-width="2"/>`;
  }

  const svgCode = `<svg width="${actualWidth}" height="${height}" viewBox="0 0 ${actualWidth} ${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;max-width:100%;">${svgPath}</svg>`;

  return `
    <tr>
      <td style="padding: ${padding}px 0; text-align: center;">
        ${svgCode}
      </td>
    </tr>`;
}

/**
 * Generates a columns block
 */
function generateColumnsBlock(block) {
  const numColumns = block.columns || 2;
  const widths = block.columnWidths || Array(numColumns).fill(100 / numColumns);
  const columnChildren = block.columnChildren || Array(numColumns).fill([]);
  const padding = block.padding || 16;
  const isSpliced = block.isSpliced === true;
  const gap = isSpliced ? 0 : 12;

  // Calculate actual pixel widths (out of 600px total)
  const totalWidth = 600;
  const gapTotal = gap * (numColumns - 1);
  const availableWidth = totalWidth - gapTotal - (isSpliced ? 0 : padding * 2);

  const columnHtmls = widths.map((width, idx) => {
    const columnWidth = Math.floor((width / 100) * availableWidth);
    const columnBlocks = columnChildren[idx] || [];
    const columnContent = columnBlocks.map(childBlock => generateBlock(childBlock)).join('');

    return `
      <td width="${columnWidth}" valign="top" style="width: ${columnWidth}px; vertical-align: top; ${idx < numColumns - 1 ? `padding-right: ${gap}px;` : ''}">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; width: 100%;">
          ${columnContent}
        </table>
      </td>`;
  }).join('');

  return `
    <tr>
      <td style="padding: ${isSpliced ? 0 : padding}px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; width: 100%;">
          <tr>
            ${columnHtmls}
          </tr>
        </table>
      </td>
    </tr>`;
}

/**
 * Generates a section block
 */
function generateSectionBlock(block) {
  const children = block.children || [];
  const padding = block.padding ?? 24;
  const backgroundColor = block.backgroundColor || 'transparent';
  const isSpliced = block.isSpliced === true;
  const borderRadius = isSpliced ? 0 : 8;
  const borderWidth = block.borderWidth || 0;
  const borderStyle = block.borderStyle || 'solid';
  const borderColor = block.borderColor || '#e2e8f0';

  const childrenHtml = children.map(child => generateBlock(child)).join('');

  let backgroundImageStyles = '';
  if (block.backgroundImage) {
    const backgroundSize = block.backgroundSize || 'cover';
    const backgroundPosition = block.backgroundPosition || 'center';
    const backgroundRepeat = block.backgroundRepeat || 'no-repeat';
    backgroundImageStyles = `background-image: url(${block.backgroundImage}); background-size: ${backgroundSize}; background-position: ${backgroundPosition}; background-repeat: ${backgroundRepeat};`;
  }

  const border = borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none';

  return `
    <tr>
      <td style="padding: ${isSpliced ? 0 : padding}px; background-color: ${backgroundColor}; ${backgroundImageStyles} border: ${border}; border-radius: ${borderRadius}px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; width: 100%;">
          ${childrenHtml}
        </table>
      </td>
    </tr>`;
}

/**
 * Generates HTML for a single block
 */
function generateBlock(block) {
  if (!block || !block.type) return '';

  switch (block.type) {
    case 'text':
    case 'headline':
    case 'paragraph':
      return generateTextBlock(block);
    case 'button':
      return generateButtonBlock(block);
    case 'image':
      return generateImageBlock(block);
    case 'divider':
      return generateDividerBlock(block);
    case 'columns':
      return generateColumnsBlock(block);
    case 'section':
      return generateSectionBlock(block);
    default:
      return '';
  }
}

/**
 * Generates the complete email HTML document
 */
export function generateEmailHTML(blocks, options = {}) {
  const {
    title = 'Email',
    preheaderText = '',
    backgroundColor = '#f7fafc',
    maxWidth = 600
  } = options;

  const blocksHtml = blocks.map(block => generateBlock(block)).join('');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${escapeHtml(title)}</title>

  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  <style>
    /* Reset styles */
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    /* Client-specific styles */
    #outlook a {
      padding: 0;
    }

    .ReadMsgBody,
    .ExternalClass {
      width: 100%;
    }

    .ExternalClass,
    .ExternalClass p,
    .ExternalClass span,
    .ExternalClass font,
    .ExternalClass td,
    .ExternalClass div {
      line-height: 100%;
    }

    /* Mobile optimization */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .mobile-padding {
        padding-left: 10px !important;
        padding-right: 10px !important;
      }

      .mobile-full-width {
        width: 100% !important;
        max-width: 100% !important;
      }

      .mobile-text-center {
        text-align: center !important;
      }

      /* Stack columns on mobile */
      .mobile-stack {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg {
        background-color: #1a202c !important;
      }

      .dark-mode-text {
        color: #e2e8f0 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${backgroundColor}; font-family: Arial, Helvetica, sans-serif;">

  <!-- Preheader text (hidden but shows in email preview) -->
  ${preheaderText ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${escapeHtml(preheaderText)}</div>` : ''}

  <!-- 100% background wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 0;">

        <!-- Email container: 600px max width -->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="${maxWidth}" style="max-width: ${maxWidth}px; width: 100%; background-color: #ffffff; margin: 0 auto;">
          ${blocksHtml}
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Copies HTML to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);

    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
