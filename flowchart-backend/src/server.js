const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PlaywrightCrawler } = require('crawlee');

// 导入修改后的工具函数
const {
  extractReadableHtml,
  extractStructuredContentFromHtml, // 注意函数名变化
  handleError
} = require('./crawler/extractionUtils');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Flowchart backend is running' });
});

// 恢复 PlaywrightCrawler 版本的 /api/crawl 端点
app.post('/api/crawl', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`[CRAWL START - Crawler Mode] URL: ${url}`);
    
    let crawlResult = null;
    let handlerError = null; 
    
    const crawler = new PlaywrightCrawler({
      headless: true,
      // maxRequestsPerCrawl: 1, // <-- 暂时注释掉进行测试
      requestHandlerTimeoutSecs: 120, 
      navigationTimeoutSecs: 120,  // 增加到120秒以处理慢速网站
      
      async requestHandler({ page, request, log }) {
        log.info(`[HANDLER START] Processing page via Crawler: ${request.url}`);
        try {
          // 等待页面加载
          log.info('[HANDLER] Waiting for network idle...');
          try {
            await page.waitForLoadState('networkidle', { timeout: 60000 });
            log.info('[HANDLER] Network is idle.');
          } catch (networkIdleError) {
            // 如果网络空闲超时，尝试继续处理
            log.warn(`[HANDLER] Network idle timeout, proceeding anyway: ${networkIdleError.message}`);
          }

          // 如果页面仍在加载，至少等待DOM内容加载
          log.info('[HANDLER] Ensuring DOM content is loaded...');
          await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
          
          // 第1步：获取原始 HTML
          log.info('[HANDLER] Getting raw HTML content...');
          const rawHtml = await page.content();

          // 第2步：使用 Readability 提取可读内容
          log.info('[HANDLER] Extracting readable HTML with Readability...');
          const readableArticle = await extractReadableHtml(rawHtml, request.url, log);

          if (!readableArticle) {
             throw new Error('Readability failed to extract content.');
          }

          // 第3步：(临时) 从清理后的 HTML 提取基本文本和待实现的结构
          log.info('[HANDLER] Extracting basic content from cleaned HTML...');
          // 注意这里调用的是 extractStructuredContentFromHtml
          const { cleanText, structuredContent } = await extractStructuredContentFromHtml(readableArticle.contentHtml, log);

          // 使用 Readability 提取的标题，如果它存在的话，否则回退到页面标题
          const finalTitle = readableArticle.title || await page.title();
          log.info(`[HANDLER] Final page title: ${finalTitle}`);

          // 记录统计信息
          const stats = {
            readabilityTextLength: readableArticle.textContent.length,
            finalTextLength: cleanText.length, // 最终文本长度
            structuredItems: structuredContent.length // 最终结构项数量
          };
          log.info(`[HANDLER] Extracted content stats:`, stats);
          
          // 返回结果
          log.info('[HANDLER] Attempting to assign crawl result...');
          crawlResult = {
            url: request.url,
            title: finalTitle,
            content: cleanText, // 使用从清理后HTML提取的文本
            structuredContent: structuredContent, // 结构化内容（待下一步完善）
            stats: stats,
            // 可以选择性地包含Readability提取的其他信息
            readabilityExcerpt: readableArticle.excerpt,
            readabilitySiteName: readableArticle.siteName,
            // cleanedHtml: readableArticle.contentHtml // (调试时可以取消注释)
          };
          log.info('[HANDLER] Crawl result successfully assigned.');

        } catch (error) {
          // 使用更新后的错误处理上下文
          const formattedError = handleError(error, 'Content extraction with Readability', log);
          handlerError = new Error(`Extraction error: ${formattedError.message}`);
          handlerError.details = formattedError;
          log.error(`[HANDLER ERROR] ${handlerError.message}`);
        }
        log.info(`[HANDLER END] Finished processing page: ${request.url}`);
      },
      
      failedRequestHandler({ request, error, log }) {
         // 使用更新后的错误处理上下文
         const formattedError = handleError(error, 'Request handling failed', log);
         log.error(`[FAILED HANDLER] Request ${request.url} failed: ${formattedError.type} - ${formattedError.message}`);
         if (!handlerError) { 
            handlerError = new Error(`Request failed for ${request.url}: ${formattedError.message}`);
            handlerError.details = formattedError;
         } 
      },
    });

    console.log('[CRAWLER] Preparing to run crawler...'); // Log before resetting

    // Explicitly reset result/error variables before this specific run
    crawlResult = null;
    handlerError = null;

    // 创建一个带有唯一键的请求对象
    const uniqueKey = `${url}-${Date.now()}`; // 添加时间戳确保唯一性
    const requestObject = {
        url: url,
        uniqueKey: uniqueKey,
    };
    console.log(`[CRAWLER] Created unique request object with key: ${uniqueKey}`);

    console.log('[CRAWLER] Attempting to run crawler with unique request object...');
    // 传递请求对象数组给 run 方法
    await crawler.run([requestObject]);
    console.log('[CRAWLER] Crawler run finished.');
    
    // 检查结果和错误 (保持之前的逻辑)
    if (!crawlResult && handlerError) {
      console.error(`[CRAWL END - Crawler Mode] Failed due to handler error: ${handlerError.message}`);
      return res.status(500).json({
        error: 'Error during page processing',
        message: handlerError.message || String(handlerError),
        details: handlerError.details || {}
      });
    }
    if (!crawlResult) {
      console.error('[CRAWL END - Crawler Mode] Failed: No crawl result obtained and no specific handler error recorded.');
      return res.status(500).json({ 
        error: 'Failed to crawl the URL', 
        message: 'The crawler finished, but no content was successfully extracted. The target page might be inaccessible, protected, or timed out.'
      });
    }
    
    console.log(`[CRAWL SUCCESS - Crawler Mode] URL: ${url}`);
    res.json({
      url: crawlResult.url,
      title: crawlResult.title,
      content: crawlResult.content,
      structuredContent: crawlResult.structuredContent,
      stats: crawlResult.stats
    });
    
  } catch (error) {
    console.error(`[CRAWL END - Crawler Mode] Uncaught crawler error: ${error.message}`, { 
      stack: error.stack, 
      details: error 
    });
    res.status(500).json({
      error: 'An unexpected error occurred during crawling setup or execution',
      message: error.message || String(error)
    });
  }
});

