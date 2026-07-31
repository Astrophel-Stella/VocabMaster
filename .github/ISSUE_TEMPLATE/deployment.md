---
name: Deployment Confirmation
about: 部署确认（由流水线自动创建）
title: '🚀 部署确认 - '
labels: ['deployment-confirmation']
assignees: ['陈豪']
---

## 部署信息

- **分支**: master
- **提交**: {{COMMIT_SHA}}
- **时间**: {{DEPLOY_TIME}}
- **变更**: {{COMMIT_MESSAGE}}

## 变更内容

{{CHANGELOG}}

## ✅ 确认上线

回复 **"确认上线"** 开始自动部署。

回复 **"拒绝"** 取消部署。

---

## 自动化流程

```
用户确认 → 自动构建 → 自动部署 → 冒烟测试 → 报告结果
```

## 注意事项

- 部署过程约需5分钟
- 部署期间服务不会中断（滚动更新）
- 如果冒烟测试失败会自动回滚
