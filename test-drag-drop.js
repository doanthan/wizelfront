// Test drag and drop functionality
const testDragDrop = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Starting drag and drop test...');
  
  // Navigate to email builder
  const response = await fetch(`${baseUrl}/api/playwright`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'navigate',
      url: `${baseUrl}/store/v8dUBXR/email-builder`
    })
  });
  
  if (!response.ok) {
    console.error('Failed to navigate:', await response.text());
    return;
  }
  
  console.log('Navigated to email builder');
  
  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if components are visible
  const checkComponents = await fetch(`${baseUrl}/api/playwright`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'evaluate',
      script: `
        // Check for draggable components
        const components = document.querySelectorAll('[draggable="true"]');
        const canvas = document.querySelector('[data-drop-zone]');
        const enhancedButton = document.querySelector('button[title*="Enhanced"]');
        
        return {
          componentsCount: components.length,
          componentIds: Array.from(components).map(c => c.textContent?.trim()).slice(0, 5),
          canvasExists: !!canvas,
          enhancedMode: enhancedButton?.classList.contains('bg-purple-600')
        };
      `
    })
  });
  
  const componentsData = await checkComponents.json();
  console.log('Components found:', componentsData);
  
  // Try to start dragging a component
  const startDrag = await fetch(`${baseUrl}/api/playwright`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'evaluate',
      script: `
        // Find the first text component
        const textComponent = Array.from(document.querySelectorAll('[draggable="true"]'))
          .find(el => el.textContent?.includes('Text'));
        
        if (textComponent) {
          // Simulate drag start
          const dragStartEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          });
          
          // Set data on the dataTransfer
          dragStartEvent.dataTransfer.setData('componentType', 'text');
          dragStartEvent.dataTransfer.setData('componenttype', 'text');
          dragStartEvent.dataTransfer.setData('text/plain', JSON.stringify({type: 'text'}));
          dragStartEvent.dataTransfer.effectAllowed = 'copy';
          
          textComponent.dispatchEvent(dragStartEvent);
          
          // Now check for canvas drag enter
          const canvas = document.querySelector('.max-w-3xl.mx-auto');
          if (canvas) {
            const dragEnterEvent = new DragEvent('dragenter', {
              bubbles: true,
              cancelable: true,
              dataTransfer: dragStartEvent.dataTransfer
            });
            canvas.dispatchEvent(dragEnterEvent);
            
            // Check if isDragging state is set
            setTimeout(() => {
              const dropZones = document.querySelectorAll('[data-drop-zone]');
              const visibleDropZones = Array.from(dropZones).filter(dz => {
                const styles = window.getComputedStyle(dz);
                return styles.display !== 'none' && styles.visibility !== 'hidden' && styles.height !== '0px';
              });
              
              window.testResult = {
                dropZonesFound: dropZones.length,
                visibleDropZones: visibleDropZones.length,
                dropZoneInfo: Array.from(visibleDropZones).map(dz => ({
                  variant: dz.dataset.variant,
                  active: dz.dataset.active,
                  over: dz.dataset.over,
                  height: window.getComputedStyle(dz).height,
                  opacity: window.getComputedStyle(dz).opacity
                }))
              };
            }, 100);
          }
          
          return {
            dragStarted: true,
            canvasFound: !!canvas
          };
        }
        
        return {
          dragStarted: false,
          error: 'Text component not found'
        };
      `
    })
  });
  
  const dragResult = await startDrag.json();
  console.log('Drag start result:', dragResult);
  
  // Wait a bit for the state to update
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check for drop zones
  const checkDropZones = await fetch(`${baseUrl}/api/playwright`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'evaluate',
      script: `
        // Get the test result we stored
        const result = window.testResult || {};
        
        // Also check console logs
        const consoleLogs = [];
        const originalLog = console.log;
        console.log = function(...args) {
          consoleLogs.push(args.join(' '));
          originalLog.apply(console, args);
        };
        
        // Check current state
        const allDropZones = document.querySelectorAll('[data-drop-zone]');
        const currentVisibleZones = Array.from(allDropZones).filter(dz => {
          const rect = dz.getBoundingClientRect();
          const styles = window.getComputedStyle(dz);
          return rect.height > 0 || styles.height !== '0px';
        });
        
        return {
          ...result,
          currentDropZones: allDropZones.length,
          currentVisibleZones: currentVisibleZones.length,
          zoneDetails: Array.from(currentVisibleZones).map(dz => ({
            id: dz.id,
            variant: dz.dataset.variant,
            isActive: dz.dataset.active === 'true',
            height: window.getComputedStyle(dz).height,
            display: window.getComputedStyle(dz).display,
            opacity: window.getComputedStyle(dz).opacity,
            innerHTML: dz.innerHTML.substring(0, 100)
          })),
          consoleLogs
        };
      `
    })
  });
  
  const dropZoneData = await checkDropZones.json();
  console.log('Drop zones check:', dropZoneData);
  
  // Take a screenshot
  const screenshot = await fetch(`${baseUrl}/api/playwright`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'screenshot',
      path: 'drag-drop-test.png'
    })
  });
  
  console.log('Screenshot saved to drag-drop-test.png');
  
  return dropZoneData;
};

// Run the test
testDragDrop().then(result => {
  console.log('Test completed:', result);
}).catch(error => {
  console.error('Test failed:', error);
});