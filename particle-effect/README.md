# Particle Effect

一个基于 `React + TypeScript + Vite + PixiJS` 的图片粒子效果项目，支持：

- 图片上传后重新采样为粒子
- 鼠标靠近时对粒子产生排斥交互
- 上传音频后驱动粒子抖动与高亮闪烁
- 通过设置面板和音频调试面板实时调参

## 启动方式

安装依赖：

```bash
npm install
```

开发模式：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

本地预览：

```bash
npm run preview
```

## 交互说明

- `SETTING` 面板：负责基础粒子参数和图片上传
- `AUDIO` 面板：负责音频上传、播放控制、频谱查看和音频联动参数调节
- `Upload Image`：上传自定义图片替代默认素材
- `Reload Image`：重新按当前采样参数生成粒子
- `Use Default`：恢复为默认图片
- `Upload Audio`：导入音频文件并驱动粒子动态效果

## 参数总览

项目里的可调参数主要分为三类：

- 基础粒子参数：控制采样密度、回弹、阻尼、鼠标交互和尺寸
- 音频驱动参数：控制低中高频对粒子抖动的影响
- 高亮闪烁参数：控制音频脉冲触发的亮点效果

## 基础粒子参数

### `gap`

- 默认值：`5`
- 调整范围：`2 ~ 8`
- 作用：控制图片采样间距
- 调参效果：
  - 值越小，粒子越密，图像细节越完整
  - 值越大，粒子越疏，性能负担越小

### `imageScale`

- 默认值：`0.9`
- 调整范围：`0.4 ~ 1.2`
- 作用：控制采样图像在画面中的整体大小
- 调参效果：
  - 值越大，图像占据区域越大
  - 值越小，画面更留白

### `mouseRadius`

- 默认值：`88`
- 调整范围：`40 ~ 180`
- 作用：控制鼠标对粒子的影响半径
- 调参效果：
  - 值越大，鼠标靠近时受影响的粒子范围越广
  - 值越小，交互更集中

### `stiffness`

- 默认值：`0.001`
- 调整范围：`0.001 ~ 0.04`
- 作用：控制粒子回到原位的拉回力度
- 调参效果：
  - 值越大，回弹越快，画面更紧
  - 值越小，回位更慢，更柔和

### `damping`

- 默认值：`0.96`
- 调整范围：`0.5 ~ 0.99`
- 作用：控制粒子速度衰减速度
- 调参效果：
  - 值越高，拖尾更明显，运动更绵
  - 值越低，速度衰减更快，动作更干脆

### `jitterStrength`

- 默认值：`0.3`
- 调整范围：`0 ~ 1.2`
- 作用：控制没有明显音频驱动时的基础随机抖动
- 调参效果：
  - 值越大，静态时也更活跃
  - 值越小，待机状态更稳定

### `particleSize`

- 默认值：`1.2`
- 调整范围：`1 ~ 4`
- 作用：控制粒子的可视尺寸
- 调参效果：
  - 值越大，视觉更亮更饱满
  - 值越小，画面更细腻轻盈

### `repelStrength`

- 默认值：`1`
- 调整范围：`0.2 ~ 4`
- 作用：控制鼠标排斥粒子的力度
- 调参效果：
  - 值越大，鼠标拨开的效果越强
  - 值越小，交互更温和

## 音频驱动参数

### `bassJitterGain`

- 默认值：`1`
- 调整范围：`0 ~ 3`
- 作用：控制低频对粒子抖动的影响权重
- 建议：适合做整体震感和节奏起伏

### `midJitterGain`

- 默认值：`0.6`
- 调整范围：`0 ~ 3`
- 作用：控制中频对粒子抖动的影响权重
- 建议：适合补充主体律动，让画面更均衡

### `trebleJitterGain`

- 默认值：`0.35`
- 调整范围：`0 ~ 3`
- 作用：控制高频对粒子抖动的影响权重
- 建议：适合制造更细碎、更跳动的动态细节

### `audioCurveStrength`

- 默认值：`1`
- 调整范围：`0 ~ 4`
- 作用：控制音频映射结果对粒子抖动的整体放大强度
- 调参效果：
  - 值越大，音频反应越明显
  - 值越小，音频变化更克制

### `audioCurveCenter`

