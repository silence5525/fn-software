const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const app = express();

// 1. 基础配置：允许大文件上传（防止大图粘贴失败）
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. 静态资源托管：托管前端页面和本地化的 Vditor 库
// 确保你的前端文件在 ../frontend 目录下
app.use(express.static(path.join(__dirname, '../frontend')));

// 配置 multer 内存存储
const upload = multer({ storage: multer.memoryStorage() });

// --- 接口部分 ---

// 1. 读取 MD 文件内容
app.get('/api/get-content', async (req, res) => {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: "未提供路径" });
    
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ content });
    } catch (err) {
        console.error("读取失败:", err);
        res.status(500).json({ error: "读取文件失败" });
    }
});

// 2. 保存 MD 文件内容（实时保存）
app.post('/api/save-content', async (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: "保存路径缺失" });

    try {
        await fs.writeFile(filePath, content, 'utf-8');
        res.json({ code: 0, msg: "保存成功" });
    } catch (err) {
        console.error("保存失败:", err);
        res.status(500).json({ error: "保存失败" });
    }
});

// 3. 核心：处理图片粘贴上传
app.post('/api/upload-image', upload.single('file'), async (req, res) => {
    const mdFilePath = req.body.currentMdPath;
    if (!mdFilePath || !req.file) return res.status(400).json({ code: 1, msg: "数据缺失" });

    const parentDir = path.dirname(mdFilePath);
    const photosDir = path.join(parentDir, 'photos');

    try {
        await fs.ensureDir(photosDir);
        const fileName = `img_${Date.now()}.png`;
        const destPath = path.join(photosDir, fileName);
        await fs.writeFile(destPath, req.file.buffer);

        // --- 关键修正点 ---
        res.json({
            code: 0,
            msg: "Success",
            data: {
                // 这个 err 字段必须是空字符串，url 必须是可访问的路径
                errFiles: [], 
                // Vditor 会把这个 url 直接填入 Markdown 里的 ![]() 中
                url: `/api/view-img?path=${encodeURIComponent(mdFilePath)}&name=${fileName}`
            }
        });
    } catch (err) {
        res.status(500).json({ code: 1, msg: err.message });
    }
});

// 4. 图片预览代理：让编辑器能读取硬盘任意位置的 photos 文件夹
app.get('/api/view-img', (req, res) => {
    const mdPath = req.query.path;
    const imgName = req.query.name;
    if (!mdPath || !imgName) return res.status(400).send("参数不足");

    const imgRealPath = path.join(path.dirname(mdPath), 'photos', imgName);
    
    // 检查文件是否存在
    if (fs.existsSync(imgRealPath)) {
        res.sendFile(imgRealPath);
    } else {
        res.status(404).send("图片未找到");
    }
});

// --- 启动服务 ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`--------------------------------------`);
    console.log(`Markdown 编辑器后端已启动!`);
    console.log(`本地测试地址: http://localhost:${PORT}/?path=YOUR_MD_FILE_PATH`);
    console.log(`--------------------------------------`);
});