// 语言定义
const i18n = {
  zh: {
    loading: '加载中...',
    noApiKey: '请先在设置中配置 API Key',
    invalidApiKey: 'API Key 无效，请检查设置',
    loadError: '加载失败，请重试',
    noInscriptions: '未找到铭文',
    viewOnOrdiscan: '在 Ordiscan 上查看',
    inputPlaceholder: '输入比特币地址',
    history: '历史记录',
    favorites: '收藏夹',
    noHistory: '暂无历史记录',
    noFavorites: '暂无收藏',
    addToFavorites: '添加到收藏夹',
    delete: '删除'
  },
  en: {
    loading: 'Loading...',
    noApiKey: 'Please configure API Key in settings',
    invalidApiKey: 'Invalid API Key, please check settings',
    loadError: 'Failed to load, please try again',
    noInscriptions: 'No inscriptions found',
    viewOnOrdiscan: 'View on Ordiscan',
    inputPlaceholder: 'Enter Bitcoin address',
    history: 'History',
    favorites: 'Favorites',
    noHistory: 'No history',
    noFavorites: 'No favorites',
    addToFavorites: 'Add to favorites',
    delete: 'Delete'
  }
};

// 获取当前语言
async function getCurrentLanguage() {
  const { language = 'zh' } = await chrome.storage.sync.get(['language']);
  return language;
}

// 获取翻译文本
async function getText(key) {
  const language = await getCurrentLanguage();
  return i18n[language][key] || key;
}

document.addEventListener('DOMContentLoaded', async () => {
  // 等待 i18n 加载完成
  if (typeof getText === 'undefined') {
    console.error('i18n.js not loaded properly');
    return;
  }

  // 从 URL 获取地址参数
  const urlParams = new URLSearchParams(window.location.search);
  const addressFromUrl = urlParams.get('address');
  
  // 显示地址
  const addressInput = document.getElementById('btcAddressInput');
  const inputPlaceholder = await getText('inputPlaceholder');
  
  if (addressFromUrl) {
    addressInput.value = addressFromUrl;
    loadInscriptions(addressFromUrl);
    addToHistory(addressFromUrl);
  } else {
    addressInput.value = '';
    addressInput.placeholder = inputPlaceholder;
    showHistoryTab();
  }

  // 添加地址输入事件监听
  addressInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      const address = addressInput.value.trim();
      if (address) {
        loadInscriptions(address);
        addToHistory(address);
        
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('address', address);
        window.history.pushState({}, '', newUrl);
      }
    }
  });

  // 添加设置按钮点击事件
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 初始显示历史记录
  showHistoryTab();
});

// 添加到历史记录
async function addToHistory(address) {
  const MAX_HISTORY = 50;
  const { history = [] } = await chrome.storage.sync.get(['history']);
  
  // 移除已存在的相同地址（如果有）
  const filteredHistory = history.filter(item => item.address !== address);
  
  // 添加新记录到开头
  const newHistory = [{
    address,
    timestamp: new Date().toISOString()
  }, ...filteredHistory];
  
  // 如果超过最大限制，删除最旧的记录
  if (newHistory.length > MAX_HISTORY) {
    newHistory.splice(MAX_HISTORY);
  }
  
  await chrome.storage.sync.set({ history: newHistory });
}

// 格式化日期
async function formatDate(timestamp) {
  const language = await getCurrentLanguage();
  const date = new Date(timestamp);
  
  if (language === 'zh') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else {
    // 英文格式
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }
}

// 显示历史记录
async function showHistoryTab() {
  const inscriptionsDiv = document.getElementById('inscriptions');
  const { history = [], favorites = [] } = await chrome.storage.sync.get(['history', 'favorites']);
  
  let html = `
    <div class="tabs-container">
      <div class="tabs">
        <button class="tab active" data-tab="history">${await getText('history')}</button>
        <button class="tab" data-tab="favorites">${await getText('favorites')}</button>
      </div>
      <div class="tab-content">`;
  
  if (history.length === 0) {
    html += `<div class="no-content">${await getText('noHistory')}</div>`;
  } else {
    html += `<ul class="history-list">`;
    for (const item of history) {
      html += `
        <li class="history-item">
          <div class="history-content">
            <a href="?address=${item.address}" class="history-address">${item.address}</a>
            <div class="history-time">${await formatDate(item.timestamp)}</div>
          </div>
          <div class="history-actions">
            <button class="favorite-btn" title="${await getText('addToFavorites')}" data-address="${item.address}">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
              </svg>
            </button>
            <button class="history-delete" title="${await getText('delete')}" data-address="${item.address}">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
            </button>
          </div>
        </li>`;
    }
    html += `</ul>`;
  }
  
  html += `</div></div>`;
  inscriptionsDiv.innerHTML = html;

  // 添加选项卡切换事件
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      if (e.target.dataset.tab === 'history') {
        showHistoryTab();
      } else {
        showFavoritesTab();
      }
    });
  });

  // 添加收藏事件
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const address = btn.dataset.address;
      const name = await showNamePrompt(address);
      if (name) {
        await addToFavorites(address, name);
      }
    });
  });

  // 添加删除事件
  document.querySelectorAll('.history-delete').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const addressToDelete = button.dataset.address;
      const { history = [] } = await chrome.storage.sync.get(['history']);
      const newHistory = history.filter(item => item.address !== addressToDelete);
      await chrome.storage.sync.set({ history: newHistory });
      showHistoryTab();
    });
  });
}

