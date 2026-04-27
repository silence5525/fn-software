const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

const upload = multer({ storage: multer.memoryStorage() });

// 接口：读取内容
app.get('/api/get-content', async (req, res) => {
    const filePath = req.query.path;
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ content });
    } catch (err) { res.status(500).json({ error: "Read Error" }); }
});

// 接口：保存内容
app.post('/api/save-content', async (req, res) => {
    const { path: filePath, content } = req.body;
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        res.json({ code: 0 });
    } catch (err) { res.status(500).json({ error: "Save Error" }); }
});

// 接口：上传图片 (自动适配系统路径)
app.post('/api/upload-image', upload.single('file'), async (req, res) => {
    const mdFilePath = req.body.currentMdPath;
    if (!mdFilePath) return res.status(400).json({ code: 1, msg: "Path missing" });

    const parentDir = path.dirname(mdFilePath);
    const photosDir = path.join(parentDir, 'photos');

    try {
        await fs.ensureDir(photosDir);
        const fileName = `img_${Date.now()}.png`;
        const absolutePath = path.join(photosDir, fileName); 
        
        await fs.writeFile(absolutePath, req.file.buffer);

        res.json({
            code: 0,
            data: { url: absolutePath }
        });
    } catch (err) { res.status(500).json({ code: 1, msg: err.message }); }
});

// 接口：万能图片预览代理 (核心：适配多平台绝对路径)
app.get('/api/view-abs-img', (req, res) => {
    const absPath = req.query.absPath;
    // 基础安全检查：确保文件存在
    if (absPath && fs.existsSync(absPath)) {
        res.sendFile(absPath);
    } else {
        res.status(404).send("Image Not Found");
    }
});

// 监听 0.0.0.0 确保局域网/NAS 可访问
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务已启动: http://localhost:${PORT}`);
    console.log(`当前运行平台: ${process.platform}`);
});