/**
 * 商店结构与服务规则配置（非概率项）。
 */
export const SHOP_CONFIG = {
  route: {
    // 第 5 个节点（1-based）固定为商店
    fixedShopIndex: 4,
    // 总节点长度
    nodeCount: 10,
  },
  inventory: {
    cardOfferCount: 4,
    relicOfferCount: 3,
  },
  services: {
    purgeBaseCost: 75,
    upgradeBaseCost: 50,
    costIncreasePerUse: 25,
  },
};

