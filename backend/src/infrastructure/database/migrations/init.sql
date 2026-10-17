-- ============================================================
-- 慧宁甄选礼品商城（一期）建表脚本
-- 目标：MySQL 8.0+
-- 字符集：utf8mb4 / utf8mb4_unicode_ci
-- 对应 design.md 2.3.2，覆盖 19 张表 + 初始数据
-- ============================================================

CREATE DATABASE IF NOT EXISTS `huining_mall`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `huining_mall`;

-- ------------------------------------------------------------
-- 1. 分类表 category（对应 spec.md 6.1）
-- 四大一级分类：食品类礼品/节日礼品/水果礼品/雅趣伴手礼
-- 二级分类通过 parent_id 自关联
-- 后台标识 accompany 对外展示为「雅趣伴手礼」
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `category` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `parent_id`   BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '父分类ID，一级分类为NULL',
  `name`        VARCHAR(20) NOT NULL COMMENT '分类名称（C端展示名）',
  `code`        VARCHAR(32) NULL DEFAULT NULL COMMENT '分类编码（后台标识，如 accompany/food/festival/fresh）',
  `sort`        INT NOT NULL DEFAULT 0 COMMENT '排序值，小者靠前',
  `icon`        VARCHAR(255) NULL DEFAULT NULL COMMENT '分类图标URL（OSS）',
  `status`      TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0停用',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`  DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status_sort` (`status`, `sort`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- 四大一级分类初始化数据
INSERT INTO `category` (`id`, `parent_id`, `name`, `code`, `sort`, `status`) VALUES
  (1, NULL, '食品类礼品', 'food',     1, 1),
  (2, NULL, '节日礼品',   'festival', 2, 1),
  (3, NULL, '水果礼品',   'fresh',    3, 1),
  (4, NULL, '雅趣伴手礼', 'accompany', 4, 1);

