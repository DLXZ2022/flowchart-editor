/**
 * 爬虫内容提取工具函数
 * 负责识别主要内容区域、清理噪音元素、提取结构化内容
 */

// 导入所需库
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

/**
 * 使用 Readability 提取页面的主要可读内容 HTML
 * @param {string} rawHtml - 页面的原始HTML内容
 * @param {string} pageUrl - 页面的URL，用于 Readability 内部处理相对链接
 * @param {Object} log - 日志记录器
 * @returns {Promise<{title: string, contentHtml: string, textContent: string, excerpt: string, siteName: string} | null>} - Readability 提取的文章对象，失败则返回null
 */
async function extractReadableHtml(rawHtml, pageUrl, log) {
  log.info('[READABILITY] 尝试使用 Readability 提取内容...');
  try {
    const doc = new JSDOM(rawHtml, {
      url: pageUrl, // 提供URL很重要
    });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    
    if (article && article.content) {
      log.info(`[READABILITY] 提取成功: 标题="${article.title}", 文本长度=${article.textContent?.length}`);
      return {
        title: article.title || '', // 文章标题
        contentHtml: article.content || '', // 清理后的主要内容HTML
        textContent: article.textContent || '', // 主要内容的纯文本
        excerpt: article.excerpt || '', // 文章摘要
        siteName: article.siteName || '' // 网站名称
      };
    } else {
      log.warn('[READABILITY] 未能提取主要内容。');
      return null;
    }
  } catch (error) {
    log.error(`[READABILITY] 提取时出错: ${error.message}`, { stack: error.stack });
    return null;
  }
}

/**
 * (下一步实现) 从清理后的 HTML 提取结构化内容
 * @param {string} cleanedHtml - Readability 清理后的HTML内容
 * @param {Object} log - 日志记录器
 * @returns {Promise<{cleanText: string, structuredContent: Array}>} - 提取的纯文本和结构化内容
 */
async function extractStructuredContentFromHtml(cleanedHtml, log) {
  log.info(`[STRUCTURE_EXTRACTOR] 从清理后的HTML中提取结构...`);
  
  // --- 在这里实现 HTML -> JSON 的转换逻辑 (下一步) ---
  
  // 临时实现：先返回基本的文本内容
  const tempDoc = new JSDOM(cleanedHtml);
  const cleanText = (tempDoc.window.document.body.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
      
  const structuredContent = []; // 暂空，待实现
  // 可以在这里添加基本的段落分割作为临时方案
  if (!structuredContent.length && cleanText) {
      cleanText.split(/\n\s*\n/).forEach(para => {
          const trimmed = para.trim();
          if (trimmed.length > 20) {
              structuredContent.push({ type: 'paragraph', text: trimmed });
          }
      });
  }

  log.info(`[STRUCTURE_EXTRACTOR] 提取完成 (临时). 文本长度: ${cleanText.length}, 结构项: ${structuredContent.length}`);
  
  return {
    cleanText, 
    structuredContent // 暂时可能为空或只有基本段落
  };
}

/**
 * 错误处理和类型定义函数
 * @param {Error} error - 错误对象
 * @param {string} context - 错误发生的上下文
 * @param {Object} log - 日志记录器
 * @returns {{type: string, message: string, details: Object}} - 格式化的错误信息
 */
function handleError(error, context, log) {
  // 错误类型映射
  const errorTypes = {
    'TimeoutError': 'TIMEOUT_ERROR',
    'NavigationError': 'NAVIGATION_ERROR',
    'NetworkError': 'NETWORK_ERROR',
    'EvaluationError': 'EVALUATION_ERROR',
    'ReadabilityError': 'READABILITY_ERROR', // 新增 Readability 错误
    'ExtractorError': 'EXTRACTOR_ERROR'
  };
  
  // 确定错误类型
  let errorType = 'UNKNOWN_ERROR';
  for (const [pattern, type] of Object.entries(errorTypes)) {
    if (error.name?.includes(pattern) || error.message?.includes(pattern)) {
      errorType = type;
      break;
    }
  }
  
  // 记录详细错误信息
  log.error(`[${errorType}] ${context}: ${error.message}`, { 
    stack: error.stack,
    context: context
  });
  
  // 返回格式化的错误信息
  return {
    type: errorType,
    message: error.message,
    details: {
      context: context,
      stack: error.stack
    }
  };
}

module.exports = {
  extractReadableHtml,
  extractStructuredContentFromHtml, // 修改导出的函数名
  handleError
};

/* 
// 注释掉之前的函数，Readability 会处理类似功能
async function findMainContentElement(page, log) { ... }
async function removeNoiseElements(page, contentSelector, log) { ... }
async function extractStructuredContent(page, contentSelector, log) { ... }
*/ 