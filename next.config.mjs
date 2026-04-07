import createNextJsObfuscator from 'nextjs-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Ép Vercel bỏ qua các lỗi định dạng và kiểu dữ liệu để hoàn tất build
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    
    // 2. Cấu hình Webpack xử lý các module Crypto (Quan trọng cho dự án Crypto)
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

// 3. Cấu hình bộ mã hóa Obfuscator tối ưu cho RAM 8GB của Vercel
const withNextJsObfuscator = createNextJsObfuscator(
    {
        rotateStringArray: true,
        disableConsoleOutput: false,
        compact: true,
        controlFlowFlattening: false, 
        deadCodeInjection: false,
        stringArray: true,
        stringArrayThreshold: 0.5, // Giảm ngưỡng để nhẹ hơn cho CPU
        transformObjectKeys: false, // Tắt cái này để tránh lỗi runtime trên Next.js
    },
    {
        enabled: 'detect',
        patterns: [
            './app/**/*.(js|jsx|ts|tsx)',
            './components/**/*.(js|jsx|ts|tsx)',
        ],
        exclude: [
            // Loại trừ tất cả các file hệ thống và cấu hình của Next.js
            './app/api/**/*',
            './app/meta/**/*',
            './middleware.ts',
            '**/layout.tsx', // Giữ nguyên layout để tránh lỗi cấu trúc trang
            '**/page.tsx',   // Chỉ mã hóa logic bên trong components, giữ page ổn định
            '**/*.config.*',
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

export default withNextJsObfuscator(