-- ------------------------------------------------------------
-- 2. 商品 SPU 表 product（对应 spec.md 6.2）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `category_id`           BIGINT UNSIGNED NOT NULL COMMENT '所属分类ID',
  `title`                 VARCHAR(60) NOT NULL COMMENT '商品标题',
  `subtitle`              VARCHAR(100) NULL DEFAULT NULL COMMENT '副标题（搜索匹配）',
  `main_image`            VARCHAR(255) NOT NULL COMMENT '主图URL（OSS）',
  `images_json`           JSON NULL DEFAULT NULL COMMENT '轮播图URL数组',
  `detail_html`           MEDIUMTEXT NULL DEFAULT NULL COMMENT '商品详情富文本',
  `is_presale`            TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否预售：0否 1是',
  `presale_deliver_date`  DATE NULL DEFAULT NULL COMMENT '预计发货日期（is_presale=1时必填）',
  `status`                TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1在售 0下架',
  `sort`                  INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`            DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_status_sort` (`category_id`, `status`, `sort`),
  KEY `idx_is_presale` (`is_presale`),
  KEY `idx_presale_deliver` (`presale_deliver_date`),
  KEY `idx_status_sort` (`status`, `sort`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品SPU表';

-- ------------------------------------------------------------
-- 3. 商品 SKU 表 sku（对应 spec.md 6.3）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sku` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'SKU ID',
  `product_id`    BIGINT UNSIGNED NOT NULL COMMENT '所属商品ID',
  `spec_json`     JSON NOT NULL COMMENT '规格属性JSON',
  `price`         DECIMAL(10,2) NOT NULL COMMENT '销售价（元）',
  `market_price`  DECIMAL(10,2) NULL DEFAULT NULL COMMENT '划线价/市场参考价',
  `stock`         INT NOT NULL DEFAULT 0 COMMENT '库存数量',
  `sales`         INT NOT NULL DEFAULT 0 COMMENT '累计销量',
  `weight`        DECIMAL(10,2) NULL DEFAULT NULL COMMENT '重量（kg）',
  `unit`          VARCHAR(10) NULL DEFAULT NULL COMMENT '单位：件/盒/斤',
  `status`        TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1在售 0停售',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_sku_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品SKU表';

-- ------------------------------------------------------------
-- 4. 库存流水表 stock_log（对应 spec.md 6.4）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_log` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
  `sku_id`        BIGINT UNSIGNED NOT NULL COMMENT '关联SKU ID',
  `change_type`   VARCHAR(20) NOT NULL COMMENT '变更类型',
  `change_qty`    INT NOT NULL COMMENT '变更数量（正增负减）',
  `before_qty`    INT NOT NULL COMMENT '变更前库存',
  `after_qty`     INT NOT NULL COMMENT '变更后库存',
  `ref_order_no`  VARCHAR(32) NULL DEFAULT NULL COMMENT '关联订单号',
  `operator_id`   BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '操作人ID',
  `remark`        VARCHAR(200) NULL DEFAULT NULL COMMENT '备注',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_sku_id` (`sku_id`),
  KEY `idx_ref_order_no` (`ref_order_no`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_stock_log_sku` FOREIGN KEY (`sku_id`) REFERENCES `sku`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存流水表';

-- ------------------------------------------------------------
-- 5. 会员表 user（对应 spec.md 6.9）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会员ID',
  `openid`      VARCHAR(64) NOT NULL COMMENT '微信openid',
  `unionid`     VARCHAR(64) NULL DEFAULT NULL COMMENT '微信unionid',
  `phone`       VARCHAR(20) NULL DEFAULT NULL COMMENT '手机号',
  `nickname`    VARCHAR(64) NULL DEFAULT NULL COMMENT '昵称',
  `avatar`      VARCHAR(255) NULL DEFAULT NULL COMMENT '头像URL',
  `level`       INT NOT NULL DEFAULT 0 COMMENT '会员等级',
  `points`      INT NOT NULL DEFAULT 0 COMMENT '积分',
  `status`      TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1正常 0禁用',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`  DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_unionid` (`unionid`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员表';

-- ------------------------------------------------------------
-- 6. 收货地址表 address（对应 spec.md 6.10）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `address` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id`     BIGINT UNSIGNED NOT NULL COMMENT '会员ID',
  `name`        VARCHAR(20) NOT NULL COMMENT '收货人姓名',
  `phone`       VARCHAR(20) NOT NULL COMMENT '收货人手机号',
  `province`    VARCHAR(32) NOT NULL COMMENT '省',
  `city`        VARCHAR(32) NOT NULL COMMENT '市',
  `district`    VARCHAR(32) NOT NULL COMMENT '区',
  `detail`      VARCHAR(200) NOT NULL COMMENT '详细地址',
  `is_default`  TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`  DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_default` (`user_id`, `is_default`),
  CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收货地址表';

-- ------------------------------------------------------------
-- 7. 购物车表 cart（对应 spec.md 6.7）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '购物车项ID',
  `user_id`     BIGINT UNSIGNED NOT NULL COMMENT '会员ID',
  `sku_id`      BIGINT UNSIGNED NOT NULL COMMENT 'SKU ID',
  `qty`         INT NOT NULL DEFAULT 1 COMMENT '数量（上限99）',
  `checked`     TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否勾选',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_sku` (`user_id`, `sku_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`),
  CONSTRAINT `fk_cart_sku` FOREIGN KEY (`sku_id`) REFERENCES `sku`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- ------------------------------------------------------------
-- 8. 订单表 order（对应 spec.md 6.5）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no`              VARCHAR(32) NOT NULL COMMENT '订单号 HNZY+yyyyMMdd+6位随机',
  `user_id`               BIGINT UNSIGNED NOT NULL COMMENT '下单会员ID',
  `order_type`            VARCHAR(20) NOT NULL DEFAULT '零售单' COMMENT '订单类型',
  `total_amount`          DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
  `pay_amount`            DECIMAL(10,2) NOT NULL COMMENT '实付金额',
  `card_pay_amount`       DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '卡券支付金额（一期恒0）',
  `pay_status`            VARCHAR(20) NOT NULL DEFAULT '待支付' COMMENT '支付状态',
  `pay_type`              VARCHAR(20) NULL DEFAULT NULL COMMENT '支付方式',
  `pay_time`              DATETIME NULL DEFAULT NULL COMMENT '支付时间',
  `trade_no`              VARCHAR(64) NULL DEFAULT NULL COMMENT '微信交易号',
  `status`                VARCHAR(20) NOT NULL DEFAULT '待支付' COMMENT '订单状态',
  `receiver_name`         VARCHAR(20) NOT NULL COMMENT '收货人姓名（快照）',
  `receiver_phone`        VARCHAR(20) NOT NULL COMMENT '收货人手机号（快照）',
  `receiver_address`      VARCHAR(300) NOT NULL COMMENT '收货地址（快照）',
  `receiver_address_id`   BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '原地址ID',
  `remark`                VARCHAR(200) NULL DEFAULT NULL COMMENT '订单备注',
  `invoice_info_json`     JSON NULL DEFAULT NULL COMMENT '发票信息',
  `is_presale`            TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否预售单',
  `presale_deliver_date`  DATE NULL DEFAULT NULL COMMENT '预售预计发货日期',
  `logistics_company`     VARCHAR(32) NULL DEFAULT NULL COMMENT '物流公司',
  `logistics_track_no`    VARCHAR(64) NULL DEFAULT NULL COMMENT '物流运单号',
  `ship_time`             DATETIME NULL DEFAULT NULL COMMENT '发货时间',
  `confirm_time`          DATETIME NULL DEFAULT NULL COMMENT '确认收货时间',
  `finish_time`           DATETIME NULL DEFAULT NULL COMMENT '完成时间',
  `cancel_time`           DATETIME NULL DEFAULT NULL COMMENT '取消时间',
  `cancel_reason`         VARCHAR(100) NULL DEFAULT NULL COMMENT '取消原因',
  `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`            DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_status_created` (`user_id`, `status`, `created_at`),
  KEY `idx_status` (`status`),
  KEY `idx_pay_status` (`pay_status`),
  KEY `idx_trade_no` (`trade_no`),
  KEY `idx_presale_deliver` (`is_presale`, `presale_deliver_date`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ------------------------------------------------------------
-- 9. 订单明细表 order_item（对应 spec.md 6.6）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_item` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `order_id`      BIGINT UNSIGNED NOT NULL COMMENT '关联订单ID',
  `sku_id`        BIGINT UNSIGNED NOT NULL COMMENT '关联SKU ID',
  `product_id`    BIGINT UNSIGNED NOT NULL COMMENT '关联商品ID',
  `product_title` VARCHAR(60) NOT NULL COMMENT '商品标题快照',
  `product_image` VARCHAR(255) NULL DEFAULT NULL COMMENT '商品主图快照',
  `spec_json`     JSON NOT NULL COMMENT '规格快照',
  `price`         DECIMAL(10,2) NOT NULL COMMENT '下单时单价快照',
  `qty`           INT NOT NULL COMMENT '购买数量',
  `subtotal`      DECIMAL(10,2) NOT NULL COMMENT '小计金额',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_sku_id` (`sku_id`),
  CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`),
  CONSTRAINT `fk_item_sku` FOREIGN KEY (`sku_id`) REFERENCES `sku`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- ------------------------------------------------------------
-- 10. 退款表 refund（对应 spec.md 6.8）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `refund` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '退款ID',
  `order_id`      BIGINT UNSIGNED NOT NULL COMMENT '关联订单ID',
  `refund_no`     VARCHAR(32) NOT NULL COMMENT '退款单号',
  `amount`        DECIMAL(10,2) NOT NULL COMMENT '退款金额',
  `reason`        VARCHAR(200) NOT NULL COMMENT '退款原因',
  `status`        VARCHAR(20) NOT NULL DEFAULT '待审核' COMMENT '状态',
  `audit_remark`  VARCHAR(200) NULL DEFAULT NULL COMMENT '审核备注',
  `auditor_id`    BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '审核人ID',
  `wx_refund_no`  VARCHAR(64) NULL DEFAULT NULL COMMENT '微信退款单号',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `finished_at`   DATETIME NULL DEFAULT NULL COMMENT '完成时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_no` (`refund_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_refund_order` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款表';

-- ------------------------------------------------------------
-- 11. 节日日历表 festival（对应 spec.md 6.11）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `festival` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '节日ID',
  `name`          VARCHAR(20) NOT NULL COMMENT '节日名',
  `calendar_type` VARCHAR(10) NOT NULL DEFAULT '公历' COMMENT '历法类型：公历/农历',
  `month`         TINYINT NOT NULL COMMENT '月',
  `day`           TINYINT NOT NULL COMMENT '日',
  `prep_days`     INT NOT NULL DEFAULT 0 COMMENT '备货提前期（天）',
  `sale_start`    DATETIME NOT NULL COMMENT '销售开始时间',
  `sale_end`      DATETIME NOT NULL COMMENT '销售结束时间',
  `banner_image`  VARCHAR(255) NULL DEFAULT NULL COMMENT '节日Banner图URL',
  `link_url`      VARCHAR(255) NULL DEFAULT NULL COMMENT '专区链接',
  `status`        TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0停用',
  `is_online`     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '当前是否已上线',
  `sort`          INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`    DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort`),
  KEY `idx_is_online` (`is_online`),
  KEY `idx_sale_window` (`sale_start`, `sale_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节日日历表';

-- ------------------------------------------------------------
-- 12. Banner 表 banner（对应 spec.md 6.12）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `banner` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Banner ID',
  `position`    VARCHAR(32) NOT NULL COMMENT '展示位置',
  `title`       VARCHAR(60) NULL DEFAULT NULL COMMENT 'Banner标题',
  `image`       VARCHAR(255) NOT NULL COMMENT 'Banner图URL',
  `link_type`   VARCHAR(20) NOT NULL DEFAULT '无' COMMENT '链接类型',
  `link_value`  VARCHAR(255) NULL DEFAULT NULL COMMENT '链接值',
  `start_time`  DATETIME NOT NULL COMMENT '展示开始时间',
  `end_time`    DATETIME NOT NULL COMMENT '展示结束时间',
  `sort`        INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `status`      TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0停用',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`  DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_position_status_sort` (`position`, `status`, `sort`),
  KEY `idx_time_window` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Banner表';

-- ------------------------------------------------------------
-- 13. 精选推荐表 recommend
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recommend` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `product_id`  BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `sort`        INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `status`      TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0停用',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_id` (`product_id`),
  KEY `idx_status_sort` (`status`, `sort`),
  CONSTRAINT `fk_recommend_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='精选推荐表';

-- ------------------------------------------------------------
-- 14. 专题页表 topic
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `topic` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '专题ID',
  `title`       VARCHAR(60) NOT NULL COMMENT '专题标题',
  `banner`      VARCHAR(255) NULL DEFAULT NULL COMMENT '专题Banner',
  `product_ids` JSON NULL DEFAULT NULL COMMENT '关联商品ID数组',
  `status`      TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0停用',
  `sort`        INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`  DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专题页表';

-- ------------------------------------------------------------
-- 15. 搜索日志表 search_log（对应 spec.md 5.7.1 规则5）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `search_log` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `keyword`     VARCHAR(60) NOT NULL COMMENT '搜索关键词',
  `user_id`     BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '会员ID',
  `result_cnt`  INT NOT NULL DEFAULT 0 COMMENT '结果数量',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '搜索时间',
  PRIMARY KEY (`id`),
  KEY `idx_keyword` (`keyword`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索日志表';

-- ------------------------------------------------------------
-- 16. 后台管理员表 admin_user
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_user` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username`      VARCHAR(32) NOT NULL COMMENT '登录账号',
  `password`      VARCHAR(255) NOT NULL COMMENT '密码哈希（bcrypt）',
  `real_name`     VARCHAR(32) NULL DEFAULT NULL COMMENT '真实姓名',
  `phone`         VARCHAR(20) NULL DEFAULT NULL COMMENT '手机号',
  `status`        TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `last_login_at` DATETIME NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) NULL DEFAULT NULL COMMENT '最后登录IP',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`    DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台管理员表';

-- ------------------------------------------------------------
-- 17. 角色表 role + 菜单表 menu + 权限关联表（RBAC）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `name`        VARCHAR(32) NOT NULL COMMENT '角色名',
  `code`        VARCHAR(32) NOT NULL COMMENT '角色编码',
  `remark`      VARCHAR(200) NULL DEFAULT NULL COMMENT '备注',
  `status`      TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`  DATETIME NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

CREATE TABLE IF NOT EXISTS `menu` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  `parent_id`   BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '父菜单ID',
  `name`        VARCHAR(32) NOT NULL COMMENT '菜单名',
  `path`        VARCHAR(128) NULL DEFAULT NULL COMMENT '前端路由',
  `permission`  VARCHAR(64) NULL DEFAULT NULL COMMENT '权限标识',
  `icon`        VARCHAR(64) NULL DEFAULT NULL COMMENT '菜单图标',
  `sort`        INT NOT NULL DEFAULT 0 COMMENT '排序',
  `type`        TINYINT NOT NULL DEFAULT 1 COMMENT '类型：1菜单 2按钮',
  `visible`     TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可见',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单表';

CREATE TABLE IF NOT EXISTS `role_menu` (
  `role_id`     BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  `menu_id`     BIGINT UNSIGNED NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (`role_id`, `menu_id`),
  CONSTRAINT `fk_rm_role` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`),
  CONSTRAINT `fk_rm_menu` FOREIGN KEY (`menu_id`) REFERENCES `menu`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色菜单关联表';

CREATE TABLE IF NOT EXISTS `admin_role` (
  `admin_id`    BIGINT UNSIGNED NOT NULL COMMENT '管理员ID',
  `role_id`     BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`admin_id`, `role_id`),
  CONSTRAINT `fk_ar_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin_user`(`id`),
  CONSTRAINT `fk_ar_role` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员角色关联表';

-- ------------------------------------------------------------
-- 18. 审计日志表 audit_log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `operator_id`   BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(32) NULL DEFAULT NULL COMMENT '操作人姓名',
  `operator_type` VARCHAR(10) NOT NULL DEFAULT 'admin' COMMENT '操作人类型',
  `module`        VARCHAR(32) NOT NULL COMMENT '模块',
  `action`        VARCHAR(32) NOT NULL COMMENT '操作',
  `target_id`     VARCHAR(64) NULL DEFAULT NULL COMMENT '操作对象ID',
  `before_value`  JSON NULL DEFAULT NULL COMMENT '变更前值',
  `after_value`   JSON NULL DEFAULT NULL COMMENT '变更后值',
  `ip`            VARCHAR(45) NULL DEFAULT NULL COMMENT '操作IP',
  `user_agent`    VARCHAR(255) NULL DEFAULT NULL COMMENT 'User-Agent',
  `trace_id`      VARCHAR(64) NULL DEFAULT NULL COMMENT '链路ID',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_operator` (`operator_id`),
  KEY `idx_module_action` (`module`, `action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- ------------------------------------------------------------
-- 19. 系统参数表 sys_config（对应 spec.md 5.8.1 规则6）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sys_config` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `config_key`   VARCHAR(64) NOT NULL COMMENT '参数键',
  `config_value` VARCHAR(500) NOT NULL COMMENT '参数值',
  `config_type`  VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT '值类型',
  `remark`       VARCHAR(200) NULL DEFAULT NULL COMMENT '说明',
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统参数表';

-- 系统参数初始化
INSERT INTO `sys_config` (`config_key`, `config_value`, `config_type`, `remark`) VALUES
  ('pay_timeout_minutes', '30', 'number', '支付超时时间（分钟）'),
  ('after_sale_days', '7', 'number', '售后期天数'),
  ('address_limit', '20', 'number', '会员地址数量上限'),
  ('cart_qty_limit', '99', 'number', '购物车单SKU数量上限'),
  ('order_remark_limit', '200', 'number', '订单备注字数上限'),
  ('festival_check_interval', '60', 'number', '节日日历检查间隔（秒）'),
  ('logistics_cache_ttl', '1800', 'number', '物流轨迹缓存时长（秒）')
ON DUPLICATE KEY UPDATE `config_key` = VALUES(`config_key`);

-- ============================================================
-- 初始化超管账号（密码: admin123 的 bcrypt 哈希）
-- ============================================================
INSERT INTO `admin_user` (`id`, `username`, `password`, `real_name`, `status`) VALUES
  (1, 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MQDqo7Z3D1r4Z4Z4Z4Z4Z4Z4Z4Z4Z4', '超级管理员', 1)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

INSERT INTO `role` (`id`, `name`, `code`, `remark`, `status`) VALUES
  (1, '超级管理员', 'super_admin', '拥有全部权限', 1)
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `admin_role` (`admin_id`, `role_id`) VALUES
  (1, 1)
ON DUPLICATE KEY UPDATE `admin_id` = VALUES(`admin_id`);

-- ============================================================
-- 建表完成
-- ============================================================