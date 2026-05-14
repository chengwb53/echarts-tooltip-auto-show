/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, test } from 'node:test';

const moduleUrl = new URL('../dist/index.js', import.meta.url);
const originalGlobals = new Map();

function saveGlobal(name) {
  if (!originalGlobals.has(name)) {
    originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  }
}

function setGlobal(name, value) {
  saveGlobal(name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
    writable: true,
  });
}

function deleteGlobal(name) {
  saveGlobal(name);
  Reflect.deleteProperty(globalThis, name);
}

function restoreGlobals() {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor);
    } else {
      Reflect.deleteProperty(globalThis, name);
    }
  }

  originalGlobals.clear();
}

function freshImport(name) {
  return import(`${moduleUrl.href}?test=${name}-${Date.now()}-${Math.random()}`);
}

function createEventTarget() {
  const handlers = new Map();

  return {
    handlers,
    off(event, handler) {
      handlers.get(event)?.delete(handler);
    },
    on(event, handler) {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }

      handlers.get(event).add(handler);
    },
    trigger(event, payload) {
      for (const handler of handlers.get(event) ?? []) {
        handler(payload);
      }
    },
  };
}

function createChartMock() {
  const dom = {};
  const chartTarget = createEventTarget();
  const zRenderTarget = createEventTarget();
  const dispatches = [];
  const setOptionCalls = [];

  const zRender = {
    off: zRenderTarget.off,
    on: zRenderTarget.on,
  };

  const chart = {
    dispatchAction(action) {
      dispatches.push({ ...action });
    },
    getDom() {
      return dom;
    },
    getZr() {
      return zRender;
    },
    off: chartTarget.off,
    on: chartTarget.on,
    setOption(option) {
      setOptionCalls.push(option);
    },
  };

  return {
    chart,
    chartTarget,
    dispatches,
    dom,
    setOptionCalls,
    zRenderTarget,
  };
}

function setupBrowserEnv() {
  const intervals = [];
  const clearedIntervals = [];

  setGlobal('document', {
    documentElement: {
      contains() {
        return true;
      },
    },
  });
  setGlobal('navigator', {
    language: 'zh-CN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  });
  setGlobal('setTimeout', (handler) => {
    handler();
    return 1;
  });
  setGlobal('clearInterval', (id) => {
    clearedIntervals.push(id);
  });
  setGlobal('window', {
    setInterval(handler, interval) {
      intervals.push({ handler, interval });
      return intervals.length;
    },
  });

  return {
    clearedIntervals,
    intervals,
  };
}

afterEach(() => {
  restoreGlobals();
});

test('ESM 入口在无浏览器全局变量时可以导入', async () => {
  deleteGlobal('document');
  deleteGlobal('window');

  const mod = await freshImport('ssr-import');

  assert.equal(typeof mod.loopShowTooltip, 'function');
});

test('CommonJS 产物导出 loopShowTooltip', () => {
  const require = createRequire(import.meta.url);
  const mod = require('../dist/index.cjs');

  assert.equal(typeof mod.loopShowTooltip, 'function');
});

test('默认配置会立即显示首个 tooltip 并启动默认间隔', async () => {
  const env = setupBrowserEnv();
  const { chart, dispatches } = createChartMock();
  const { loopShowTooltip } = await freshImport('default-options');

  const result = loopShowTooltip(chart, {
    series: [{
      data: [10, 20],
      type: 'bar',
    }],
  });

  assert.equal(typeof result?.clearLoop, 'function');
  assert.equal(env.intervals.length, 1);
  assert.equal(env.intervals[0].interval, 2000);
  assert.deepEqual(dispatches.map(item => item.type), ['hideTip', 'showTip']);
  assert.equal(dispatches[1].seriesIndex, 0);
  assert.equal(dispatches[1].dataIndex, 0);
});

test('空数据 series 不会产生 NaN 索引，循环时会跳到下一个 series', async () => {
  const env = setupBrowserEnv();
  const { chart, dispatches } = createChartMock();
  const { loopShowTooltip } = await freshImport('empty-series');

  loopShowTooltip(chart, {
    series: [
      {
        data: [],
        type: 'bar',
      },
      {
        data: [7],
        type: 'bar',
      },
    ],
  }, {
    interval: 100,
    loopSeries: true,
  });
  env.intervals[0].handler();

  assert.equal(dispatches.length, 2);
  assert.equal(dispatches[1].seriesIndex, 1);
  assert.equal(dispatches[1].dataIndex, 0);
  assert.ok(!Number.isNaN(dispatches[1].dataIndex));
});

test('clearLoop 后 resume 不会重启轮播，并会移除事件监听', async () => {
  const env = setupBrowserEnv();
  const { chart, chartTarget, zRenderTarget } = createChartMock();
  const { loopShowTooltip } = await freshImport('clear-loop');

  const result = loopShowTooltip(chart, {
    series: [{
      data: [1],
      type: 'bar',
    }],
  }, {
    bounce() {},
  });

  result.clearLoop();
  result.resume();

  assert.equal(env.intervals.length, 1);
  assert.deepEqual(env.clearedIntervals, [1]);
  assert.equal(chartTarget.handlers.get('mousemove')?.size ?? 0, 0);
  assert.equal(chartTarget.handlers.get('mouseover')?.size ?? 0, 0);
  assert.equal(chartTarget.handlers.get('mouseout')?.size ?? 0, 0);
  assert.equal(zRenderTarget.handlers.get('mousemove')?.size ?? 0, 0);
  assert.equal(zRenderTarget.handlers.get('globalout')?.size ?? 0, 0);
});

test('series 为对象时，鼠标 hover 仍会触发 bounce', async () => {
  setupBrowserEnv();
  const calls = [];
  const { chart, chartTarget } = createChartMock();
  const { loopShowTooltip } = await freshImport('single-series-hover');

  loopShowTooltip(chart, {
    series: {
      data: [1, 2],
      type: 'bar',
    },
  }, {
    bounce(data, seriesIndex, dataIndex) {
      calls.push({ data, dataIndex, seriesIndex });
    },
  });
  chartTarget.trigger('mouseover', {
    dataIndex: 1,
    seriesIndex: 0,
  });

  assert.deepEqual(calls.at(-1), {
    data: 2,
    dataIndex: 1,
    seriesIndex: 0,
  });
});

test('updateData 替换 series 后会使用最新数据', async () => {
  const env = setupBrowserEnv();
  const calls = [];
  const { chart, setOptionCalls } = createChartMock();
  const chartOption = {
    series: [{
      data: [1],
      type: 'bar',
    }],
  };
  const { loopShowTooltip } = await freshImport('update-data');

  loopShowTooltip(chart, chartOption, {
    bounce(data) {
      calls.push(data);
    },
    updateData() {
      chartOption.series = [{
        data: [5],
        type: 'bar',
      }];
    },
  });
  env.intervals[0].handler();

  assert.deepEqual(calls, [1, 5]);
  assert.equal(setOptionCalls.length, 1);
  assert.equal(setOptionCalls[0], chartOption);
});