- 默认值：`0.5`
- 调整范围：`0 ~ 1`
- 作用：控制音频映射曲线的响应中心
- 调参效果：
  - 值越低，较小音量也容易触发明显变化
  - 值越高，需要更强音频输入才会显著响应

### `audioCurveSlope`

- 默认值：`6`
- 调整范围：`1 ~ 20`
- 作用：控制音频映射曲线的陡峭程度
- 调参效果：
  - 值越高，响应更像阈值开关
  - 值越低，响应更平滑连续

## 高亮闪烁参数

### `highlightPulseThreshold`

- 默认值：`0.05`
- 调整范围：`0.01 ~ 0.5`
- 作用：控制高亮闪烁的触发阈值
- 触发逻辑：当加权音频输入的正向变化量超过该值时，触发一次高亮

### `highlightPulseDecay`

- 默认值：`0.86`
- 调整范围：`0.5 ~ 0.99`
- 作用：控制高亮从峰值回落的速度
- 调参效果：
  - 值越高，闪烁拖尾更长
  - 值越低，闪烁更利落

### `highlightFlashRatio`

- 默认值：`0.01`
- 调整范围：`0.01 ~ 0.3`
- 作用：控制每次闪烁时被点亮的粒子比例
- 调参效果：
  - 值越大，亮点越多，冲击感更强
  - 值越小，亮点更克制，层次更清晰

## 参数之间的关系

### 1. 粒子实际抖动强度

粒子最终的动态强度并不只由 `jitterStrength` 决定，还会叠加映射后的低、中、高频权重。

可以简单理解为：

```text
实际抖动强度
= 基础抖动
+ 低频贡献
+ 中频贡献
+ 高频贡献
```

如果想增强音乐律动感，优先调整：

- `bassJitterGain`
- `midJitterGain`
- `trebleJitterGain`
- `audioCurveStrength`

### 2. 高亮触发逻辑

高亮效果依赖三个值：

- `weightedInput`：低中高频按权重合成后的输入值
- `weightedDelta`：当前输入相较上一帧的正向变化量
- `highlightPulse`：高亮强度，触发后从 `1` 逐帧衰减

这意味着：

- 持续稳定的音量不一定频繁爆闪
- 突然增强的节拍更容易触发高亮

### 3. 视觉密度与性能关系

下列参数对性能和画面复杂度影响最明显：

- `gap`
- `imageScale`
- `particleSize`
- `highlightFlashRatio`

如果画面卡顿，优先尝试：

- 适当增大 `gap`
- 降低 `imageScale`
- 降低 `highlightFlashRatio`

## 推荐调参方向

### 1. 想要更清晰的图像轮廓

- 先减小 `gap`
- 再微调 `particleSize`
- 如有必要，适当降低 `imageScale`

### 2. 想要更柔和的漂浮感

- 降低 `stiffness`
- 提高 `damping`
- 适当降低 `repelStrength`

### 3. 想要更强的音乐律动

- 提高 `bassJitterGain`
- 提高 `audioCurveStrength`
- 视情况降低 `audioCurveCenter`

### 4. 想要更明显的闪烁爆点

- 降低 `highlightPulseThreshold`
- 提高 `highlightFlashRatio`
- 提高 `highlightPulseDecay`

### 5. 想让画面更安静克制

- 降低 `jitterStrength`
- 降低三段 `Gain`
- 适当降低 `highlightFlashRatio`

## 默认参数一览

```text
gap = 5
imageScale = 0.9
mouseRadius = 88
stiffness = 0.001
damping = 0.96
jitterStrength = 0.3
bassJitterGain = 1
midJitterGain = 0.6
trebleJitterGain = 0.35
audioCurveStrength = 1
audioCurveCenter = 0.5
audioCurveSlope = 6
highlightPulseThreshold = 0.05
highlightPulseDecay = 0.86
highlightFlashRatio = 0.01
particleSize = 1.2
repelStrength = 1
```

## 部署

项目已支持 Vercel 静态部署，仓库根目录包含 `vercel.json`。

如果需要部署到 Vercel：

- 导入仓库
- 保持默认 Node 环境
- 构建命令使用 `npm run build`
- 输出目录使用 `dist`

## 技术栈

- React
- TypeScript
- Vite
- PixiJS
