"use client";

import { useState, useEffect } from 'react';
import { FileText, MessageSquare } from 'lucide-react';
import { InlineLoader } from '@/app/components/ui/loading';
import { cn } from '@/lib/utils';

export const EmailPreviewPanel = ({ messageId, storeId, campaign, compact = false }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!messageId) {
        console.warn('EmailPreviewPanel: No messageId provided - cannot fetch preview');
        setLoading(false);
        setContent(null);
        return;
      }

      console.log('📧 EmailPreviewPanel: Fetching content for:', { messageId, storeId, campaign });

      try {
        setLoading(true);

        // Check if we have stored preview URLs first (for sent campaigns)
        const channel = campaign?.channel || campaign?.type || campaign?.groupings?.send_channel;
        const hasStoredPreview = channel === 'email'
          ? (campaign?.preview_image_html || campaign?.preview_image_url)
          : channel === 'sms'
            ? campaign?.preview_sms_url
            : false;

        if (hasStoredPreview) {
          console.log('✅ EmailPreviewPanel: Using stored preview URLs:', {
            channel,
            preview_image_html: campaign?.preview_image_html,
            preview_image_url: campaign?.preview_image_url,
            preview_sms_url: campaign?.preview_sms_url
          });

          // For email with HTML preview
          if (channel === 'email' && campaign.preview_image_html) {
            // Fetch the HTML content directly from R2 (fastest)
            try {
              console.log('📧 Fetching email preview from R2:', campaign.preview_image_html);

              const htmlResponse = await fetch(campaign.preview_image_html);
              if (!htmlResponse.ok) {
                throw new Error(`R2 fetch failed: ${htmlResponse.status}`);
              }

              const htmlContent = await htmlResponse.text();
              console.log('✅ Email preview loaded from R2:', {
                contentLength: htmlContent.length,
                url: campaign.preview_image_html
              });

              setContent({
                channel: 'email',
                type: 'email',
                html: htmlContent, // Load HTML directly
                previewHtmlUrl: campaign.preview_image_html,
                previewImageUrl: campaign.preview_image_url,
                fromLabel: campaign.from_label || campaign.fromLabel,
                fromEmail: campaign.from_address || campaign.fromAddress,
                subject: campaign.subject_line || campaign.subject
              });
              setLoading(false);
              return;
            } catch (error) {
              console.error('❌ Failed to fetch HTML preview from R2:', error);
              console.log('Falling back to Klaviyo API...');
              // Fall through to fetch from Klaviyo API
            }
          }

          // For SMS with text preview
          if (channel === 'sms' && campaign.preview_sms_url) {
            // Fetch the SMS text content directly from R2 (fastest)
            try {
              console.log('📱 Fetching SMS preview from R2:', campaign.preview_sms_url);

              const smsResponse = await fetch(campaign.preview_sms_url);
              if (!smsResponse.ok) {
                throw new Error(`R2 fetch failed: ${smsResponse.status}`);
              }

              const smsText = await smsResponse.text();
              console.log('✅ SMS preview loaded from R2:', {
                textLength: smsText.length,
                url: campaign.preview_sms_url
              });

              setContent({
                channel: 'sms',
                type: 'sms',
                body: smsText,
                previewUrl: campaign.preview_sms_url
              });
              setLoading(false);
              return;
            } catch (error) {
              console.error('❌ Failed to fetch SMS preview from R2:', error);
              console.log('Falling back to Klaviyo API...');
              // Fall through to fetch from Klaviyo API
            }
          }
        }

        // If no stored preview or fetch failed, fall back to API
        // StoreId is required for the API
        if (!storeId) {
          console.error('EmailPreviewPanel: StoreId is required to fetch campaign content');
          console.log('Available info:', { messageId, storeId });
          setContent(null);
          setLoading(false);
          return;
        }

        const url = `/api/klaviyo/campaign-message/${messageId}?storeId=${storeId}`;
        console.log('🔗 EmailPreviewPanel: Fetching from Klaviyo API:', url);
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          console.log('✅ EmailPreviewPanel: Received content from API:', {
            success: result.success,
            channel: result.data?.channel || result.data?.type,
            hasHtml: !!result.data?.html,
            hasBody: !!result.data?.body,
            bodyLength: result.data?.body?.length || 0,
            fullData: result.data
          });
          setContent(result.data || result);
        } else {
          const errorText = await response.text();
          console.error('❌ EmailPreviewPanel: Failed to fetch campaign content:', response.status, errorText);
          setContent(null);
        }
      } catch (error) {
        console.error('❌ EmailPreviewPanel: Error fetching content:', error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [messageId, storeId, campaign]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-full min-h-[400px]", compact ? "p-4" : "p-8")}>
        <div className="text-center">
          <InlineLoader size="medium" showText={true} text={compact ? "Loading..." : "Loading preview..."} />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500", compact ? "p-4" : "p-8")}>
        <FileText className={cn("mb-3 text-gray-400", compact ? "h-8 w-8" : "h-12 w-12")} />
        <p className={compact ? "text-xs" : ""}>No preview available</p>
      </div>
    );
  }


  // Handle SMS content - updated to support new API response format
  if (content.channel === 'sms' || content.type === 'sms') {
    // Process the SMS body to show template variables in a readable way
    const displayBody = content.body || content.rawBody || content.text || '';
    
    // Highlight template variables if they exist
    const processedBody = displayBody.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      return `[${variable.trim()}]`;
    });
    
    console.log('SMS Preview - Original body:', displayBody);
    console.log('SMS Preview - Processed body:', processedBody);
    
    return (
      <div className="h-full w-full flex flex-col">
        {/* SMS header info - only show in non-compact mode */}
        {!compact && (
          <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-gray-500">SMS Message Preview</span>
                </div>
                {content.fromPhone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">From:</span>
                    <span className="font-medium">{content.fromPhone}</span>
                  </div>
                )}
                {content.campaignName && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Campaign:</span>
                    <span className="font-medium">{content.campaignName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* SMS content - styled like a phone message */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className={compact ? "p-3" : "p-6"}>
            <div className={compact ? "max-w-sm mx-auto" : "max-w-md mx-auto"}>
              {/* Phone mockup container */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-4 border-2 border-gray-300 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 min-h-[200px]">
                  {displayBody ? (
                    <>
                      <div className="bg-green-500 text-white rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[85%] ml-auto">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {processedBody}
                        </p>
                      </div>
                      {content.mediaUrl && (
                        <div className="mt-2 max-w-[85%] ml-auto">
                          <img 
                            src={content.mediaUrl} 
                            alt="SMS Media" 
                            className="w-full h-auto rounded-lg shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      No SMS content available
                    </div>
                  )}
                </div>
              </div>
              
              {/* Template info */}
              {displayBody && displayBody.includes('{{') && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
                    Template Variables Detected:
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Variables like [first_name] will be replaced with actual customer data when sent.
                  </p>
                </div>
              )}
              
              {/* Character count */}
              {displayBody && (
                <div className="mt-3 text-xs text-gray-500 text-center">
                  <span className="font-medium">{displayBody.length}</span> characters
                  {content.mediaUrl && <span className="ml-2">• Media attached</span>}
                  {displayBody.length > 160 && (
                    <span className="ml-2 text-orange-500">
                      • Will use {Math.ceil(displayBody.length / 160)} SMS segments
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Email content (existing code)
  return (
    <div className="h-full w-full flex flex-col">
      {/* Email header info - only show in non-compact mode */}
      {!compact && (
        <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">From:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{content.fromLabel || content.fromEmail || 'Unknown sender'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Subject:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{content.subject || 'No subject'}</span>
              </div>
            </div>
            {content.previewText && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-500">Preview:</span>
                <span className="text-gray-600 italic">{content.previewText}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email content - scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-900">
        <div className={compact ? "p-2" : "p-4"}>
          {content.html ? (
            // Display HTML content directly (faster and more secure than iframe)
            <div
              className="email-content"
              dangerouslySetInnerHTML={{ __html: content.html }}
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            />
          ) : content.text ? (
            <pre className="whitespace-pre-wrap font-sans text-sm">{content.text}</pre>
          ) : (
            <p className="text-gray-500 text-center py-8">No content available</p>
          )}
        </div>
      </div>
    </div>
  );
};