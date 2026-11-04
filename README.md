# Mew Key · DSH 插件 v0.1.2

> **给正在工作的 Agent 按一下喵键。**

专门为 **DeepSeek Harness Web (DSH)** 编写的可安装 Cordis Bundle 插件，带有独立的浏览器 UI。不是 Angelus 插件，也不是纯 HTML Demo。

## 功能

- 输入框右下角发送按钮正上方出现 **单猫爪圆形按钮**；点击弹出紧凑控制面板，不再占用会话标题栏。
- **温和插话（默认）**：使用官方 `session/prompt` 的 `mode: 'steer'`，下一次模型步骤尝试「喵一下，再继续原任务」。不终止正在运行的工具。
- **立即中断**：官方 `session/cancel`（保留等待中的普通输入） → `session/wait` 等待空闲 → `session/prompt` 发起新的喵叫轮次。不会擅自自动恢复原任务。
- 请求当前工作语言下的一声猫叫；中文「喵。」、英文「Meow.」、日语「にゃー。」等。最终自然语言由模型决定，**并非确定性字符串输出**。
- 在客户端权限不足时隐藏触发按钮或禁用中断选项；所有操作只针对当前会话。
- 支持 Escape / 点击面板外部关闭、执行中防止重复触发、动画减少偏好、移动端窄屏布局。

## 安装（推荐 DSH 0.2.x）

本包已经包含编译好的 `lib/client.js`，安装时**不需要额外构建**。

1. 解压 `dsh-mew-key.zip` 到你希望保留的路径（例如 `~/dsh-plugins/dsh-mew-key/`）。
2. 用绝对路径安装：

   ```bash
   dsh plugin --profile web add file:/absolute/path/to/dsh-mew-key
   ```

   如果从 DSH 仓库源码启动，也可以用 `pnpm dsh plugin --profile web add ...`。

3. 重新启动 DSH Web profile（插件 Host/Client 引导图在启动时装配）：

   ```bash
   dsh web
   ```

4. 打开某个普通 Session，在输入框右侧发送按钮正上方找到 **猫爪按钮**，点击后选择模式并按下喵键。

5. 卸载：

   ```bash
   dsh plugin --profile web remove dsh-mew-key
   ```

也可以将 `cordis.patch.yml` 作为配置层使用。此包自带 `dsh.bundle.patch` 声明，安装到 profile 时会自动插入 `mew-key` Cordis 插件行。

## 使用边界

- **温和插话不是强制抢占：** 如果 Agent 正在执行一个长时间阻塞的工具，`steer` 要等到后续模型步骤才会被处理。
- **立即中断不是无损暂停：** `cancel` 会中止活跃轮次，可能使当前工具操作被取消。**不自动恢复之前的任务**；后续是否重试由用户决定。
- **不会保证只有一个词：** 文本要求由模型执行，模型有可能不服从或额外输出。若需要确定性「喵」，应由 UI 自行输出，而不是调用模型。
- **无法保证子进程立即退出：** DSH 取消操作是运行时请求；已启动的外部工具能否立即终止取决于工具取消机制。
- **没有偷偷操作其他 Session：** 每个 UI 槽的回调固定绑定当前 `sessionId`。

## 源码与结构

```text
 dsh-mew-key/
 ├── package.json          # DSH bundle + browser client manifest
 ├── cordis.patch.yml      # Cordis 插入项
 ├── index.js              # Node Host 半部：无状态入口
 ├── lib/client.js         # 可直接装载的编译版客户端
 ├── src/client.tsx        # React TSX 源码 / UI + 操作逻辑
 ├── build.mjs             # 重新编译
 ├── preview.html          # v0.1.1 旧版静态预览；不反映 v0.1.2 新位置
 └── tests/bridge.test.mjs # 模拟 Remote 的桥接行为测试
```

开发时有 TypeScript 的情况下：

```bash
npm run build   # 需 Node 能解析 'typescript'
npm test        # 只用 Node 标准库
```

在没有依赖安装权限的环境里，`lib/client.js` 已随包交付。`build.mjs` 只做 TSX→CommonJS 编译，不做完整的 DSH 型别检查或浏览器集成测试。

## 已验证与未验证

- ✅ 已按照 DSH 官方公开 `ctx.slots.inject`、`ctx.remote.session.cancel/wait/prompt` 接口实现。
- ✅ 8 个测试通过（Remote 行为与依赖声明；尚无真实 Web E2E）。
- ✅ TSX 语法编译、JS 语法检查通过。
- ⚠️ 当前环境不能启动真实 DSH Web，**尚未进行真实浏览器 E2E、版本兼容性实机测试**。如果目标 DSH 使用了不同的客户端模块格式或 Slot API，需要按该版本微调。

## 参考接口

- https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/slots
- https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/core
- https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/types.ts
- https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/

MIT · Mew Key v0.1.2


## v0.1.1 修复说明

修复点击 Mew Key 后出现 `cannot get property "remote" without inject` 的问题：

- Client Cordis 插件明确声明 `inject = ["slots", "remote", "remote.session"]`。
- `dsh.client.inject` 增加 `@deepseek-ai/dsh-api-remotes`，确保 Browser 插件依赖装载链完整。
- 增加严格依赖访问模拟测试：模拟 Cordis 拒绝读取未声明的父服务。

如果是从 v0.1.0 升级，推荐移除旧插件、重新添加 v0.1.1，**并重启 DSH Web**，避免继续使用缓存中的旧客户端代码。

此修复针对已定位的 Cordis 注入异常；尚未在真实 DSH Web 实例中验证所有会话操作。


## v0.1.2 UI 调整

- Slot 从 `conversation.session.header.actions` 切换到 `conversation.input.overlay`。
- 发送按钮上方添加纯猫爪图标的圆形浮动按钮（无文字标签，保留 tooltip）。
- 弹出层改为小型浮层，保留原有温和插话与立即中断行为。
- 提供的 `lib/client.js` 已重新编译；应用补丁后无需安装额外 TypeScript 依赖，重启 `dsh web` 即可。
- `preview.html` 暂未更新，仍是旧版的静态预览；以 DSH 实际界面为准。