// 显示收藏夹
async function showFavoritesTab() {
  const tabContent = document.querySelector('.tab-content');
  const { favorites = [] } = await chrome.storage.sync.get(['favorites']);
  
  document.querySelector('[data-tab="history"]').classList.remove('active');
  document.querySelector('[data-tab="favorites"]').classList.add('active');
  
  // 先获取需要的翻译文本
  const noFavoritesText = await getText('noFavorites');
  const deleteText = await getText('delete');
  
  let html = '';
  if (favorites.length === 0) {
    html = `<div class="no-content">${noFavoritesText}</div>`;
  } else {
    html = `<ul class="favorites-list">`;
    for (const item of favorites) {
      html += `
        <li class="favorite-item">
          <div class="favorite-content">
            <div class="favorite-name">${item.name}</div>
            <a href="?address=${item.address}" class="favorite-address">${item.address}</a>
          </div>
          <button class="favorite-delete" title="${deleteText}" data-address="${item.address}">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
            </svg>
          </button>
        </li>`;
    }
    html += `</ul>`;
  }
  
  tabContent.innerHTML = html;
}

// 加载铭文数据
async function loadInscriptions(address) {
  const inscriptionsDiv = document.getElementById('inscriptions');
  inscriptionsDiv.innerHTML = '<div class="loading">加载中...</div>';

  try {
    const { apiKey } = await chrome.storage.sync.get(['apiKey']);
    
    if (!apiKey) {
      inscriptionsDiv.innerHTML = '<div class="error">请先在设置中配置 API Key</div>';
      return;
    }

    // 首先尝试获取铭文列表
    let response = await fetch(`https://api.ordiscan.com/v1/address/${address}/inscriptions`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        inscriptionsDiv.innerHTML = '<div class="error">API Key 无效，请检查设置</div>';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    let text = await response.text();
    console.log('Raw API Response (list):', text);
    
    let data = JSON.parse(text);
    console.log('Parsed Data (list):', data);

    // 如果列表为空，尝试获取单个铭文
    let inscriptions = [];
    if (data.data && data.data.length === 0) {
      // 尝试获取单个铭文
      response = await fetch(`https://api.ordiscan.com/v1/inscription/address/${address}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        text = await response.text();
        console.log('Raw API Response (single):', text);
        
        const singleData = JSON.parse(text);
        console.log('Parsed Data (single):', singleData);
        
        if (singleData && singleData.inscription_id) {
          inscriptions = [singleData];
        }
      }
    } else {
      inscriptions = data.data;
    }

    console.log('Final Inscriptions:', inscriptions);

    if (inscriptions && inscriptions.length > 0) {
      inscriptionsDiv.innerHTML = `
        <div class="inscriptions-grid">
          ${inscriptions.map(item => `
            <div class="inscription-card">
              <div class="inscription-content">
                <iframe src="https://ordiscan.com/content/${item.inscription_id}" frameborder="0" sandbox="allow-scripts"></iframe>
              </div>
              <div class="inscription-info">
                <div class="inscription-number">#${item.inscription_number}</div>
                <a href="post.html?inscriptionId=${item.inscription_id}" target="_blank" class="view-link">
                  查看详情
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                  </svg>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      inscriptionsDiv.innerHTML = '<div class="no-content">未找到铭文</div>';
    }
  } catch (error) {
    console.error('Error details:', error);
    inscriptionsDiv.innerHTML = `<div class="error">加载失败：${error.message}</div>`;
  }
}

function openMarkdownView(inscriptionId) {
  window.open(`post.html?inscriptionId=${inscriptionId}`, '_blank');
}

// 显示命名提示框
async function showNamePrompt(address) {
  const { language = 'zh' } = await chrome.storage.sync.get(['language']);
  const getText = (key) => i18n[language][key];
  
  return new Promise((resolve) => {
    const name = prompt(getText('addNamePrompt'));
    resolve(name);
  });
}

// 添加到收藏夹
async function addToFavorites(address, name) {
  const MAX_FAVORITES = 50;
  const { favorites = [] } = await chrome.storage.sync.get(['favorites']);
  
  if (favorites.some(item => item.address === address)) {
    alert(await getText('alreadyFavorited'));
    return;
  }
  
  if (favorites.length >= MAX_FAVORITES) {
    alert(await getText('favoritesLimitReached'));
    return;
  }
  
  const newFavorites = [...favorites, {
    address,
    name,
    timestamp: new Date().toISOString()
  }];
  
  await chrome.storage.sync.set({ favorites: newFavorites });
  alert(await getText('favoriteSuccess'));
}

// 从收藏夹移除
async function removeFromFavorites(address) {
  if (confirm(await getText('confirmUnfavorite'))) {
    const { favorites = [] } = await chrome.storage.sync.get(['favorites']);
    const newFavorites = favorites.filter(item => item.address !== address);
    await chrome.storage.sync.set({ favorites: newFavorites });
    showFavoritesTab();
  }
}
