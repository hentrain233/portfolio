# Slay the Spire Cursor Test

一个以浏览器为载体的类杀戮尖塔卡牌 Roguelike 原型。  
核心目标是快速迭代玩法：战斗、路线、事件、商店、遗物、状态与诅咒系统都已做成可配置化结构。

## Play Online

- Repo: <https://github.com/hentrain233/slaythespire_cursorTest>
- Web: <https://hentrain233.github.io/slaythespire_cursorTest/>


## Gameplay Snapshot

- 回合制战斗：能量、抽牌、弃牌、消耗、增益/减益
- 路线推进：普通/事件/精英/商店/篝火/BOSS
- 事件分支：普通与稀有事件，含事件内特殊战斗
- 商店系统：买卡、买遗物、付费升级/删除
- 遗物系统：战斗开始、回合时机、战后结算触发
- Debug 工具：跳层、奖励池、资源注入

## Screenshots

可在这里放几张游戏截图（建议 3-5 张）：

- `docs/screenshots/battle.png`
- `docs/screenshots/shop.png`
- `docs/screenshots/events.png`

## Quick Start

本项目为静态前端，无需安装依赖：

1. 克隆仓库
2. 直接打开 `index.html`  
   或使用静态服务器（如 Live Server / `python -m http.server`）

## Balance & Content Tuning

推荐优先修改 `data/` 下文件：

- `data/card-config.js`：卡牌模板、升级条目、关键词参数
- `data/blessing-config.js`：祝福与遗物定义及数值
- `data/enemies.js`：敌人血量、行动、池子划分
- `data/eventDefs.js`：事件文案、选项、事件参数
- `data/probabilities.js`：概率、权重、价格区间
- `data/shopConfig.js`：商店库存和服务规则
- `data/tuning.js`：全局战斗与流程参数

## Project Structure

- `core/`：核心状态与流程编排
- `systems/`：战斗、敌人、事件、遗物等逻辑模块
- `data/`：可配置内容与平衡参数
- `ui/`：DOM 缓存、渲染与交互
- `docs/`：架构说明与迭代记录

## Roadmap

- 更多角色与起始牌组差异化
- 更多事件链与分支后果
- 更多敌人关键词与机制（如阶段转换、场地效果）
- 存档/读档与种子复现
- 移动端交互优化

## Changelog

- 新增商店节点与商品价格体系
- 新增多种遗物与事件可配置化结构
- 新增精英/普通/BOSS 池扩展（如石像鬼、宝箱怪）
- 增强 Debug 面板（遗物、金币、满血）

## Author

Wennan Zhang

