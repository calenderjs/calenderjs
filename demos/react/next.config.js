/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 不使用 transpilePackages，所有包都使用构建后的 dist
  // 确保 @calenderjs/calendar 和 @calenderjs/react 都已构建
  transpilePackages: [],
  
  // 禁用生产环境的 sourcemap，避免读取源代码
  productionBrowserSourceMaps: false,
  
  webpack: (config, { isServer }) => {
    // Monorepo: 确保 React 使用单一实例（必需！）
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // 确保从当前项目的 node_modules 解析
    const path = require('path');
    const projectRoot = __dirname;
    const workspaceRoot = path.resolve(__dirname, '../..');
    
    // 优先从项目本地 node_modules 解析，然后从 workspace root
    if (!config.resolve.modules) {
      config.resolve.modules = [];
    }
    config.resolve.modules = [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
      'node_modules',
      ...config.resolve.modules,
    ];
    
    // 设置 alias 确保使用正确的 React 实例
    try {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: require.resolve('react', { paths: [projectRoot, workspaceRoot] }),
        'react-dom': require.resolve('react-dom', { paths: [projectRoot, workspaceRoot] }),
        'react/jsx-runtime': require.resolve('react/jsx-runtime', { paths: [projectRoot, workspaceRoot] }),
        'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime', { paths: [projectRoot, workspaceRoot] }),
      };
    } catch (e) {
      console.warn('Failed to resolve React aliases:', e.message);
    }
    
    // 确保 resolve 优先使用 package.json 的 exports 字段
    // 这样会使用 dist 目录，而不是 src 目录
    config.resolve.conditionNames = ['import', 'require', 'default'];
    
    // 确保 webpack 不会处理 .wsx 文件（这些应该在构建时处理）
    config.resolve.extensions = config.resolve.extensions.filter(
      ext => ext !== '.wsx'
    );
    
    // 禁用 sourcemap loader，避免 Next.js 尝试读取源代码
    // 这会防止 "Failed to read source code" 错误
    config.module.rules = config.module.rules.map((rule) => {
      if (rule.use && Array.isArray(rule.use)) {
        rule.use = rule.use.filter(
          (loader) =>
            !(
              typeof loader === 'object' &&
              loader.loader &&
              (loader.loader.includes('source-map-loader') ||
               loader.loader.includes('source-map'))
            )
        );
      }
      return rule;
    });
    
    // 忽略 sourcemap 警告
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { file: /\.map$/ },
      // 忽略 @next/swc-* 平台特定二进制包的 FileSystemInfo 警告
      // 这些是符号链接，不是标准 npm 包，警告是无害的
      /Managed item .*@next\/swc-.* isn't a directory or doesn't contain a package\.json/,
    ];
    
    return config;
  },
};

module.exports = nextConfig;
