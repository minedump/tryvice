(function() {
  const scriptSrc = document.currentScript ? document.currentScript.src : '';
  const API_BASE = (scriptSrc ? new URL(scriptSrc).origin : '') + '/api/widget';

  class TryViceWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.visitorId = this.getOrCreateVisitorId();
      this.state = {
        isOpen: false,
        step: 'upload', // upload, mode-select, processing, result
        userImage: null,
        resultImage: null,
        loading: false,
        settings: null,
        history: [],
        savedPhotos: []
      };
    }

    getOrCreateVisitorId() {
      let id = localStorage.getItem('tv_visitor_id');
      if (!id) {
        // Генерируем валидный UUID v4
        id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
        localStorage.setItem('tv_visitor_id', id);
      }
      return id;
    }

    async connectedCallback() {
      const shopId = this.getAttribute('data-shop-id');
      const buttonSelector = this.getAttribute('data-button-selector');
      
      try {
        const res = await fetch(`${API_BASE}/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ shop_id: shopId, domain: window.location.hostname })
        });
        const data = await res.json();

        if (data.active) {
          this.state.settings = data.settings;
          
          const urlMask = data.settings.url_mask;
          if (urlMask && !window.location.pathname.includes(urlMask)) {
            console.log('TryVice: URL does not match mask, skipping initialization');
            return;
          }

          this.loadHistory();
          this.render();
          this.setupExternalButtons(buttonSelector);
          this.trackEvent('widget_view');
        } else {
          console.log('TryVice: Widget inactive');
        }
      } catch (e) {
        console.error('TryVice Init Error:', e);
      }
    }

    setupExternalButtons(selector) {
      if (!selector) return;
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleModal(true);
        });
      });
    }

    loadHistory() {
      const history = localStorage.getItem('tv_history');
      if (history) {
        const parsed = JSON.parse(history);
        this.state.history = parsed.generations || [];
        this.state.savedPhotos = parsed.photos || [];
      }
    }

    saveToHistory(type, item) {
      const history = JSON.parse(localStorage.getItem('tv_history') || '{"generations":[], "photos":[]}');
      if (type === 'photo') {
        if (!history.photos.includes(item)) history.photos.unshift(item);
        history.photos = history.photos.slice(0, 5);
      } else {
        history.generations.unshift(item);
      }
      localStorage.setItem('tv_history', JSON.stringify(history));
      this.loadHistory();
    }

    toggleModal(show) {
      this.state.isOpen = show;
      if (show) this.trackEvent('widget_open');
      this.render();
    }

    async handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      this.state.loading = true;
      this.render();

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        try {
          const res = await fetch(`${API_BASE}/analyze-image`, {
            method: 'POST', 
            body: JSON.stringify({ 
              image_url: base64, 
              shop_id: this.getAttribute('data-shop-id'),
              visitor_id: this.visitorId
            })
          });
          const analysis = await res.json();

          if (analysis.suitable) {
            this.state.userImage = analysis.image_url; // Используем URL из Storage
            this.state.step = 'mode-select';
            this.saveToHistory('photo', analysis.image_url);
          } else {
            this.state.error = analysis.reason || 'Это фото не подходит для примерки. Попробуйте другое.';
          }
        } catch (err) {
          this.state.error = 'Ошибка при анализе фото. Попробуйте позже.';
        }
        
        this.state.loading = false;
        this.render();
      };
      reader.readAsDataURL(file);
    }

    async handleTryOn(mode) {
      this.state.loading = true;
      this.render();

      try {
        const res = await fetch(`${API_BASE}/tryon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            shop_id: this.getAttribute('data-shop-id'),
            product_id: this.getAttribute('data-product-id'),
            user_image_url: this.state.userImage,
            type: mode,
            visitor_id: this.visitorId,
            page_url: window.location.href
          })
        });
        const data = await res.json();
        
        if (data.success) {
          this.state.resultImage = data.result_url;
          this.state.step = 'result';
          this.saveToHistory('generation', data.result_url);
        } else {
          alert('Ошибка: ' + data.error);
          this.state.step = 'upload';
        }
      } catch (e) {
        alert('Произошла ошибка при генерации');
      }
      
      this.state.loading = false;
      this.render();
    }

    async trackEvent(eventType) {
      try {
        const shopId = this.getAttribute('data-shop-id');
        await fetch(`${API_BASE}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop_id: shopId,
            event_type: eventType,
            visitor_id: this.visitorId,
            page_url: window.location.href
          })
        });
      } catch (e) {}
    }

    render() {
      const { primary_color, button_text } = this.state.settings || {};
      const hasExternalButton = !!this.getAttribute('data-button-selector');
      
      const shirtIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a3 3 0 0 0 6 0" /></svg>`;
      const spritePath = `${API_BASE.replace('/api/widget', '')}/widget-sprites.svg`;

      this.shadowRoot.innerHTML = `
        <style>
          :host { --primary: ${primary_color || '#000'}; --bg: #fff; --zinc-100: #f4f4f5; --zinc-400: #a1a1aa; --zinc-500: #71717a; }
          * { box-sizing: border-box; }
          
          .tv-floating-btn {
            display: ${hasExternalButton ? 'none' : 'flex'};
            position: fixed; bottom: 24px; right: 24px;
            background: var(--primary); color: white;
            height: 56px; min-width: 56px;
            border-radius: 28px;
            cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            padding: 0 16px;
          }
          .tv-floating-btn .tv-btn-text {
            max-width: 0; opacity: 0; white-space: nowrap; transition: all 0.3s ease; font-size: 14px; margin-left: 0;
          }
          .tv-floating-btn:hover { padding: 0 24px; }
          .tv-floating-btn:hover .tv-btn-text { max-width: 200px; opacity: 1; margin-left: 12px; }

          .tv-modal {
            display: ${this.state.isOpen ? 'flex' : 'none'};
            position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
            align-items: center; justify-content: center; z-index: 10000;
            font-family: 'Inter', -apple-system, sans-serif;
          }
          .tv-content {
            background: white; border-radius: 32px; width: 400px; max-height: 90vh;
            display: flex; flex-direction: column; overflow: hidden; position: relative;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          }
          .tv-header {
            padding: 24px 32px; display: flex; justify-content: space-between; align-items: center;
          }
          .tv-logo { height: 18px; color: #000; }
          .tv-logo svg { height: 100%; width: auto; }
          .tv-close { cursor: pointer; color: #000; transition: opacity 0.2s; }
          .tv-close:hover { opacity: 0.6; }

          .tv-body { padding: 0 32px 32px; overflow-y: auto; flex: 1; text-align: center; }
          .tv-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #000; }
          .tv-subtitle { font-size: 13px; color: var(--zinc-500); margin-bottom: 24px; line-height: 1.5; }
          
          .tv-guide { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
          .tv-guide-item { position: relative; border-radius: 16px; overflow: hidden; aspect-ratio: 3/4; background: var(--zinc-100); }
          .tv-guide-item img { width: 100%; height: 100%; object-fit: cover; }
          .tv-badge { position: absolute; bottom: 12px; left: 12px; width: 24px; height: 24px; }
          .tv-badge svg { width: 100%; height: 100%; }

          .tv-main-btn { 
            background: #000; color: #fff; width: 100%; padding: 18px; border: none; 
            border-radius: 16px; font-weight: 700; font-size: 14px; cursor: pointer; 
            transition: transform 0.1s, background 0.2s; 
          }
          .tv-main-btn:hover { background: #222; }
          .tv-main-btn:active { transform: scale(0.98); }
          
          .tv-secondary-btn { 
            background: #fff; color: #000; border: 1px solid var(--zinc-200); width: 100%; 
            padding: 14px; border-radius: 16px; font-weight: 700; font-size: 14px; cursor: pointer; 
          }

          .tv-progress-container { margin: 40px 0; }
          .tv-progress-bar { background: var(--zinc-100); height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
          .tv-progress-fill { background: #000; height: 100%; width: 35%; transition: width 0.3s ease; }
          .tv-progress-text { font-size: 12px; font-weight: 700; color: #000; }

          .tv-error-box { color: #EF4444; margin-bottom: 24px; }
          .tv-error-icon { width: 32px; height: 32px; margin: 0 auto 16px; }

          .tv-user-photo-preview { 
            width: 100%; aspect-ratio: 3/4; border-radius: 20px; object-fit: cover; 
            margin-bottom: 24px; background: var(--zinc-100);
          }
          
          .tv-history-section { margin-top: 32px; text-align: left; }
          .tv-history-title { font-size: 14px; font-weight: 700; margin-bottom: 16px; }
          .tv-history-list { display: flex; gap: 12px; align-items: center; }
          .tv-history-item { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid transparent; }
          .tv-history-item.active { border-color: #000; }
          .tv-add-photo { 
            width: 56px; height: 56px; border-radius: 50%; border: 1px solid var(--zinc-200); 
            display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--zinc-400);
          }

          .tv-footer { font-size: 10px; color: var(--zinc-400); margin-top: 32px; }
        </style>

        <div class="tv-floating-btn" id="open-btn">
          ${shirtIcon}
          <span class="tv-btn-text">${button_text || 'Примерить онлайн'}</span>
        </div>

        <div class="tv-modal" id="modal">
          <div class="tv-content">
            <div class="tv-header">
              <div class="tv-logo">
                <svg><use href="${spritePath}#tv-logo"></use></svg>
              </div>
              <div class="tv-close" id="close-btn">
                <svg width="24" height="24"><use href="${spritePath}#tv-close"></use></svg>
              </div>
            </div>
            <div class="tv-body">
              ${this.renderStep()}
              <div class="tv-footer">Powered by TryVice</div>
            </div>
          </div>
        </div>
      `;

      this.shadowRoot.getElementById('open-btn')?.addEventListener('click', () => this.toggleModal(true));
      this.shadowRoot.getElementById('close-btn')?.addEventListener('click', () => this.toggleModal(false));
      this.setupEventListeners();
    }
          .tv-floating-btn .tv-btn-text {
            max-width: 0;
            opacity: 0;
            white-space: nowrap;
            transition: all 0.3s ease;
            font-size: 14px;
            margin-left: 0;
          }
          .tv-floating-btn:hover {
            padding: 0 24px;
          }
          .tv-floating-btn:hover .tv-btn-text {
            max-width: 200px;
            opacity: 1;
            margin-left: 12px;
          }
          .tv-floating-btn svg {
            flex-shrink: 0;
          }
          .tv-modal {
            display: ${this.state.isOpen ? 'flex' : 'none'};
            position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
            align-items: center; justify-content: center; z-index: 10000;
            font-family: 'Inter', sans-serif;
          }
          .tv-content {
            background: white; border-radius: 24px; width: 380px; max-height: 90vh;
            display: flex; flex-direction: column; overflow: hidden; position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          }
          .tv-header {
            padding: 20px; display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #f0f0f0;
          }
          .tv-logo { display: flex; align-items: center; color: #000; }
          .tv-close { cursor: pointer; padding: 5px; }
          .tv-body { padding: 24px; overflow-y: auto; flex: 1; }
          .tv-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; text-align: left; }
          .tv-subtitle { font-size: 13px; color: #666; margin-bottom: 20px; text-align: left; line-height: 1.4; }
          .guide-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
          .guide-item { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 3/4; background: #f5f5f5; }
          .guide-item img { width: 100%; height: 100%; object-fit: cover; }
          .badge { position: absolute; bottom: 8px; left: 8px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
          .badge.ok { background: #4CAF50; color: white; }
          .badge.no { background: #FF5252; color: white; }
          .tv-main-btn { background: #000; color: #fff; width: 100%; padding: 16px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 12px; }
          .tv-secondary-btn { background: #fff; color: #000; border: 1px solid #e0e0e0; width: 100%; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; }
          .history-section { margin-top: 24px; text-align: left; }
          .history-list { display: flex; gap: 12px; margin-top: 12px; }
          .history-circle { width: 48px; height: 48px; border-radius: 50%; border: 2px solid #eee; cursor: pointer; object-fit: cover; }
          .powered-by { font-size: 10px; color: #ccc; margin-top: 20px; text-align: center; }
          .loader { border: 3px solid #f3f3f3; border-top: 3px solid #000; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>

        <div class="tv-floating-btn" id="open-btn">
          ${shirtIcon}
          <span class="tv-btn-text">${button_text || 'Примерить онлайн'}</span>
        </div>

        <div class="tv-modal" id="modal">
          <div class="tv-content">
            <div class="tv-header">
              <div class="tv-logo">${logoSvg}</div>
              <div class="tv-close" id="close-btn">
                <svg width="20" height="20" viewBox="0 0 20 20"><path d="M15 5L5 15M5 5L15 15" stroke="black" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
            </div>
            <div class="tv-body">
              ${this.renderStep()}
              <div class="powered-by">Powered by Tryvice</div>
            </div>
          </div>
        </div>
      `;

      this.shadowRoot.getElementById('open-btn')?.addEventListener('click', () => this.toggleModal(true));
      this.shadowRoot.getElementById('close-btn')?.addEventListener('click', () => this.toggleModal(false));
      this.setupEventListeners();
    }

    renderStep() {
      const baseUrl = API_BASE.replace('/api/widget', '');
      const spritePath = `${baseUrl}/widget-sprites.svg`;

      if (this.state.loading && this.state.step === 'upload') {
        return `
          <div class="tv-progress-container">
            <div class="tv-title">Анализируем фото</div>
            <div class="tv-progress-bar">
              <div class="tv-progress-fill" style="width: 35%"></div>
            </div>
            <div class="tv-progress-text">35%</div>
          </div>
        `;
      }

      if (this.state.loading && this.state.step === 'mode-select') {
        return `
          <div class="tv-progress-container">
            <div class="tv-title">Собираем ваш образ</div>
            <div class="tv-progress-bar">
              <div class="tv-progress-fill" style="width: 65%"></div>
            </div>
            <div class="tv-progress-text">65%</div>
          </div>
        `;
      }

      if (this.state.error) {
        return `
          <div class="tv-error-box">
            <div class="tv-error-icon">
              <svg width="32" height="32"><use href="${spritePath}#tv-error"></use></svg>
            </div>
            <div class="tv-title" style="color:#EF4444">Фото не подходит</div>
            <div class="tv-subtitle" style="color:#EF4444">${this.state.error}</div>
          </div>
          <button class="tv-main-btn" id="clear-error">Заменить фото</button>
        `;
      }

      switch(this.state.step) {
        case 'upload':
          return `
            <div class="tv-title">Загрузите ваше фото</div>
            <div class="tv-subtitle">Выберите снимок в полный рост лицом к камере, где хорошо видна фигура и одежда не оверсайз</div>
            <div class="tv-guide">
              <div class="tv-guide-item">
                <img src="${baseUrl}/guide-ok.webp" alt="OK">
                <div class="tv-badge"><svg><use href="${spritePath}#tv-success"></use></svg></div>
              </div>
              <div class="tv-guide-item">
                <img src="${baseUrl}/guide-no.webp" alt="NO">
                <div class="tv-badge"><svg><use href="${spritePath}#tv-error"></use></svg></div>
              </div>
            </div>
            <input type="file" id="file-input" accept="image/*" style="display:none">
            <button class="tv-main-btn" id="upload-trigger">Загрузить фото</button>
            <div style="font-size: 10px; color: var(--zinc-400); margin-top: 16px; line-height: 1.4">
              Нажимая на кнопку «Загрузить фото», вы соглашаетесь с Политикой конфиденциальности и даете Согласие на обработку данных
            </div>
          `;
        case 'mode-select':
          return `
            <div class="tv-title">Загруженное фото</div>
            <img src="${this.state.userImage}" class="tv-user-photo-preview">
            
            <div class="tv-history-section">
              <div class="tv-history-title">Загруженные ранее</div>
              <div class="tv-history-list">
                ${this.state.savedPhotos.map(url => `<img src="${url}" class="tv-history-item ${url === this.state.userImage ? 'active' : ''}" data-history-url="${url}">`).join('')}
                <div class="tv-add-photo" id="add-photo-btn">
                  <svg width="20" height="20"><use href="${spritePath}#tv-plus"></use></svg>
                </div>
              </div>
            </div>

            <div style="margin-top: 32px">
              <div class="tv-title" style="font-size: 14px; margin-bottom: 16px">Выберите, что хотите примерить</div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
                <button class="tv-secondary-btn" data-mode="outfit">Полный образ</button>
                <button class="tv-secondary-btn" data-mode="single">Платье</button>
              </div>
              <button class="tv-main-btn" style="margin-top:24px" id="start-tryon">Продолжить</button>
            </div>
          `;
        case 'result':
          return `
            <div class="tv-title">Ваш образ готов</div>
            <div style="position:relative; margin-bottom:24px">
              <img src="${this.state.resultImage}" style="width:100%; border-radius:20px; aspect-ratio:3/4; object-fit:cover">
              <div style="position:absolute; top:16px; right:16px; width:32px; height:32px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer">
                <svg width="20" height="20"><use href="${spritePath}#tv-zoom"></use></svg>
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
              <button class="tv-secondary-btn" id="new-try">Новый образ</button>
              <button class="tv-main-btn" id="more-actions">Ещё</button>
            </div>
          `;
      }
    }

    renderHistory() {
      if (!this.state.savedPhotos?.length) return '';
      return `
        <div class="history-section">
          <div class="tv-title" style="font-size:14px">Загруженные ранее</div>
          <div class="history-list">
            ${this.state.savedPhotos.map(url => `<img src="${url}" class="history-circle" data-history-url="${url}">`).join('')}
          </div>
        </div>
      `;
    }

    setupEventListeners() {
      this.shadowRoot.getElementById('upload-trigger')?.addEventListener('click', () => {
        this.shadowRoot.getElementById('file-input').click();
      });

      this.shadowRoot.getElementById('add-photo-btn')?.addEventListener('click', () => {
        this.state.step = 'upload';
        this.render();
      });

      this.shadowRoot.getElementById('file-input')?.addEventListener('change', (e) => this.handleFileUpload(e));

      this.shadowRoot.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.shadowRoot.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.selectedMode = btn.dataset.mode;
        });
      });

      this.shadowRoot.getElementById('start-tryon')?.addEventListener('click', () => {
        if (this.state.selectedMode) {
          this.handleTryOn(this.state.selectedMode);
        } else {
          alert('Пожалуйста, выберите режим примерки');
        }
      });

      this.shadowRoot.getElementById('new-try')?.addEventListener('click', () => {
        this.state.step = 'upload';
        this.render();
      });

      this.shadowRoot.getElementById('back-to-upload')?.addEventListener('click', () => {
        this.state.step = 'upload';
        this.state.error = null;
        this.render();
      });

      this.shadowRoot.getElementById('clear-error')?.addEventListener('click', () => {
        this.state.error = null;
        this.state.step = 'upload';
        this.render();
      });

      this.shadowRoot.querySelectorAll('[data-history-url]').forEach(img => {
        img.addEventListener('click', () => {
          this.state.userImage = img.dataset.historyUrl;
          this.state.step = 'mode-select';
          this.render();
        });
      });
    }
  }

  customElements.define('tryvice-widget', TryViceWidget);

  const script = document.currentScript;
  const widget = document.createElement('tryvice-widget');
  widget.setAttribute('data-shop-id', script.getAttribute('data-shop-id'));
  widget.setAttribute('data-product-id', script.getAttribute('data-product-id'));
  document.body.appendChild(widget);
})();
