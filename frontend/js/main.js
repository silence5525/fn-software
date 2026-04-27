const urlParams = new URLSearchParams(window.location.search);
const mdPath = urlParams.get('path');

// 智能路径包装：自动识别 Windows (C:\) 和 Linux (/) 的绝对路径
function wrapImgUrl(content) {
    if (!content) return "";
    
    // 正则解释：匹配 ![alt](路径)
    // 路径部分适配：Windows 的 [a-zA-Z]:\ 或 Linux 的 / 开头
    const pathRegex = /!\[(.*?)\]\((([a-zA-Z]:\\|\/).*?)\)/g;
    
    return content.replace(pathRegex, (match, alt, fullPath) => {
        // 如果已经是代理路径了，就不再重复包装
        if (fullPath.includes('/api/view-abs-img')) return match;
        
        const proxyUrl = `/api/view-abs-img?absPath=${encodeURIComponent(fullPath)}`;
        return `![${alt}](${proxyUrl})`;
    });
}

// 还原路径：存盘时去掉代理，还原回纯净的绝对路径
function unwrapImgUrl(content) {
    if (!content) return "";
    return content.replace(/\/api\/view-abs-img\?absPath=(.*?)(?=\s|\)|$)/g, (match, encodedPath) => {
        return decodeURIComponent(encodedPath);
    });
}

const vditor = new Vditor('vditor', {
    height: window.innerHeight,
    cdn: './lib', // 确保 lib/dist 文件夹存在
    lang: 'zh_CN',
    mode: 'ir',
    upload: {
        url: '/api/upload-image',
        extraData: { currentMdPath: mdPath },
        fieldName: 'file',
        linkToImgUrl(url) {
            // 粘贴上传后立即包装路径用于 Web 预览
            return `/api/view-abs-img?absPath=${encodeURIComponent(url)}`;
        },
        format(files, responseText) {
            const res = JSON.parse(responseText);
            return JSON.stringify({
                code: 0,
                data: { errFiles: [], succMap: { [files[0].name]: res.data.url } }
            });
        }
    },
    input: (value) => {
        const pureContent = unwrapImgUrl(value);
        fetch('/api/save-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: mdPath, content: pureContent })
        });
    },
    after: () => {
        if (mdPath) {
            fetch(`/api/get-content?path=${encodeURIComponent(mdPath)}`)
                .then(res => res.json())
                .then(data => {
                    const previewContent = wrapImgUrl(data.content);
                    vditor.setValue(previewContent || "");
                });
        }
    }
});