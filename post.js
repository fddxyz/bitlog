document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const inscriptionId = urlParams.get('inscriptionId');

  if (!inscriptionId) {
    document.getElementById('inscription-content').innerHTML = '<p>错误：未提供铭文 ID。</p>';
    return;
  }

  const inscriptionUrl = `https://ordiscan.com/content/${inscriptionId}`;

  try {
    const response = await fetch(inscriptionUrl);
    if (!response.ok) {
      throw new Error(`HTTP 错误！状态码：${response.status}`);
    }

    let text = await response.text();
    console.log("✅ 原始 Markdown 数据:", text);

    // 修改正则表达式以处理 ```markdown 的情况
    text = text.replace(/^```markdown?\s*\n([\s\S]*?)\n```$/m, '$1').trim();
    
    console.log("✅ 处理后的 Markdown 数据:", text);

    // **解析 Markdown 为 HTML**
    const htmlContent = marked.parse(text);

    // **用 DOM 方式插入 HTML**
    const container = document.getElementById('inscription-content');
    container.innerHTML = ''; // 清空旧内容
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    container.appendChild(div);

  } catch (error) {
    console.error('❌ 加载铭文内容失败:', error);
    document.getElementById('inscription-content').innerHTML = `<p>加载铭文内容失败，请检查铭文 ID 是否有效。</p>`;
  }
});
