# Changelog

## 2.0.13 - 2026-05-14

### Fixed

- 修复 SSR/Node 环境导入时访问 `navigator` 导致异常的问题。
- 修复 CommonJS 入口在 `"type": "module"` 下 `require()` 返回空对象的问题，新增 `dist/index.cjs` 作为 CJS 产物。
- 修复 `options` 类型与默认值行为不一致的问题，`interval`、`loopSeries`、`seriesIndex` 现在均可选。
- 修复空数据 series 可能导致 `dataIndex` 变为 `NaN` 的问题。
- 修复 `clearLoop()` 后仍可通过 `resume()` 重启轮播的问题。
- 修复 `bounce` 回调向外传递的 `seriesIndex` 和 `dataIndex` 不正确的问题。
- 修复单个 series 对象配置下，鼠标 hover 不触发 `bounce` 回调的问题。
- 修复 `updateData` 替换 series 后轮播仍读取旧 series 引用的问题。
- 统一压缩版与非压缩版 UMD 产物的全局变量名为 `EChartsTool`。
- 修复 README 示例中的错误变量名和 npm badge 链接。

### Added

- 添加基于 Node 内置 `node:test` 的测试用例，覆盖导入入口、默认配置、空数据、清理行为、单 series hover 和动态更新数据等场景。
