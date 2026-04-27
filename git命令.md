# 个人项目，一个人推送
## 进入项目根目录
git init
git add .
git commit -m "feat: 首次提交项目代码"

## 关联远程仓库 (请替换为你自己的 SSH 或 HTTPS 链接)
git remote add origin https://github.com/用户名/仓库名.git

## 强制命名主分支为 main 并推送
git branch -M main
git push -u origin main

## 日常推送
git add .
git commit -m "update: 修复了图片显示问题"
git push

## 修正历史（如抹除手机号）
git commit --amend --reset-author --no-edit
git push -f origin main  # 个人项目可以放心使用 -f 强制推送

# 团队协作开发（安全、规范）
## 成员首次接入项目
git clone https://github.com/用户名/仓库名.git
cd 仓库名

## 2. 标准开发流程（Feature Branch 工作流）
永远不要直接在 main 分支改代码。

### Step 1: 同步远程最新代码
git checkout main
git pull origin main

### Step 2: 创建并切换到自己的功能分支
git checkout -b feature-login-page

### Step 3: 编写代码并提交
git add .
git commit -m "feat: 增加登录页面逻辑"

### Step 4: 再次拉取远程 main，防止开发期间别人提交了新东西
git pull origin main

### Step 5: 推送自己的分支到远程
git push -u origin feature-login-page

# 合并代码
在 GitHub 网页端发起一个 Pull Request (PR)，请团队其他成员 Code Review（代码审查）后再合并入 main。