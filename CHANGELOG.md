# Changelog

## [0.1.6] - 2026-06-07

- 修复 GIF/视频转动态贴纸时被压缩重试裁短的问题：短视频会保留原始时长（最长 10 秒），压缩失败时不再静默截短。

## [0.1.5] - 2026-05-20

- 补充 SECURITY 安全说明和 Issue 模板，并完善 Release 附件。

## [0.1.4] - 2026-05-20

- 加入基础 CI、防泄密检查、Actions Node24 兼容设置和本地项目健康检查。

## [0.1.3] - 2026-05-20

- 补齐中英双语 README、统一部署说明，并加入本地 release helper。

All notable changes to this project are documented here.

## [0.1.2] - 2026-05-19

- 修复 Release workflow YAML，确保 tag 发布会自动用 CHANGELOG 生成 Release notes。

## [0.1.1] - 2026-05-19

- 维护版本发布流程：新增 CHANGELOG 与 Release Drafter；Docker 发布保留 latest、版本号和 sha 标签。
