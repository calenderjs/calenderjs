/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 不使用 transpilePackages，所有包都使用构建后的 dist
  // 确保 @calenderjs/calendar 和 @calenderjs/react 都已构建
  transpilePackages: [],
  
  // 禁用生产环境的 sourcemap，避免读取源代码
  productionBrowserSourceMaps: false,
  
  webpack: (config, { isServer }) => {
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
    ];
    
    return config;
  },
};

module.exports = nextConfig;
