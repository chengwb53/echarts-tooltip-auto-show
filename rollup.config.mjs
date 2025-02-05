import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import clear from 'rollup-plugin-clear';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
    // 打包按需加载文件
      format: 'es',
      // 打包后文件名
      entryFileNames: '[name].js',
      exports: 'named',
      // 配置打包根目录
      dir: './dist',
    },
    {
      // 打包按需加载文件
      format: 'es',
      // 打包后文件名
      entryFileNames: '[name].min.js',
      exports: 'named',
      // 配置打包根目录
      dir: './dist',
      plugins: [terser()],
    },
    {
    // 打包 umd 文件
      format: 'umd',
      // 打包后文件名
      name: '[name]',
      entryFileNames: '[name].umd.js',
      dir: './dist',
      // 在 UMD 构建模式下为这些外部化的依赖
      // 提供一个全局变量
      globals: {
        echarts: 'echarts',
      },
    },
    {
      // 打包 umd 文件
      format: 'umd',
      // 打包后文件名
      name: '[name]',
      entryFileNames: '[name].umd.min.js',
      dir: './dist',
      // 在 UMD 构建模式下为这些外部化的依赖
      // 提供一个全局变量
      globals: {
        echarts: 'echarts',
      },
      plugins: [terser()],
    },
  ],
  plugins: [
    clear({ targets: ['dist'] }), // 清空 dist 目录
    typescript({
      useTsconfigDeclaration: true, // 使用 tsconfig 中的声明文件配置
      clean: true, // 清理输出目录
    }),
    resolve(), // 解析 node_modules 中的模块
  ],
};
