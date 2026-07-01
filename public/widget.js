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
        id = 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
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
      
      this.shadowRoot.innerHTML = `
        <style>
          :host { --primary: ${primary_color || '#000'}; --bg: #fff; }
          .tv-floating-btn {
            display: ${hasExternalButton ? 'none' : 'block'};
            position: fixed; bottom: 20px; right: 20px;
            background: var(--primary); color: white;
            padding: 12px 24px; border-radius: 30px;
            cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999;
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
          .tv-logo { font-weight: 800; font-size: 20px; color: #000; }
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

        <div class="tv-floating-btn" id="open-btn">${button_text || 'Примерить'}</div>

        <div class="tv-modal" id="modal">
          <div class="tv-content">
            <div class="tv-header">
              <div class="tv-logo">Tryvice</div>
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
      if (this.state.loading) return `<div class="loader"></div><p style="text-align:center; font-size:12px; color:#999">Обработка...</p>`;

      if (this.state.error) {
        return `
          <div class="tv-title" style="color:#FF5252">Внимание</div>
          <div class="tv-subtitle">${this.state.error}</div>
          <button class="tv-main-btn" id="clear-error">Попробовать снова</button>
        `;
      }

      switch(this.state.step) {
        case 'upload':
          return `
            <div class="tv-title">Загрузите ваше фото</div>
            <div class="tv-subtitle">Выберите снимок в полный рост лицом к камере</div>
            <div class="guide-grid">
              <div class="guide-item"><img src="https://via.placeholder.com/150x200?text=OK"><div class="badge ok">✓</div></div>
              <div class="guide-item"><img src="https://via.placeholder.com/150x200?text=NO"><div class="badge no">✕</div></div>
            </div>
            <input type="file" id="file-input" accept="image/*" style="display:none">
            <button class="tv-main-btn" id="upload-trigger">Загрузить фото</button>
            <div style="font-size: 10px; color: #999; margin-top: 12px; line-height: 1.2">
              ${this.state.settings?.consent_html || ''}
            </div>
            ${this.renderHistory()}
          `;
        case 'mode-select':
          return `
            <div class="tv-title">Выберите режим</div>
            <div style="display:flex; flex-direction:column; gap:8px">
              <button class="tv-secondary-btn" data-mode="single">Одна вещь</button>
              <button class="tv-secondary-btn" data-mode="outfit">Полный образ</button>
            </div>
            <button class="tv-main-btn" style="margin-top:20px" id="back-to-upload">Назад</button>
          `;
        case 'result':
          return `
            <div class="tv-title">Ваша примерка</div>
            <img src="${this.state.resultImage}" style="width:100%; border-radius:12px; margin-bottom:16px">
            <button class="tv-main-btn" onclick="window.open('${this.state.resultImage}', '_blank')">Скачать результат</button>
            <button class="tv-secondary-btn" style="margin-top:8px" id="new-try">Новая примерка</button>
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

      this.shadowRoot.getElementById('file-input')?.addEventListener('change', (e) => this.handleFileUpload(e));

      this.shadowRoot.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => this.handleTryOn(btn.dataset.mode));
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