// 注释掉或删除直接 Playwright 测试版本的 /api/crawl 端点
/*
app.post('/api/crawl', async (req, res) => {
  let browser = null;
  try {
    // ... Direct Playwright test code ...
  } catch (error) {
    // ... Error handling ...
  }
});
*/

// 内容处理API端点
app.post('/api/extract', (req, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    console.log(`处理内容: ${title || 'Untitled'}`);
    
    // 简单分割文本为段落
    const paragraphs = content
      .split(/\n+/)
      .filter(para => para.trim().length > 20) // 过滤掉太短的段落
      .slice(0, 10); // 限制段落数量，避免图太大
    
    // 创建节点
    const nodes = paragraphs.map((paragraph, index) => ({
      id: `node-${index + 1}`,
      type: 'custom',
      position: { x: 250, y: 100 + index * 150 }, // 垂直排列节点
      data: {
        label: paragraph.substring(0, 30) + (paragraph.length > 30 ? '...' : ''), // 简短标签
        description: paragraph, // 完整段落作为描述
        type: index % 3 === 0 ? 'typeA' : (index % 3 === 1 ? 'typeB' : 'typeC'), // 轮换节点类型
        handleCounts: { top: 1, bottom: 1, left: 1, right: 1 },
        flipped: false
      }
    }));
    
    // 创建边 (简单顺序连接)
    const edges = paragraphs.slice(1).map((_, index) => ({
      id: `edge-${index + 1}-${index + 2}`,
      source: `node-${index + 1}`,
      target: `node-${index + 2}`,
      type: 'custom',
      data: {
        label: index === 0 ? '开始' : (index === paragraphs.length - 2 ? '结束' : '接着')
      }
    }));
    
    // 返回结果
    res.json({
      nodes,
      edges
    });
    
  } catch (error) {
    console.error('内容处理错误:', error);
    res.status(500).json({
      error: 'An error occurred while processing content',
      message: error.message || String(error)
    });
  }
});

