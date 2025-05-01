import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PlaywrightCrawler } from 'crawlee';

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 健康检查端点
const healthCheck: RequestHandler = (req, res) => {
  res.json({ status: 'ok', message: 'Flowchart backend is running' });
};

app.get('/', healthCheck);

// 爬虫API端点
const crawlHandler: RequestHandler = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`开始爬取URL: ${url}`);
    
    // 存储爬取结果
    let crawlResult: any = null;
    
    // 创建爬虫
    const crawler = new PlaywrightCrawler({
      // 使用无头模式以支持动态页面
      headless: true,
      // 最大并发请求数
      maxRequestsPerCrawl: 1, // 限制只爬取一个页面
      // 爬取处理器
      async requestHandler({ page, request }) {
        console.log(`处理页面: ${request.url}`);
        
        // 等待页面加载完成
        await page.waitForLoadState('networkidle');
        
        // 提取页面主要文本内容
        const content = await page.evaluate(() => {
          // 尝试选择文章主体
          const articleElement = document.querySelector('article') || 
                               document.querySelector('main') || 
                               document.querySelector('.content') ||
                               document.querySelector('.article') ||
                               document.body;
          
          // 移除脚本、样式、导航等无关内容
          const elementsToRemove = articleElement.querySelectorAll('script, style, nav, header, footer, aside, iframe, .ads, .navigation, .menu, .sidebar');
          elementsToRemove.forEach(el => el.remove());
          
          // 获取清理后的文本
          return articleElement.textContent || '';
        });
        
        // 清理文本（移除多余空白）
        const cleanedContent = content
          .replace(/\s+/g, ' ')
          .trim();
        
        // 存储结果
        crawlResult = {
          url: request.url,
          title: await page.title(),
          content: cleanedContent
        };
      },
    });
    
    // 运行爬虫
    await crawler.run([url]);
    
    // 检查是否有结果
    if (!crawlResult) {
      return res.status(500).json({ error: 'Failed to crawl the URL' });
    }
    
    // 返回爬取结果
    res.json({
      url: crawlResult.url,
      title: crawlResult.title,
      content: crawlResult.content
    });
    
  } catch (error) {
    console.error('爬虫错误:', error);
    res.status(500).json({
      error: 'An error occurred while crawling',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

app.post('/api/crawl', crawlHandler);

// 内容处理API端点
const extractHandler: RequestHandler = (req, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    console.log(`处理内容: ${title || 'Untitled'}`);
    
    // 简单分割文本为段落
    const paragraphs = content
      .split(/\n+/)
      .filter((para: string) => para.trim().length > 20) // 过滤掉太短的段落
      .slice(0, 10); // 限制段落数量，避免图太大
    
    // 创建节点
    const nodes = paragraphs.map((paragraph: string, index: number) => ({
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
    const edges = paragraphs.slice(1).map((_: string, index: number) => ({
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
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

app.post('/api/extract', extractHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 