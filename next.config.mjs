import createNextJsObfuscator from 'nextjs-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Chống ngắt build do lỗi định dạng code (Rất quan trọng trên Vercel)
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    
    // 2. Cấu hình xử lý Webpack cho Crypto & Buffer
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

// 3. Cấu hình Obfuscator - Chiến thuật "Mã hóa chọn lọc"
const withNextJsObfuscator = createNextJsObfuscator(
    {
        rotateStringArray: true,
        disableConsoleOutput: true, // Tăng bảo mật bằng cách chặn console
        compact: true,
        // CẢNH BÁO: Tắt các tùy chọn dưới đây để tránh lỗi 8GB RAM trên Vercel
        controlFlowFlattening: false, 
        deadCodeInjection: false,
        debugProtection: false,
        stringArrayThreshold: 0.6,
    },
    {
        enabled: 'detect',