// 高级内容处理API端点 - 更智能的结构分析和流程图生成
app.post('/api/extract-advanced', async (req, res) => {
  try {
    const { content, title, originalUrl, structuredContent } = req.body;
    
    if (!content && !structuredContent) {
      return res.status(400).json({ error: 'Content or structuredContent is required' });
    }
    
    console.log(`高级处理内容: ${title || 'Untitled'}`);
    
    // 有两种处理途径：
    // 1. 如果提供了structuredContent（从爬虫提供的结构化内容），优先使用它
    // 2. 如果没有structuredContent，则使用analyzeContentStructure函数分析纯文本
    
    let analyzedStructure;
    
    if (structuredContent && Array.isArray(structuredContent) && structuredContent.length > 0) {
      console.log('使用爬虫提供的结构化内容');
      // 直接使用爬虫提供的结构化内容，但添加标题
      analyzedStructure = [];
      
      // 添加页面标题作为第一个元素（如果它不是标题内容中的第一个标题）
      if (title && (!structuredContent[0] || 
         (structuredContent[0].type !== 'header' && 
          structuredContent[0].text !== title))) {
        analyzedStructure.push({
          type: 'title',
          text: title,
          level: 0
        });
      }
      
      // 合并爬虫的结构化内容
      analyzedStructure = [...analyzedStructure, ...structuredContent];
    } else {
      console.log('使用文本分析来创建结构化内容');
      // 使用文本分析来识别结构
      analyzedStructure = analyzeContentStructure(content, title);
    }
    
    // 限制数量以避免图表过大，优先保留标题和结构信息
    // 首先分离标题和其他内容
    const titleElements = analyzedStructure.filter(
      item => item.type === 'title' || item.type === 'header'
    );
    const otherElements = analyzedStructure.filter(
      item => item.type !== 'title' && item.type !== 'header'
    );
    
    // 如果有太多非标题元素，只保留最重要的部分
    let finalStructure;
    if (titleElements.length + otherElements.length > 15) {
      // 最多保留15个项目，优先保留标题
      const availableOtherSlots = Math.max(0, 15 - titleElements.length);
      const keepOtherElements = otherElements.slice(0, availableOtherSlots);
      finalStructure = [...titleElements, ...keepOtherElements];
    } else {
      finalStructure = analyzedStructure;
    }
    
    // 根据分析的结构生成流程图
    const { nodes, edges } = generateFlowFromStructure(finalStructure);
    
    // 返回结果
    res.json({
      nodes,
      edges
    });
    
  } catch (error) {
    console.error('高级内容处理错误:', error);
    res.status(500).json({
      error: 'An error occurred while processing content with advanced method',
      message: error.message || String(error)
    });
  }
});

/**
 * 分析内容结构，识别标题、列表和段落等元素
 * @param {string} content - 文本内容
 * @param {string} title - 页面标题
 * @returns {Array} 结构化的内容数组
 */
function analyzeContentStructure(content, title) {
  // 结构化内容数组，每个项目包含类型和文本
  const structuredContent = [];
  
  // 添加标题作为第一个元素
  if (title) {
    structuredContent.push({
      type: 'title',
      text: title,
      level: 0
    });
  }
  
  // 尝试识别文本中的标题（通过模式如数字+句点或特殊标记）
  const lines = content.split(/\n+/);
  
  // 标题正则模式
  const headerPatterns = [
    { regex: /^(第[一二三四五六七八九十\d]+[章节篇部])[：:\s]+(.+)$/i, level: 1 }, // 第一章: 标题
    { regex: /^([一二三四五六七八九十]{1,2}[、\.\s]+)(.+)$/i, level: 2 }, // 一、标题
    { regex: /^(\d+[\.\s]+)(.+)$/i, level: 2 }, // 1. 标题
    { regex: /^([A-Z][\.\s]+)(.+)$/i, level: 2 }, // A. 标题
  ];
  
  // 列表项正则模式
  const listItemPatterns = [
    { regex: /^[•\-\*\+◦○●♦※][\s]+(.+)$/i }, // • - * + 列表项
    { regex: /^(\(\d+\)|\d+\))[\s]+(.+)$/i }, // (1) 或 1) 列表项
    { regex: /^([a-z](\)|\.))\s+(.+)$/i }, // a) 或 a. 列表项
  ];
  
  let currentListItems = [];
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return; // 跳过空行
    
    // 判断行是否是标题
    let isHeader = false;
    for (const pattern of headerPatterns) {
      const match = trimmedLine.match(pattern.regex);
      if (match) {
        // 如果有待处理的列表项，先添加它们
        if (currentListItems.length > 0) {
          structuredContent.push({
            type: 'list',
            items: [...currentListItems]
          });
          currentListItems = [];
        }
        
        structuredContent.push({
          type: 'header',
          text: match[2] || match[0],
          level: pattern.level
        });
        isHeader = true;
        break;
      }
    }
    if (isHeader) return;
    
    // 判断行是否是列表项
    let isListItem = false;
    for (const pattern of listItemPatterns) {
      const match = trimmedLine.match(pattern.regex);
      if (match) {
        const itemText = match[match.length - 1] || match[0];
        currentListItems.push(itemText);
        isListItem = true;
        break;
      }
    }
    if (isListItem) return;
    
    // 如果不是标题或列表项，判断是否是段落
    // 实际逻辑中可能需要更复杂的判断，比如句子长度、标点符号等
    if (trimmedLine.length > 20) {
      // 如果有待处理的列表项，先添加它们
      if (currentListItems.length > 0) {
        structuredContent.push({
          type: 'list',
          items: [...currentListItems]
        });
        currentListItems = [];
      }
      
      structuredContent.push({
        type: 'paragraph',
        text: trimmedLine
      });
    }
  });
  
  // 处理末尾可能剩余的列表项
  if (currentListItems.length > 0) {
    structuredContent.push({
      type: 'list',
      items: [...currentListItems]
    });
  }
  
  // 对结构化内容进行处理，限制数量避免图太大
  return structuredContent.slice(0, 15);
}

