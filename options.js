// 语言定义
const i18n = {
  zh: {
    title: '设置',
    apiKeyLabel: 'Ordiscan API Key',
    apiKeyPlaceholder: '请输入您的 API Key',
    apiKeyTip: '如需使用 Ordiscan API，请前往 ordiscan.com/login 申请 API Key',
    languageLabel: '语言',
    save: '保存',
    saveSuccess: '保存成功'
  },
  en: {
    title: 'Settings',
    apiKeyLabel: 'Ordiscan API Key',
    apiKeyPlaceholder: 'Enter your API Key',
    apiKeyTip: 'To use Ordiscan API, please apply for an API Key at ordiscan.com/login',
    languageLabel: 'Language',
    save: 'Save',
    saveSuccess: 'Saved successfully'
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

// 页面加载时读取已保存的设置
document.addEventListener('DOMContentLoaded', async () => {
  // 等待 i18n 加载完成
  if (typeof getText === 'undefined') {
    console.error('i18n.js not loaded properly');
    return;
  }

  // 初始化页面
  await initializePage();
  
  // 语言切换时实时更新界面
  document.getElementById('language').addEventListener('change', async (e) => {
    await updateUILanguage(e.target.value);
  });
  
  // 保存设置
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const newApiKey = document.getElementById('apiKey').value.trim();
    const newLanguage = document.getElementById('language').value;
    
    await chrome.storage.sync.set({
      apiKey: newApiKey,
      language: newLanguage
    });
    
    const message = document.getElementById('message');
    message.textContent = await getText('saveSuccess');
    setTimeout(() => {
      message.textContent = '';
    }, 2000);
  });
});

// 更新界面语言
async function updateUILanguage(language) {
  // 更新标题
  document.querySelector('.title').textContent = await getText('title');
  
  // 更新 API Key 标签和占位符
  const apiKeyLabel = document.querySelector('label[for="apiKey"]');
  const apiKeyInput = document.getElementById('apiKey');
  apiKeyLabel.textContent = await getText('apiKeyLabel');
  apiKeyInput.placeholder = await getText('apiKeyPlaceholder');
  
  // 更新语言标签
  document.querySelector('label[for="language"]').textContent = await getText('languageLabel');
  
  // 更新保存按钮
  document.getElementById('saveBtn').textContent = await getText('save');
}

// 添加错误处理
chrome.storage.sync.onChanged.addListener((changes, namespace) => {
  console.log('存储变化:', changes);
  console.log('命名空间:', namespace);
});

// 检查 storage 权限
chrome.storage.sync.get(null, function(items) {
  console.log('当前存储的所有数据:', items);
  if (chrome.runtime.lastError) {
    console.error('读取存储时发生错误:', chrome.runtime.lastError);
  }
});

// 初始化页面
async function initializePage() {
  document.title = await getText('title');
  document.querySelector('.title').textContent = await getText('title');
  document.querySelector('label[for="apiKey"]').textContent = await getText('apiKeyLabel');
  document.querySelector('#apiKey').placeholder = await getText('apiKeyPlaceholder');
  
  // 添加 API Key 提示文本
  const apiKeyGroup = document.querySelector('.form-group');
  const tipDiv = document.createElement('div');
  tipDiv.className = 'api-key-tip';
  tipDiv.textContent = await getText('apiKeyTip');
  apiKeyGroup.appendChild(tipDiv);
  
  document.querySelector('label[for="language"]').textContent = await getText('languageLabel');
  document.querySelector('#saveBtn').textContent = await getText('save');
  
  // 加载已保存的设置
  const { apiKey = '', language = 'zh' } = await chrome.storage.sync.get(['apiKey', 'language']);
  document.querySelector('#apiKey').value = apiKey;
  document.querySelector('#language').value = language;
}
