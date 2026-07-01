"use strict";(()=>{var l=n=>`
  :host { 
    --primary: ${n||"#000"}; 
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
`;var c=`
  <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
    <symbol id="tv-logo" viewBox="0 0 140 18">
      <path d="M119.346 10.3887C118.696 14.3496 115.192 17.4199 108.33 17.4199C101.129 17.4199 97.3381 13.6289 97.3381 8.70704C97.3381 3.7832 101.129 0 108.33 0C115.192 0 118.672 3.07031 119.346 7.03126L115.074 7.03126C114.641 5.2793 112.672 3.4746 108.33 3.4746C103.912 3.4746 101.61 5.7832 101.61 8.70704C101.61 11.6367 103.912 13.9395 108.33 13.9395C112.672 13.9395 114.641 12.1406 115.074 10.3887L119.346 10.3887ZM12.1855 3.86132L12.1855 17.1094L7.91406 17.1094L7.91406 3.86132L1 3.86132L1 0.31054L19.0996 0.31054L19.0996 3.86132L12.1855 3.86132ZM38.5159 13.6523C37.5784 11.6367 36.6643 11.0391 34.9358 10.9629L34.9358 10.5586C37.3616 10.3652 39.2542 8.32618 39.2542 5.58984C39.2542 2.54296 37.0276 0.31054 32.4163 0.31054L21.3069 0.31054L21.3069 17.1094L25.5784 17.1094L25.5784 11.2793L30.3772 11.2793C32.0061 11.2793 32.7034 11.6367 33.2073 12.791L35.0354 17.1094L40.1213 17.1094L38.5159 13.6523ZM80.1069 0.31054L72.3315 17.1094L67.1226 17.1094L59.4934 0.62634L51.9543 11.8066L51.9543 17.1094L47.6829 17.1094L47.6829 11.8066L39.9309 0.31054L44.8235 0.31054L48.6438 6.11718C49.3586 7.29492 49.6223 8.15626 49.6223 8.94726L49.6223 9.2871L50.0325 9.2871L50.0325 8.94726C50.0325 8.15626 50.2727 7.29492 51.0168 6.11718L54.8313 0.31054L64.146 0.31054L68.7046 11.0391C69.3784 12.7676 69.5425 13.4883 69.5425 14.4961L69.5425 14.5664L69.9292 14.5664L69.9292 14.4961C69.9292 13.4883 70.0991 12.7676 70.7671 11.0391L75.3315 0.31054L80.1069 0.31054ZM95.7312 13.6758L95.7312 17.1094L80.9421 17.1094L80.9421 13.6758L86.198 13.6758L86.198 3.74414L80.9421 3.74414L80.9421 0.31054L95.7312 0.31054L95.7312 3.74414L90.4753 3.74414L90.4753 13.6758L95.7312 13.6758ZM122.227 0.31054L138.903 0.31054L138.903 3.66796L126.498 3.66796L126.498 7.07812L137.227 7.07812L137.227 10.0781L126.498 10.0781L126.498 13.752L138.903 13.752L138.903 17.1094L122.227 17.1094L122.227 0.31054ZM25.3616 8.58984L25.3616 3.66796L32.0061 3.66796C33.9983 3.66796 34.9827 4.65234 34.9827 6.11718C34.9827 7.58204 33.9983 8.58984 32.0061 8.58984L25.3616 8.58984Z" fill="currentColor" fill-rule="evenodd" />
    </symbol>
    <symbol id="tv-success" viewBox="0 0 20 20">
      <rect width="20" height="20" rx="10" fill="#22C55E" />
      <path d="M5.8335 10L8.80969 12.9762L14.7621 7.0238" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
    </symbol>
    <symbol id="tv-error" viewBox="0 0 28 28">
      <rect width="28" height="28" rx="8" fill="#EF4444" />
      <path d="M19 9L9 19M9 9L19 19" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
    </symbol>
    <symbol id="tv-plus" viewBox="0 0 24 24">
      <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
    </symbol>
    <symbol id="tv-close" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
    </symbol>
    <symbol id="tv-zoom" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none" />
      <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <path d="M11 8V14M8 11H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </symbol>
    <symbol id="tv-download" viewBox="0 0 20 20">
      <path d="M3.33325 14.1666L3.33325 15.8333C3.33325 16.2753 3.50885 16.6992 3.82141 17.0118C4.13397 17.3244 4.55789 17.5 4.99992 17.5L14.9999 17.5C15.4419 17.5 15.8659 17.3244 16.1784 17.0118C16.491 16.6992 16.6666 16.2753 16.6666 15.8333L16.6666 14.1666" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
      <path d="M5.83325 9.16669L9.99992 13.3334L14.1666 9.16669" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
      <path d="M10 3.33331V13.3333" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
    </symbol>
    <symbol id="tv-copy" viewBox="0 0 20 20">
      <path d="M7.5 12.5L12.5 7.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
      <path d="M9.16675 4.99993L9.55258 4.55326C10.3341 3.77187 11.394 3.33293 12.4991 3.33301C13.6043 3.33309 14.6641 3.77217 15.4455 4.55368C16.2269 5.33518 16.6658 6.39509 16.6658 7.50022C16.6657 8.60536 16.2266 9.6652 15.4451 10.4466L15.0001 10.8333" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
      <path d="M10.8334 15L10.5025 15.445C9.71191 16.2268 8.64486 16.6653 7.53295 16.6653C6.42105 16.6653 5.354 16.2268 4.56337 15.445C4.17367 15.0596 3.86428 14.6008 3.65313 14.0951C3.44198 13.5893 3.33325 13.0468 3.33325 12.4987C3.33325 11.9507 3.44198 11.4081 3.65313 10.9023C3.86428 10.3966 4.17367 9.93779 4.56337 9.55246L5.00004 9.16663" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
    </symbol>
    <symbol id="tv-trash" viewBox="0 0 20 20">
      <path d="M3.33337 5.83337L16.6667 5.83337" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
      <path d="M8.33337 9.16669V14.1667" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
      <path d="M11.6666 9.16669V14.1667" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
      <path d="M4.16663 5.83337L4.99996 15.8334C4.99996 16.2754 5.17555 16.6993 5.48811 17.0119C5.80068 17.3244 6.2246 17.5 6.66663 17.5L13.3333 17.5C13.7753 17.5 14.1992 17.3244 14.5118 17.0119C14.8244 16.6993 14.9999 16.2754 14.9999 15.8334L15.8333 5.83337" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
      <path d="M7.5 5.83333L7.5 3.33333C7.5 3.11232 7.5878 2.90036 7.74408 2.74408C7.90036 2.5878 8.11232 2.5 8.33333 2.5L11.6667 2.5C11.8877 2.5 12.0996 2.5878 12.2559 2.74408C12.4122 2.90036 12.5 3.11232 12.5 3.33333L12.5 5.83333" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
    </symbol>
  </svg>
`,h='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a2 2 0 0 1 4 0" /></svg>';(function(){let n=document.currentScript?document.currentScript.src:"",r=(n?new URL(n).origin:"")+"/api/widget";class p extends HTMLElement{visitorId;state;constructor(){super(),this.attachShadow({mode:"open"}),this.visitorId=this.getOrCreateVisitorId(),this.state={isOpen:!1,step:"upload",userImage:null,resultImage:null,loading:!1,settings:null,history:[],savedPhotos:[],selectedMode:"outfit",error:null}}getOrCreateVisitorId(){let t=localStorage.getItem("tv_visitor_id");return t||(t=("10000000-1000-4000-8000-"+1e11).replace(/[018]/g,e=>(e^crypto.getRandomValues(new Uint8Array(1))[0]&15>>e/4).toString(16)),localStorage.setItem("tv_visitor_id",t)),t}async connectedCallback(){let t=this.getAttribute("data-shop-id"),e=this.getAttribute("data-button-selector");try{let i=await(await fetch(`${r}/init`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({shop_id:t,domain:window.location.hostname})})).json();if(i.active){this.state.settings=i.settings;let s=i.settings.url_mask;if(s&&!window.location.pathname.includes(s))return;this.loadHistory(),this.render(),this.setupExternalButtons(e),this.trackEvent("widget_view")}}catch(o){console.error("TryVice Init Error:",o)}}setupExternalButtons(t){t&&document.querySelectorAll(t).forEach(e=>{e.addEventListener("click",o=>{o.preventDefault(),this.toggleModal(!0)})})}loadHistory(){let t=localStorage.getItem("tv_history");if(t){let e=JSON.parse(t);this.state.history=e.generations||[],this.state.savedPhotos=e.photos||[]}}saveToHistory(t,e){let o=JSON.parse(localStorage.getItem("tv_history")||'{"generations":[], "photos":[]}');t==="photo"?(o.photos.includes(e)||o.photos.unshift(e),o.photos=o.photos.slice(0,5)):o.generations.unshift(e),localStorage.setItem("tv_history",JSON.stringify(o)),this.loadHistory()}toggleModal(t){this.state.isOpen=t,t&&this.trackEvent("widget_open"),this.render()}async handleFileUpload(t){let e=t.target.files[0];if(!e)return;this.state.loading=!0,this.render();let o=new FileReader;o.onloadend=async()=>{try{let s=await(await fetch(`${r}/analyze-image`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image_url:o.result,shop_id:this.getAttribute("data-shop-id"),visitor_id:this.visitorId})})).json();s.suitable?(this.state.userImage=s.image_url,this.state.step="mode-select",this.saveToHistory("photo",s.image_url)):this.state.error=s.reason||"\u042D\u0442\u043E \u0444\u043E\u0442\u043E \u043D\u0435 \u043F\u043E\u0434\u0445\u043E\u0434\u0438\u0442."}catch{this.state.error="\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0430\u043D\u0430\u043B\u0438\u0437\u0435 \u0444\u043E\u0442\u043E."}this.state.loading=!1,this.render()},o.readAsDataURL(e)}async handleTryOn(t){this.state.loading=!0,this.render();try{let o=await(await fetch(`${r}/tryon`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({shop_id:this.getAttribute("data-shop-id"),product_id:this.getAttribute("data-product-id"),user_image_url:this.state.userImage,type:t,visitor_id:this.visitorId,page_url:window.location.href})})).json();o.success?(this.state.resultImage=o.result_url,this.state.step="result",this.saveToHistory("generation",o.result_url)):(alert("\u041E\u0448\u0438\u0431\u043A\u0430: "+o.error),this.state.step="upload")}catch{alert("\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438")}this.state.loading=!1,this.render()}async trackEvent(t){try{await fetch(`${r}/track`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({shop_id:this.getAttribute("data-shop-id"),event_type:t,visitor_id:this.visitorId,page_url:window.location.href})})}catch{}}render(){let{primary_color:t,button_text:e}=this.state.settings||{},o=!!this.getAttribute("data-button-selector");this.shadowRoot.innerHTML=`
        <style>${l(t)}</style>
        ${c}
        <div class="tv-floating-btn" id="open-btn" style="display: ${o?"none":"flex"}">
          ${h}
          <span class="tv-btn-text">${e||"\u041F\u0440\u0438\u043C\u0435\u0440\u0438\u0442\u044C \u043E\u043D\u043B\u0430\u0439\u043D"}</span>
        </div>

        <div class="tv-modal" id="modal" style="display: ${this.state.isOpen?"flex":"none"}">
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
      `,this.shadowRoot.getElementById("open-btn")?.addEventListener("click",()=>this.toggleModal(!0)),this.shadowRoot.getElementById("close-btn")?.addEventListener("click",()=>this.toggleModal(!1)),this.setupEventListeners()}renderStep(){let t=r.replace("/api/widget","");if(this.state.loading&&this.state.step==="upload")return`
          <div class="tv-progress-container">
            <div class="tv-title">\u0410\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0435\u043C \u0444\u043E\u0442\u043E</div>
            <div class="tv-progress-bar">
              <div class="tv-progress-fill" style="width: 35%"></div>
            </div>
            <div class="tv-progress-text">35%</div>
          </div>
        `;if(this.state.loading&&this.state.step==="mode-select")return`
          <div class="tv-progress-container">
            <div class="tv-title">\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u0432\u0430\u0448 \u043E\u0431\u0440\u0430\u0437</div>
            <div class="tv-progress-bar">
              <div class="tv-progress-fill" style="width: 65%"></div>
            </div>
            <div class="tv-progress-text">65%</div>
          </div>
        `;if(this.state.error)return`
          <div class="tv-error-box">
            <div class="tv-error-icon">
              <svg width="32" height="32"><use href="#tv-error"></use></svg>
            </div>
            <div class="tv-title" style="color:#EF4444">\u0424\u043E\u0442\u043E \u043D\u0435 \u043F\u043E\u0434\u0445\u043E\u0434\u0438\u0442</div>
            <div class="tv-subtitle" style="color:#EF4444">${this.state.error}</div>
          </div>
          <button class="tv-main-btn" id="clear-error">\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0444\u043E\u0442\u043E</button>
        `;switch(this.state.step){case"upload":return`
            <div class="tv-title">\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0432\u0430\u0448\u0435 \u0444\u043E\u0442\u043E</div>
            <div class="tv-subtitle">\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043D\u0438\u043C\u043E\u043A \u0432 \u043F\u043E\u043B\u043D\u044B\u0439 \u0440\u043E\u0441\u0442 \u043B\u0438\u0446\u043E\u043C \u043A \u043A\u0430\u043C\u0435\u0440\u0435, \u0433\u0434\u0435 \u0445\u043E\u0440\u043E\u0448\u043E \u0432\u0438\u0434\u043D\u0430 \u0444\u0438\u0433\u0443\u0440\u0430 \u0438 \u043E\u0434\u0435\u0436\u0434\u0430 \u043D\u0435 \u043E\u0432\u0435\u0440\u0441\u0430\u0439\u0437</div>
            <div class="tv-guide">
              <div class="tv-guide-item">
                <img src="${t}/guide-ok.webp" alt="OK">
                <div class="tv-badge"><svg><use href="#tv-success"></use></svg></div>
              </div>
              <div class="tv-guide-item">
                <img src="${t}/guide-no.webp" alt="NO">
                <div class="tv-badge"><svg><use href="#tv-error"></use></svg></div>
              </div>
            </div>
            <input type="file" id="file-input" accept="image/*" style="display:none">
            <button class="tv-main-btn" id="upload-trigger">\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u043E\u0442\u043E</button>
            <div class="tv-consent">
              ${this.state.settings?.consent_html||'\u041D\u0430\u0436\u0438\u043C\u0430\u044F \u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u0443 \xAB\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u043E\u0442\u043E\xBB, \u0432\u044B \u0441\u043E\u0433\u043B\u0430\u0448\u0430\u0435\u0442\u0435\u0441\u044C \u0441 <a href="#">\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u043E\u0439 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438</a> \u0438 \u0434\u0430\u0435\u0442\u0435 <a href="#">\u0421\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u043D\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u0434\u0430\u043D\u043D\u044B\u0445</a>'}
            </div>
          `;case"mode-select":return`
            <div class="tv-title">\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043D\u043E\u0435 \u0444\u043E\u0442\u043E</div>
            <img src="${this.state.userImage}" class="tv-user-photo-preview">
            
            <div class="tv-history-section">
              <div class="tv-history-title">\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043D\u044B\u0435 \u0440\u0430\u043D\u0435\u0435</div>
              <div class="tv-history-list">
                ${this.state.savedPhotos.map(e=>`
                  <div class="tv-history-item-wrapper">
                    <img src="${e}" class="tv-history-item ${e===this.state.userImage?"active":""}" data-history-url="${e}">
                    <div class="tv-delete-photo" data-delete-url="${e}">
                      <svg width="12" height="12"><use href="#tv-trash"></use></svg>
                    </div>
                  </div>
                `).join("")}
                <div class="tv-add-photo" id="add-photo-btn">
                  <svg width="20" height="20"><use href="#tv-plus"></use></svg>
                </div>
              </div>
            </div>

            <div style="margin-top: 32px">
              <div class="tv-title" style="font-size: 14px; margin-bottom: 16px">\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u043F\u0440\u0438\u043C\u0435\u0440\u0438\u0442\u044C</div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
                <button class="tv-secondary-btn ${this.state.selectedMode==="outfit"?"active":""}" data-mode="outfit">\u041F\u043E\u043B\u043D\u044B\u0439 \u043E\u0431\u0440\u0430\u0437</button>
                <button class="tv-secondary-btn ${this.state.selectedMode==="single"?"active":""}" data-mode="single">\u0412\u0435\u0449\u044C</button>
              </div>
              <button class="tv-main-btn" style="margin-top:24px" id="start-tryon">\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C</button>
            </div>
          `;case"result":return`
            <div class="tv-title">\u0412\u0430\u0448 \u043E\u0431\u0440\u0430\u0437 \u0433\u043E\u0442\u043E\u0432</div>
            <div style="position:relative; margin-bottom:24px">
              <img src="${this.state.resultImage}" style="width:100%; border-radius:20px; aspect-ratio:3/4; object-fit:cover">
              <div style="position:absolute; top:16px; right:16px; width:32px; height:32px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer" id="zoom-result">
                <svg width="20" height="20"><use href="#tv-zoom"></use></svg>
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
              <button class="tv-secondary-btn" id="new-try">\u041D\u043E\u0432\u044B\u0439 \u043E\u0431\u0440\u0430\u0437</button>
              <button class="tv-main-btn" id="more-actions-btn">\u0415\u0449\u0451</button>
            </div>

            <div class="tv-actions-menu" id="actions-menu">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
                <div class="tv-title" style="margin-bottom:0">\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F</div>
                <div style="font-size:12px; font-weight:700; cursor:pointer" id="close-actions">\u0417\u0430\u043A\u0440\u044B\u0442\u044C</div>
              </div>
              <div class="tv-action-item" id="download-action">
                <svg width="20" height="20"><use href="#tv-download"></use></svg>
                \u0421\u043A\u0430\u0447\u0430\u0442\u044C \u043E\u0431\u0440\u0430\u0437
              </div>
              <div class="tv-action-item" id="copy-action">
                <svg width="20" height="20"><use href="#tv-copy"></use></svg>
                \u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443
              </div>
            </div>

            <div class="tv-toast" id="tv-toast">
              <svg width="16" height="16"><use href="#tv-success"></use></svg>
              <span id="toast-text">\u0421\u0441\u044B\u043B\u043A\u0430 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0430!</span>
            </div>
          `;default:return""}}setupEventListeners(){this.shadowRoot.getElementById("upload-trigger")?.addEventListener("click",()=>{this.shadowRoot.getElementById("file-input").click()}),this.shadowRoot.getElementById("add-photo-btn")?.addEventListener("click",()=>{this.state.step="upload",this.render()}),this.shadowRoot.getElementById("file-input")?.addEventListener("change",t=>this.handleFileUpload(t)),this.shadowRoot.querySelectorAll("[data-mode]").forEach(t=>{t.addEventListener("click",()=>{this.state.selectedMode=t.dataset.mode,this.render()})}),this.shadowRoot.getElementById("start-tryon")?.addEventListener("click",()=>{this.handleTryOn(this.state.selectedMode)}),this.shadowRoot.getElementById("more-actions-btn")?.addEventListener("click",()=>{this.shadowRoot.getElementById("actions-menu")?.classList.add("open")}),this.shadowRoot.getElementById("close-actions")?.addEventListener("click",()=>{this.shadowRoot.getElementById("actions-menu")?.classList.remove("open")}),this.shadowRoot.getElementById("copy-action")?.addEventListener("click",()=>{navigator.clipboard.writeText(this.state.resultImage),this.showToast("\u0421\u0441\u044B\u043B\u043A\u0430 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0430!"),this.shadowRoot.getElementById("actions-menu")?.classList.remove("open")}),this.shadowRoot.getElementById("download-action")?.addEventListener("click",async()=>{let t=document.createElement("a");t.href=this.state.resultImage,t.download="tryvice-look.jpg",document.body.appendChild(t),t.click(),document.body.removeChild(t),this.showToast("\u0423\u0441\u043F\u0435\u0448\u043D\u043E\u0435 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435"),this.shadowRoot.getElementById("actions-menu")?.classList.remove("open")}),this.shadowRoot.getElementById("zoom-result")?.addEventListener("click",()=>{window.open(this.state.resultImage,"_blank")}),this.shadowRoot.getElementById("new-try")?.addEventListener("click",()=>{this.state.step="upload",this.render()}),this.shadowRoot.getElementById("clear-error")?.addEventListener("click",()=>{this.state.error=null,this.state.step="upload",this.render()}),this.shadowRoot.querySelectorAll(".tv-history-item").forEach(t=>{t.addEventListener("click",()=>{this.state.userImage=t.dataset.historyUrl,this.render()})}),this.shadowRoot.querySelectorAll(".tv-delete-photo").forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation();let o=t.dataset.deleteUrl,i=JSON.parse(localStorage.getItem("tv_history")||'{"generations":[], "photos":[]}');i.photos=i.photos.filter(s=>s!==o),localStorage.setItem("tv_history",JSON.stringify(i)),this.loadHistory(),this.state.userImage===o&&(this.state.userImage=this.state.savedPhotos[0]||null),this.render()})})}showToast(t){let e=this.shadowRoot.getElementById("tv-toast"),o=this.shadowRoot.getElementById("toast-text");!e||!o||(o.innerText=t,e.classList.add("show"),setTimeout(()=>e.classList.remove("show"),3e3))}}customElements.get("tryvice-widget")||customElements.define("tryvice-widget",p);let d=document.currentScript;if(d){let a=document.createElement("tryvice-widget");a.setAttribute("data-shop-id",d.getAttribute("data-shop-id")||""),a.setAttribute("data-product-id",d.getAttribute("data-product-id")||""),document.body.appendChild(a)}})();})();