/**
 * 根据结构化内容生成流程图节点和边
 * @param {Array} structuredContent - 结构化内容数组
 * @returns {Object} 包含节点和边的对象
 */
function generateFlowFromStructure(structuredContent) {
  const nodes = [];
  const edges = [];
  
  // 节点ID计数器
  let nodeId = 1;
  
  // 记录上一个节点ID，用于连接
  let lastNodeId = null;
  // 记录当前所属的标题节点ID
  let currentHeaderId = null;
  // 记录当前所属层次的标题节点ID，按层级索引
  const headerNodesByLevel = {};
  
  structuredContent.forEach((item, index) => {
    let newNodeId = `node-${nodeId++}`;
    
    switch(item.type) {
      case 'title':
      case 'header':
        // 为标题创建节点
        nodes.push({
          id: newNodeId,
          type: 'custom',
          position: { x: 250, y: 100 + nodes.length * 150 }, // 位置稍后会通过自动布局调整
          data: {
            label: item.text.substring(0, 40) + (item.text.length > 40 ? '...' : ''), // 标题可以稍长
            description: item.text,
            type: item.type === 'title' ? 'typeA' : 'typeB', // 标题使用蓝色节点，子标题使用绿色
            handleCounts: { top: 1, bottom: 1, left: 1, right: 1 },
            flipped: false
          }
        });
        
        // 记录标题节点ID
        if (item.level !== undefined) {
          headerNodesByLevel[item.level] = newNodeId;
          
          // 如果存在上一级标题，连接到它
          if (item.level > 0 && headerNodesByLevel[item.level - 1]) {
            edges.push({
              id: `edge-${headerNodesByLevel[item.level - 1]}-${newNodeId}`,
              source: headerNodesByLevel[item.level - 1],
              target: newNodeId,
              type: 'custom',
              data: {
                label: '包含'
              }
            });
          }
        }
        
        // 更新当前标题ID
        currentHeaderId = newNodeId;
        lastNodeId = newNodeId;
        break;
        
      case 'list':
        // 为列表创建一个节点
        nodes.push({
          id: newNodeId,
          type: 'custom',
          position: { x: 250, y: 100 + nodes.length * 150 },
          data: {
            label: `列表 (${item.items.length}项)`,
            description: item.items.join('\n• '),
            type: 'typeC', // 列表使用黄色节点
            handleCounts: { top: 1, bottom: 1, left: 1, right: 1 },
            flipped: false
          }
        });
        
        // 如果有当前标题，连接到标题
        if (currentHeaderId) {
          edges.push({
            id: `edge-${currentHeaderId}-${newNodeId}`,
            source: currentHeaderId,
            target: newNodeId,
            type: 'custom',
            data: {
              label: '列表'
            }
          });
        } 
        // 否则连接到上一个节点
        else if (lastNodeId) {
          edges.push({
            id: `edge-${lastNodeId}-${newNodeId}`,
            source: lastNodeId,
            target: newNodeId,
            type: 'custom',
            data: {
              label: '接着'
            }
          });
        }
        
        lastNodeId = newNodeId;
        break;
        
      case 'paragraph':
        // 为段落创建节点
        nodes.push({
          id: newNodeId,
          type: 'custom',
          position: { x: 250, y: 100 + nodes.length * 150 },
          data: {
            label: item.text.substring(0, 30) + (item.text.length > 30 ? '...' : ''),
            description: item.text,
            type: 'typeB', // 段落使用绿色节点
            handleCounts: { top: 1, bottom: 1, left: 1, right: 1 },
            flipped: false
          }
        });
        
        // 如果有当前标题，连接到标题
        if (currentHeaderId) {
          edges.push({
            id: `edge-${currentHeaderId}-${newNodeId}`,
            source: currentHeaderId,
            target: newNodeId,
            type: 'custom',
            data: {
              label: '内容'
            }
          });
        } 
        // 否则连接到上一个节点
        else if (lastNodeId) {
          edges.push({
            id: `edge-${lastNodeId}-${newNodeId}`,
            source: lastNodeId,
            target: newNodeId,
            type: 'custom',
            data: {
              label: '接着'
            }
          });
        }
        
        lastNodeId = newNodeId;
        break;
    }
  });
  
  return { nodes, edges };
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 