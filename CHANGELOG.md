# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与[语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.5] - 2026-11-04

### 变更

- 提示词从「说一声猫叫」改为「用软软的撒娇猫腔」：`喵～` / `喵呜～` / `Meow~` / `にゃーん`，最多一个猫 emoji，明确要求温暖、略带撒娇、不要机械生硬。
- 明确限制两行以内、不要列表/小标题/舞台说明，避免卖萌把任务带跑；原有护栏（不改变计划、笔记、文件和工具）保留。
- 中断模式同步换成可爱语气，并附带一句「刚才在忙什么」。
- 按钮成功气泡改为「喵～ 已插话：下一步会撒娇一声。」
- `preview.html` 的示例回复同步换成撒娇版。

### 测试

- 新增断言：两种提示词都包含可爱语气标记，且旧版「At your next safe model step」不再出现。

## [0.1.4] - 2026-11-04

### 变更

- Slot 从 `conversation.input.overlay`（浮层）改为 `conversation.input.right`（composer 工具栏内联列表槽），猫爪成为**流内元素**，不再遮挡队列卡片、工具条图标或发送键。
- 位置：模型选择器左侧、与发送键同一行；按钮缩至 28px 以贴合工具条高度。
- 结果气泡改为相对按钮绝对定位向上弹出，不再依赖 overlay 容器几何。
- 移除整套「测量发送键坐标后绝对定位」的逻辑。

### 修复

- `package.json` 的 `exports` 补上 `./lib/client.js`，避免按真实路径加载客户端时触发 `ERR_PACKAGE_PATH_NOT_EXPORTED`。
- 移除与媒体查询冲突的重复行内定位样式。

### 测试

- 新增断言：源码与产物都注册到 `conversation.input.right`，且不再引用 overlay 槽。

### 说明

- 模型与发送键之间只有 `conversation.input.activity`，那是单占位槽（活动指示器展开专用），占用会与内置活动控件冲突，因此猫爪落在模型选择器左侧。
- 核实客户端 Session 的提交回声逻辑为 `running ? (mode==='steer' ? 'steering' : 'queued') : 'transcript'`，即空闲时 `steer` 等价于普通新消息，不会因「无轮次可插」被拒。

## [0.1.3] - 2026-11-04

### 变更

- 删除弹出面板与模式选择：单击猫爪即按「温和插话」投递。
- 增加 `Shift+点击`（键盘 `Shift+Enter`）直接走「取消 → 等待空闲 → 喵」，无需打开任何 UI。
- 提示词改为「喵一声 + 用一句话说明正在做什么」。
- 结果反馈从面板内文案改为按钮上方 2.8 秒自动消失的气泡。
- `preview.html` 重写为一键版静态预览。

### 测试

- 新增：提示词含进度说明；用桩 React 渲染组件，验证只有一个按钮、单击走 gentle、Shift 走 interrupt。

## [0.1.2] - 2026-11-03

### 变更

- Slot 从 `conversation.session.header.actions` 切换到 `conversation.input.overlay`。
- 发送按钮上方添加纯猫爪图标的圆形浮动按钮，保留 tooltip。
- 弹出层改为小型浮层，保留温和插话与立即中断两种行为。

## [0.1.1] - 2026-11-03

### 修复

- 修复点击 Mew Key 后出现 `cannot get property "remote" without inject` 的问题：客户端 Cordis 插件明确声明 `inject = ["slots", "remote", "remote.session"]`。
- `dsh.client.inject` 增加 `@deepseek-ai/dsh-api-remotes`，确保 Browser 插件依赖装载链完整。

### 测试

- 增加严格依赖访问模拟测试：模拟 Cordis 拒绝读取未声明的父服务。

## [0.1.0] - 2026-11-03

### 新增

- 首个可安装版本：会话标题栏上的 Mew Key 入口，支持温和插话与立即中断两种模式，附带独立浏览器 UI。
