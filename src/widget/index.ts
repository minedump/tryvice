import { getStyles } from './styles';
import { ICONS, SHIRT_ICON } from './templates';

(function() {
  const scriptSrc = document.currentScript ? (document.currentScript as HTMLScriptElement).src : '';
  const API_BASE = (scriptSrc ? new URL(scriptSrc).origin : '') + '/api/widget';

  class TryViceWidget extends HTMLElement {
    visitorId: string;
    state: any;

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
        savedPhotos: [],
        selectedMode: 'outfit',
        error: null
      };
    }

    getOrCreateVisitorId() {
      let id = localStorage.getItem('tv_visitor_id');
      if (!id) {
        id = (1e7 + '-' + 1e3 + '-' + 4e3 + '-' + 8e3 + '-' + 1e11).replace(/[018]/g, (c: any) =>
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_id: shopId, domain: window.location.hostname })
        });
        const data = await res.json();

        if (data.active) {
          this.state.settings = data.settings;
          const urlMask = data.settings.url_mask;
          if (urlMask && !window.location.pathname.includes(urlMask)) return;

          this.loadHistory();
          this.render();
          this.setupExternalButtons(buttonSelector);
          this.trackEvent('widget_view');
        }
      } catch (e) {
        console.error('TryVice Init Error:', e);
      }
    }

    setupExternalButtons(selector: string | null) {
      if (!selector) return;
      document.querySelectorAll(selector).forEach(btn => {
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

    saveToHistory(type: string, item: string) {
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

    toggleModal(show: boolean) {
      this.state.isOpen = show;
      if (show) this.trackEvent('widget_open');
      this.render();
    }

    async handleFileUpload(e: any) {
      const file = e.target.files[0];
      if (!file) return;

      this.state.loading = true;
      this.render();

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch(`${API_BASE}/analyze-image`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image_url: reader.result, 
              shop_id: this.getAttribute('data-shop-id'),
              visitor_id: this.visitorId
            })
          });
          const analysis = await res.json();

          if (analysis.suitable) {
            this.state.userImage = analysis.image_url;
            this.state.step = 'mode-select';
            this.saveToHistory('photo', analysis.image_url);
          } else {
            this.state.error = analysis.reason || 'Это фото не подходит.';
          }
        } catch (err) {
          this.state.error = 'Ошибка при анализе фото.';
        }
        this.state.loading = false;
        this.render();
      };
      reader.readAsDataURL(file);
    }

    async handleTryOn(mode: string) {
      this.state.loading = true;
      this.render();

      try {
        const res = await fetch(`${API_BASE}/tryon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

    async trackEvent(eventType: string) {
      try {
        await fetch(`${API_BASE}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop_id: this.getAttribute('data-shop-id'),
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

      this.shadowRoot!.innerHTML = `
        <style>${getStyles(primary_color)}</style>
        ${ICONS}
        <div class="tv-floating-btn" id="open-btn" style="display: ${hasExternalButton ? 'none' : 'flex'}">
          ${SHIRT_ICON}
          <span class="tv-btn-text">${button_text || 'Примерить онлайн'}</span>
        </div>

        <div class="tv-modal" id="modal" style="display: ${this.state.isOpen ? 'flex' : 'none'}">
          <div class="tv-content">
            <div class="tv-header">
              <div class="tv-logo">
                <svg><use href="#tv-logo"></use></svg>
              </div>
              <div class="tv-close" id="close-btn">
                <svg width="24" height="24"><use href="#tv-close"></use></svg>
              </div>
            </div>
            <div class="tv-body">
              ${this.renderStep()}
              <div class="tv-footer">Powered by TryVice</div>
            </div>
          </div>
        </div>
      `;

      this.shadowRoot!.getElementById('open-btn')?.addEventListener('click', () => this.toggleModal(true));
      this.shadowRoot!.getElementById('close-btn')?.addEventListener('click', () => this.toggleModal(false));
      this.setupEventListeners();
    }

    renderStep() {
      const baseUrl = API_BASE.replace('/api/widget', '');

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
              <svg width="32" height="32"><use href="#tv-error"></use></svg>
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
                <div class="tv-badge"><svg><use href="#tv-success"></use></svg></div>
              </div>
              <div class="tv-guide-item">
                <img src="${baseUrl}/guide-no.webp" alt="NO">
                <div class="tv-badge"><svg><use href="#tv-error"></use></svg></div>
              </div>
            </div>
            <input type="file" id="file-input" accept="image/*" style="display:none">
            <button class="tv-main-btn" id="upload-trigger">Загрузить фото</button>
            <div class="tv-consent">
              ${this.state.settings?.consent_html || 'Нажимая на кнопку «Загрузить фото», вы соглашаетесь с <a href="#">Политикой конфиденциальности</a> и даете <a href="#">Согласие на обработку данных</a>'}
            </div>
          `;
        case 'mode-select':
          return `
            <div class="tv-title">Загруженное фото</div>
            <img src="${this.state.userImage}" class="tv-user-photo-preview">
            
            <div class="tv-history-section">
              <div class="tv-history-title">Загруженные ранее</div>
              <div class="tv-history-list">
                ${this.state.savedPhotos.map((url: string) => `
                  <div class="tv-history-item-wrapper">
                    <img src="${url}" class="tv-history-item ${url === this.state.userImage ? 'active' : ''}" data-history-url="${url}">
                    <div class="tv-delete-photo" data-delete-url="${url}">
                      <svg width="12" height="12"><use href="#tv-trash"></use></svg>
                    </div>
                  </div>
                `).join('')}
                <div class="tv-add-photo" id="add-photo-btn">
                  <svg width="20" height="20"><use href="#tv-plus"></use></svg>
                </div>
              </div>
            </div>

            <div style="margin-top: 32px">
              <div class="tv-title" style="font-size: 14px; margin-bottom: 16px">Выберите, что хотите примерить</div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
                <button class="tv-secondary-btn ${this.state.selectedMode === 'outfit' ? 'active' : ''}" data-mode="outfit">Полный образ</button>
                <button class="tv-secondary-btn ${this.state.selectedMode === 'single' ? 'active' : ''}" data-mode="single">Вещь</button>
              </div>
              <button class="tv-main-btn" style="margin-top:24px" id="start-tryon">Продолжить</button>
            </div>
          `;
        case 'result':
          return `
            <div class="tv-title">Ваш образ готов</div>
            <div style="position:relative; margin-bottom:24px">
              <img src="${this.state.resultImage}" style="width:100%; border-radius:20px; aspect-ratio:3/4; object-fit:cover">
              <div style="position:absolute; top:16px; right:16px; width:32px; height:32px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer" id="zoom-result">
                <svg width="20" height="20"><use href="#tv-zoom"></use></svg>
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
              <button class="tv-secondary-btn" id="new-try">Новый образ</button>
              <button class="tv-main-btn" id="more-actions-btn">Ещё</button>
            </div>

            <div class="tv-actions-menu" id="actions-menu">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
                <div class="tv-title" style="margin-bottom:0">Действия</div>
                <div style="font-size:12px; font-weight:700; cursor:pointer" id="close-actions">Закрыть</div>
              </div>
              <div class="tv-action-item" id="download-action">
                <svg width="20" height="20"><use href="#tv-download"></use></svg>
                Скачать образ
              </div>
              <div class="tv-action-item" id="copy-action">
                <svg width="20" height="20"><use href="#tv-copy"></use></svg>
                Скопировать ссылку
              </div>
            </div>

            <div class="tv-toast" id="tv-toast">
              <svg width="16" height="16"><use href="#tv-success"></use></svg>
              <span id="toast-text">Ссылка скопирована!</span>
            </div>
          `;
        default:
          return '';
      }
    }

    setupEventListeners() {
      this.shadowRoot!.getElementById('upload-trigger')?.addEventListener('click', () => {
        (this.shadowRoot!.getElementById('file-input') as HTMLInputElement).click();
      });

      this.shadowRoot!.getElementById('add-photo-btn')?.addEventListener('click', () => {
        this.state.step = 'upload';
        this.render();
      });

      this.shadowRoot!.getElementById('file-input')?.addEventListener('change', (e) => this.handleFileUpload(e));

      this.shadowRoot!.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.state.selectedMode = (btn as HTMLElement).dataset.mode;
          this.render();
        });
      });

      this.shadowRoot!.getElementById('start-tryon')?.addEventListener('click', () => {
        this.handleTryOn(this.state.selectedMode);
      });

      this.shadowRoot!.getElementById('more-actions-btn')?.addEventListener('click', () => {
        this.shadowRoot!.getElementById('actions-menu')?.classList.add('open');
      });

      this.shadowRoot!.getElementById('close-actions')?.addEventListener('click', () => {
        this.shadowRoot!.getElementById('actions-menu')?.classList.remove('open');
      });

      this.shadowRoot!.getElementById('copy-action')?.addEventListener('click', () => {
        navigator.clipboard.writeText(this.state.resultImage);
        this.showToast('Ссылка скопирована!');
        this.shadowRoot!.getElementById('actions-menu')?.classList.remove('open');
      });

      this.shadowRoot!.getElementById('download-action')?.addEventListener('click', async () => {
        const a = document.createElement('a');
        a.href = this.state.resultImage;
        a.download = 'tryvice-look.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showToast('Успешное скачивание');
        this.shadowRoot!.getElementById('actions-menu')?.classList.remove('open');
      });

      this.shadowRoot!.getElementById('zoom-result')?.addEventListener('click', () => {
        window.open(this.state.resultImage, '_blank');
      });

      this.shadowRoot!.getElementById('new-try')?.addEventListener('click', () => {
        this.state.step = 'upload';
        this.render();
      });

      this.shadowRoot!.getElementById('clear-error')?.addEventListener('click', () => {
        this.state.error = null;
        this.state.step = 'upload';
        this.render();
      });

      this.shadowRoot!.querySelectorAll('.tv-history-item').forEach(img => {
        img.addEventListener('click', () => {
          this.state.userImage = (img as HTMLElement).dataset.historyUrl;
          this.render();
        });
      });

      this.shadowRoot!.querySelectorAll('.tv-delete-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const url = (btn as HTMLElement).dataset.deleteUrl;
          const history = JSON.parse(localStorage.getItem('tv_history') || '{"generations":[], "photos":[]}');
          history.photos = history.photos.filter((p: string) => p !== url);
          localStorage.setItem('tv_history', JSON.stringify(history));
          this.loadHistory();
          if (this.state.userImage === url) this.state.userImage = this.state.savedPhotos[0] || null;
          this.render();
        });
      });
    }

    showToast(text: string) {
      const toast = this.shadowRoot!.getElementById('tv-toast');
      const toastText = this.shadowRoot!.getElementById('toast-text');
      if (!toast || !toastText) return;
      toastText.innerText = text;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  }

  if (!customElements.get('tryvice-widget')) {
    customElements.define('tryvice-widget', TryViceWidget);
  }

  const script = document.currentScript as HTMLScriptElement;
  if (script) {
    const widget = document.createElement('tryvice-widget');
    widget.setAttribute('data-shop-id', script.getAttribute('data-shop-id') || '');
    widget.setAttribute('data-product-id', script.getAttribute('data-product-id') || '');
    document.body.appendChild(widget);
  }
})();
