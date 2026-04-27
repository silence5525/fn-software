// 1. 获取 URL 中的 path 参数
const urlParams = new URLSearchParams(window.location.search);
const mdPath = urlParams.get('path'); 

// 2. 初始化 Vditor
const vditor = new Vditor('vditor', {
    height: window.innerHeight,
    // 修正：去掉最后的 /dist，因为 Vditor 会自动补上它
    cdn: './lib', 
    lang: 'zh_CN',
    mode: 'ir',
    cache: { enable: false },
    upload: {
        url: '/api/upload-image',
        extraData: { currentMdPath: mdPath },
        fieldName: 'file',
        // 确保这个函数能正确解析后端返回的 URL
        format(files, responseText) {
            const res = JSON.parse(responseText);
            if (res.code !== 0) {
                alert("上传失败：" + res.msg);
                return JSON.stringify({ msg: res.msg, code: 1 });
            }
            // Vditor 期望的返回格式
            return JSON.stringify({
                code: 0,
                data: { errFiles: [], succMap: { [files[0].name]: res.data.url } }
            });
        }
    },
    input: (value) => {
        // 自动保存逻辑
        if (mdPath) {
            fetch('/api/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: mdPath, content: value })
            });
        }
    },
    after: () => {
        if (mdPath) {
            fetch(`/api/get-content?path=${encodeURIComponent(mdPath)}`)
                .then(res => res.json())
                .then(data => {
                    vditor.setValue(data.content || "");
                });
        }
    }
});