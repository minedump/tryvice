export const getStyles = (primaryColor: string) => `
  :host { 
    --primary: ${primaryColor || '#000'}; 
    --bg: #fff; 
    --zinc-100: #f4f4f5; 
    --zinc-200: #e4e4e7; 
    --zinc-400: #a1a1aa; 
    --zinc-500: #71717a; 
  }
  * { box-sizing: border-box; }
  
  .tv-floating-btn {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--primary); color: white;
    height: 56px; min-width: 56px; border-radius: 28px;
    cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 9999;
    align-items: center; justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; padding: 0 16px;
  }
  .tv-floating-btn .tv-btn-text { max-width: 0; opacity: 0; white-space: nowrap; transition: all 0.3s ease; font-size: 14px; margin-left: 0; }
  .tv-floating-btn:hover { padding: 0 24px; }
  .tv-floating-btn:hover .tv-btn-text { max-width: 200px; opacity: 1; margin-left: 12px; }

  .tv-modal {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    align-items: center; justify-content: center; z-index: 10000;
    font-family: 'Inter', -apple-system, sans-serif;
  }
  .tv-content {
    background: white; border-radius: 48px; width: 440px; max-height: 90vh;
    display: flex; flex-direction: column; overflow: hidden; position: relative;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  }
  .tv-header { padding: 32px 40px 24px; display: flex; justify-content: space-between; align-items: center; }
  .tv-logo { height: 18px; color: #000; display: flex; align-items: center; }
  .tv-logo svg { height: 100%; width: auto; }
  .tv-close { cursor: pointer; color: #000; transition: opacity 0.2s; display: flex; align-items: center; }
  .tv-close:hover { opacity: 0.6; }

  .tv-body { padding: 0 40px 40px; overflow-y: auto; flex: 1; text-align: left; }
  .tv-title { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #000; letter-spacing: -0.02em; text-align: left; }
  .tv-subtitle { font-size: 15px; color: var(--zinc-500); margin-bottom: 32px; line-height: 1.5; text-align: left; }
  
  .tv-guide { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; }
  .tv-guide-item { position: relative; border-radius: 24px; overflow: hidden; aspect-ratio: 3/4; background: var(--zinc-100); }
  .tv-guide-item img { width: 100%; height: 100%; object-fit: cover; }
  .tv-badge { position: absolute; bottom: 16px; left: 16px; width: 28px; height: 28px; }
  .tv-badge svg { width: 100%; height: 100%; }

  .tv-main-btn { background: #000; color: #fff; width: 100%; padding: 20px; border: none; border-radius: 20px; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.1s, background 0.2s; }
  .tv-main-btn:hover { background: #222; }
  .tv-main-btn:active { transform: scale(0.98); }
  
  .tv-secondary-btn { background: #fff; color: #000; border: 1px solid var(--zinc-200); width: 100%; padding: 16px; border-radius: 16px; font-weight: 700; font-size: 14px; cursor: pointer; }
  .tv-secondary-btn.active { border-color: #000; background: var(--zinc-100); }

  .tv-progress-container { margin: 40px 0; }
  .tv-progress-bar { background: var(--zinc-100); height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
  .tv-progress-fill { background: #000; height: 100%; transition: width 0.3s ease; }
  .tv-progress-text { font-size: 12px; font-weight: 700; color: #000; }

  .tv-error-box { color: #EF4444; margin-bottom: 24px; }
  .tv-error-icon { width: 32px; height: 32px; margin: 0 auto 16px; }

  .tv-user-photo-preview { width: 100%; aspect-ratio: 3/4; border-radius: 24px; object-fit: cover; margin-bottom: 32px; background: var(--zinc-100); }
  
  .tv-history-section { margin-top: 32px; text-align: left; }
  .tv-history-title { font-size: 14px; font-weight: 700; margin-bottom: 16px; }
  .tv-history-list { display: flex; gap: 12px; align-items: center; overflow-x: auto; padding-bottom: 8px; }
  .tv-history-item-wrapper { position: relative; flex-shrink: 0; }
  .tv-history-item { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid transparent; }
  .tv-history-item.active { border-color: #000; }
  .tv-delete-photo { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; opacity: 0; transition: opacity 0.2s; color: #EF4444; }
  .tv-history-item-wrapper:hover .tv-delete-photo { opacity: 1; }
  .tv-add-photo { width: 56px; height: 56px; border-radius: 50%; border: 1px solid var(--zinc-200); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--zinc-400); flex-shrink: 0; }

  .tv-actions-menu { position: absolute; bottom: 0; left: 0; right: 0; background: white; border-radius: 32px 32px 0 0; padding: 32px; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; box-shadow: 0 -10px 25px -5px rgba(0,0,0,0.1); }
  .tv-actions-menu.open { transform: translateY(0); }
  .tv-action-item { display: flex; align-items: center; gap: 12px; padding: 16px 0; cursor: pointer; font-size: 14px; font-weight: 600; color: #000; border-bottom: 1px solid var(--zinc-100); }
  .tv-action-item:last-child { border-bottom: none; }
  .tv-action-item svg { color: var(--zinc-400); }
  
  .tv-toast { position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%); background: white; padding: 12px 20px; border-radius: 30px; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 200; opacity: 0; pointer-events: none; transition: all 0.3s ease; }
  .tv-toast.show { opacity: 1; bottom: 120px; }

  .tv-footer { font-size: 11px; color: var(--zinc-400); margin-top: 40px; text-align: center; }
  .tv-consent { font-size: 11px; color: var(--zinc-400); margin-top: 20px; line-height: 1.5; text-align: center; }
  .tv-consent a { color: #000; text-decoration: underline; }
`;
