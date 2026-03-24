/* eslint-disable max-len */
(function () {
  "use strict";

  var STORAGE_KEY = "portfolio-lang";

  var STRINGS = {
    zh: {
      "meta.title": "张文楠 Wennan Zhang — 个人网站",
      "meta.description": "张文楠 Wennan Zhang — 个人网站 · 游戏界面、动效与独立游戏开发。",
      "skip": "跳到主要内容",
      "nav.aria": "主导航",
      "lang.toggle": "EN",
      "lang.aria": "切换为英文",
      "nav.intro": "介绍",
      "nav.cards": "卡牌",
      "nav.beneath": "Beneath",
      "nav.blender": "Blender",
      "nav.rhino": "Rhino",
      "nav.ai": "AI 设计",
      "nav.ae": "AE",
      "nav.ui": "UI",
      "nav.story": "叙事",
      "nav.farm": "种田",
      "hero.label": "个人网站",
      "hero.role": "游戏 UI / 界面动效 · 数字媒体",
      "hero.edu": "约克大学（多伦多）数字媒体专业 · 2021 — 2026",
      "hero.lead":
        "广东深圳出生的胖小伙，有 9 年加拿大留学经历，对独立游戏制作与 UI/UX、动效与 vibecoding 充满兴趣。目前正在开发类《杀戮尖塔》的卡牌肉鸽网页游戏，并在 Unity 上开发 PC 端、类《星露谷》的独立游戏。在不断探索中自我迭代成长。",
      "hero.body":
        "熟悉 Figma、Illustrator、After Effects 等流程，具备 Unity UI 与虚幻引擎基础；善用 AIGC 与绘图工具辅助资产与界面迭代。英语可作为工作语言。以下为项目节选。",
      "hero.cta": "进入作品",
      "hero.photos.aria": "个人照片",
      "hero.photo1.alt": "户外近海与飞鸟背景下的肖像",
      "hero.photo2.alt": "屋顶露台眺望田园与远山",
      "workRoguelike.title": "类《杀戮尖塔》网页卡牌 Roguelike",
      "workRoguelike.sub": "基于 Cursor 的 vibe coding · 前端可运行原型",
      "workRoguelike.copy":
        "浏览器端卡牌 Roguelike：战斗、路线、事件、商店、遗物、增益与诅咒等系统，内容以 <code>data/</code> 为主的数据驱动结构，便于快速迭代与调参。",
      "workRoguelike.li1": "回合制战斗：能量、抽弃牌、关键词与状态效果",
      "workRoguelike.li2": "单局流程：路线节点、事件、商店、篝火、精英与首领",
      "workRoguelike.li3": "调试与数值入口，便于平衡性迭代",
      "workRoguelike.btnLocal": "嵌入本地版本",
      "workRoguelike.btnRemote": "加载 GitHub Pages",
      "workRoguelike.note": "若内嵌区域无法显示，请使用「在线试玩」或「GitHub Pages」在新窗口打开。",
      "workRoguelike.iframeTitle": "卡牌 Roguelike 游戏",
      "workRoguelike.linkGh": "GitHub 仓库",
      "workRoguelike.linkPlay": "在线试玩（新标签页）",
      "workRoguelike.linkLocal": "本地构建（新标签页）",
      "workBeneath.title": "《Beneath the Skin》团队游戏 · 美术与叙事支持",
      "workBeneath.sub": "角色头像 · 行走动画 · UI · 音效 · 叙事与界面",
      "workBeneath.copy":
        "在多次 Playtest 周期中负责对话头像与像素资源（Adobe Illustrator / Piskel）、Audacity 录制与混音、剧情与风味文本，以及安保与科学家等角色的行走 / 变形精灵动画；为《Beneath the Skin》制作循环 BGM，并推进对话框 UI、化学试管场景与怀疑值条等界面。",
      "workBeneath.audioLabel": "BGM · TFL-BUDDY（全站背景音乐，可暂停、拖动进度）",
      "workBeneath.linkItch": "itch.io 下载与介绍（Beneath the Skin）↗",
      "workBlender.title": "Blender 数码拼贴 · 赛博改造人（课程项目）",
      "workBlender.sub": "FA/VISA 3033 · Digital MeshUp · York University（含课程文档导出渲染图）",
      "workBlender.copy":
        "以《赛博朋克 2077》气质为参考，将下载的人体与机械零件进行布尔切割、雕刻与 Lattice / Mirror 修饰，使义体与躯干衔接更自然；为缺失材质的模型补金属材质，并拆分重组机械尾、勋章贴片等部件，最终完成灯光与渲染合成。",
      "workRhino.title": "Rhino · 机械打字机三维建模",
      "workRhino.sub": "FA/VISA 3033 · 3D 制造方向 · 课程终期项目",
      "workRhino.copy":
        "以收藏机械打字机为灵感，参考 Underwood 等经典机型，在 Rhino 中从零件到外壳逐件建模再拼装，注重参考线与圆角曲线的连续性；在解决 FilletEdge 导致的边缘错位与开放壳体问题时，通过 ExtractSrf、重建边缘与闭合曲面完成实体。",
      "workAdobe.title": "Adobe Illustrator · 矢量主稿",
      "workAdobe.sub": "Large2 · S · 界面与组件编排",
      "workAdobe.copy": "以 Illustrator 完成主视觉与组件编排：对齐网格、层级与描边系统。",
      "workAdobe.figcap": "Large2 · 主视觉预览",
      "workAdobe.source": "Illustrator 源文件",
      "workAe.title": "After Effects · 基础动效",
      "workAe.sub": "课程习作 · 影像与节奏",
      "workAe.copy": "After Effects 基础动画练习：图层、关键帧与时间轴节奏控制，输出为视频片段。",
      "workUi.title": "游戏 UI 组件与界面编排",
      "badge.wip": "施工中",
      "badge.wip.title": "素材整理中",
      "workUi.sub": "休闲向界面组件、关卡条与道具格等（完整素材尚未搬运至本站）",
      "workUi.copy": "该版块用于集中展示界面组件与视觉稿预览；目前仍在整理与迁移，后续会补充更多切片与交互说明。",
      "workUi.linkMore": "更多作品 · portfolio.ca/wennanzhang ↗",
      "workUi.hint": "外站访问可能需 VPN，视网络环境而定。",
      "workTw.title": "互动叙事 · TextureWriter",
      "workTw.sub": "课程作业 · 分支剧情与互动阅读",
      "workTw.copy": "使用 TextureWriter 搭建的互动叙事，支持多分支阅读体验，在浏览器中完成分支剧情与互动阅读。",
      "workTw.link": "在 TextureWriter 打开 ↗",
      "workTw.illustration.alt":
        "TextureWriter 互动小说阅读界面：浅米色背景、棕色正文与底部「重启」按钮",
      "workFarm.title": "类《星露谷》PC 独立游戏 · Unity",
      "badge.placeholder": "占位",
      "badge.placeholder.title": "开发中",
      "workFarm.sub": "种田与生活模拟向 · 素材与试玩尚未接入本站",
      "workFarm.copy":
        "Unity 开发的 PC 端项目，目标为轻松的农场经营与日常循环玩法。当前仍在制作与打磨阶段，后续会在此补充截图、视频或可玩构建链接。",
      "workFarm.placeholder.aria": "游戏预览占位",
      "workFarm.ph.hint": "预览区域 · 敬请期待",
      "footer": "© {year} 张文楠 Wennan Zhang",
    },
    en: {
      "meta.title": "Wennan Zhang — Personal Site",
      "meta.description":
        "Wennan Zhang — Personal site · game UI, motion design, and indie development.",
      "skip": "Skip to main content",
      "nav.aria": "Main navigation",
      "lang.toggle": "中文",
      "lang.aria": "Switch to Chinese",
      "nav.intro": "Intro",
      "nav.cards": "Cards",
      "nav.beneath": "Beneath",
      "nav.blender": "Blender",
      "nav.rhino": "Rhino",
      "nav.ai": "AI design",
      "nav.ae": "AE",
      "nav.ui": "UI",
      "nav.story": "Story",
      "nav.farm": "Farming",
      "hero.label": "Personal site",
      "hero.role": "Game UI / motion · Digital Media",
      "hero.edu": "Digital Media, York University (Toronto) · 2021 — 2026",
      "hero.lead":
        "From Shenzhen, Guangdong; nine years studying in Canada. Passionate about indie games, UI/UX, motion, and vibecoding. Building a Slay-the-Spire–style roguelike card game on the web and a Stardew-inspired farming / life sim on PC in Unity—learning and iterating as I go.",
      "hero.body":
        "Comfortable with Figma, Illustrator, After Effects, Unity UI, and basic Unreal; I use AIGC and drawing tools to iterate on assets and screens. English OK for work. Selected work below.",
      "hero.cta": "View work",
      "hero.photos.aria": "Personal photos",
      "hero.photo1.alt": "Portrait outdoors by the water with gulls",
      "hero.photo2.alt": "On a rooftop terrace overlooking fields and mountains",
      "workRoguelike.title": "Slay-the-Spire–style web roguelike deckbuilder",
      "workRoguelike.sub": "Cursor-assisted vibe coding · playable browser prototype",
      "workRoguelike.copy":
        "Browser roguelike deckbuilder: combat, map, events, shop, relics, buffs and curses. Data-driven around a <code>data/</code> folder for fast tuning.",
      "workRoguelike.li1": "Turn-based combat: energy, draw/discard, keywords and status effects",
      "workRoguelike.li2": "Runs: path nodes, events, shop, rest, elites and bosses",
      "workRoguelike.li3": "Debug and tuning hooks for balance passes",
      "workRoguelike.btnLocal": "Embed local build",
      "workRoguelike.btnRemote": "Load GitHub Pages",
      "workRoguelike.note": "If the embed fails, open the online demo or GitHub Pages in a new tab.",
      "workRoguelike.iframeTitle": "Roguelike card game",
      "workRoguelike.linkGh": "GitHub repo",
      "workRoguelike.linkPlay": "Play online (new tab)",
      "workRoguelike.linkLocal": "Local build (new tab)",
      "workBeneath.title": "Beneath the Skin — art, audio & narrative support",
      "workBeneath.sub": "Portraits · walk cycles · UI · SFX · story & screens",
      "workBeneath.copy":
        "Across playtests: dialogue portraits and pixel work (Illustrator / Piskel), Audacity recording and mix, flavour text, walk/transform animations for security and scientist characters; loop BGM for Beneath the Skin, plus dialogue UI, lab tube scene and suspicion bar.",
      "workBeneath.audioLabel": "BGM · TFL-BUDDY (site-wide loop — pause or scrub here)",
      "workBeneath.linkItch": "itch.io page & download ↗",
      "workBlender.title": "Blender digital collage · cybernetic figure (course)",
      "workBlender.sub": "FA/VISA 3033 · Digital MeshUp · York University",
      "workBlender.copy":
        "Cyberpunk 2077–inspired kitbash: Boolean cuts, sculpting, Lattice / Mirror on downloaded body and hard-surface parts; custom metal materials, tail and badge rebuilds, lighting and final comp.",
      "workRhino.title": "Rhino · mechanical typewriter (hard-surface)",
      "workRhino.sub": "FA/VISA 3033 · digital fabrication capstone",
      "workRhino.copy":
        "Inspired by collectible typewriters and classics like Underwood: part-by-part modelling in Rhino, clean curves and fillets; fixed FilletEdge issues with ExtractSrf, edge rebuilds and closed solids.",
      "workAdobe.title": "Adobe Illustrator · vector hero layouts",
      "workAdobe.sub": "Large2 · S · UI component layout",
      "workAdobe.copy": "Grid-aligned hero UI and component sheets in Illustrator—layers, strokes and hierarchy.",
      "workAdobe.figcap": "Large2 · hero preview",
      "workAdobe.source": "Illustrator source (.ai)",
      "workAe.title": "After Effects · motion basics",
      "workAe.sub": "Course exercise · timing and motion",
      "workAe.copy": "Layer animation, keyframes and timeline pacing—exported as short clips.",
      "workUi.title": "Game UI components & layout",
      "badge.wip": "WIP",
      "badge.wip.title": "Assets in progress",
      "workUi.sub": "Casual UI: level ribbons, goal panels, items (full set not migrated here yet)",
      "workUi.copy": "Component and mockup previews; more slices and notes will land here later.",
      "workUi.linkMore": "More work · portfolio.ca/wennanzhang ↗",
      "workUi.hint": "That site may need a VPN depending on your network.",
      "workTw.title": "Interactive fiction · TextureWriter",
      "workTw.sub": "Course work · branching narrative",
      "workTw.copy": "A branching story built in TextureWriter—read and choose in the browser.",
      "workTw.link": "Open in TextureWriter ↗",
      "workTw.illustration.alt":
        "TextureWriter interactive fiction screen: warm beige background, brown body text, Restart pill at the bottom",
      "workFarm.title": "Stardew-style PC farming sim · Unity",
      "badge.placeholder": "Placeholder",
      "badge.placeholder.title": "In development",
      "workFarm.sub": "Farming / life sim · no build or gallery on this site yet",
      "workFarm.copy":
        "Unity PC project aimed at chill farming loops and daily life rhythms. Screens, trailer and builds will be linked here when ready.",
      "workFarm.placeholder.aria": "Game preview placeholder",
      "workFarm.ph.hint": "Preview area · coming later",
      "footer": "© {year} Wennan Zhang",
    },
  };

  function getLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh") return stored;
    return "zh";
  }

  function setLang(code) {
    localStorage.setItem(STORAGE_KEY, code);
    applyLang(code);
  }

  function t(lang, key) {
    var pack = STRINGS[lang] || STRINGS.zh;
    return pack[key] != null ? pack[key] : key;
  }

  function applyLang(code) {
    var lang = code === "en" ? "en" : "zh";
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.body.classList.toggle("lang-en", lang === "en");

    var mt = document.querySelector('meta[name="description"]');
    if (mt) mt.setAttribute("content", t(lang, "meta.description"));
    document.title = t(lang, "meta.title");

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var val = t(lang, key);
      if (el.hasAttribute("data-i18n-html")) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (key) el.setAttribute("placeholder", t(lang, key));
    });

    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-alt");
      if (key) el.setAttribute("alt", t(lang, key));
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (key) el.setAttribute("aria-label", t(lang, key));
    });

    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      if (key) el.setAttribute("title", t(lang, key));
    });

    var year = new Date().getFullYear();
    document.querySelectorAll("[data-i18n-footer]").forEach(function (el) {
      el.textContent = t(lang, "footer").replace(/\{year\}/g, String(year));
    });

    var btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.setAttribute("aria-label", t(lang, "lang.aria"));
      var span = btn.querySelector(".lang-toggle__text");
      if (span) span.textContent = t(lang, "lang.toggle");
    }

    var gameFrame = document.getElementById("game-frame");
    if (gameFrame) {
      gameFrame.setAttribute("title", t(lang, "workRoguelike.iframeTitle"));
    }
  }

  window.getPortfolioLang = getLang;
  window.setPortfolioLang = setLang;
  window.applyPortfolioLang = applyLang;

  document.addEventListener("DOMContentLoaded", function () {
    applyLang(getLang());
    var btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        setLang(getLang() === "en" ? "zh" : "en");
      });
    }
  });
})();
