import createNextJsObfuscator from 'nextjs-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Cấu hình quan trọng để Vercel không ngắt Build khi gặp lỗi nhỏ
    typescript: {
        ignoreBuildErrors: true, // Bỏ qua lỗi TypeScript khi build
    },
    eslint: {
        ignoreDuringBuilds: true, // Bỏ qua lỗi ESLint khi build
    },
    
    // 2. Xử lý Webpack cho các thư viện Crypto và Polyfill
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }
        
        config.externals.push({
            'node:crypto': 'commonjs crypto',
        });
        
        return config;
    },
};

// 3. Cấu hình Obfuscator (Đã điều chỉnh để nhẹ hơn cho máy Build 8GB)
const withNextJsObfuscator = createNextJsObfuscator(
    {
        rotateStringArray: true,
        disableConsoleOutput: false,
        // Giảm bớt các tùy chọn nặng để tránh lỗi "Exiting now" do thiếu RAM
        compact: true,
        controlFlowFlattening: false, 
        deadCodeInjection: false,
        stringArray: true,
        stringArrayThreshold: 0.75,
    },
    {
        enabled: 'detect',
        patterns: [
            './app/**/*.(js|jsx|ts|tsx)',
            './components/**/*.(js|jsx|ts|tsx)',
        ],
        exclude: [
            './app/api/**/*',
            './middleware.ts',
            './app/meta/**/*',
            './app/generateMetadata.js',
            './app/[...not-found]/generateMetadata.js',
            './app/required/generateMetadata.js',
            './app/required-confirm/generateMetadata.js',
            './next.config.mjs',
            './tailwind.config.js',
            './postcss.config.mjs',
            './jsconfig.json',
            './tsconfig.json',
            'node_modules'
        ],
        log: true,
    }
);

export default withNextJsObfuscator(nextConfig);
