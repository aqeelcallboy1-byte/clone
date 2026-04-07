import createNextJsObfuscator from 'nextjs-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Vô hiệu hóa kiểm tra nghiêm ngặt để đẩy nhanh quá trình build
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    
    // 2. Cấu hình Webpack cho các module logic Crypto
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

// 3. Cấu hình Obfuscator - Chống lỗi 700585 (Entry point not found)
const withNextJsObfuscator = createNextJsObfuscator(
    {
        rotateStringArray: true,
        disableConsoleOutput: true,
        compact: true,
        // Giữ cấu trúc hàm đơn giản để Vercel Optimizer có thể đọc được
        controlFlowFlattening: false, 
        deadCodeInjection: false,
        stringArrayThreshold: 0.5,
    },
    {
        enabled: 'detect',
        patterns: [
            // CHỈ mã hóa logic trong thư mục components và lib
            './components/**/*.(js|jsx|ts|tsx)',
            './lib/**/*.(js|jsx|ts|tsx)',
        ],
        exclude: [
            // LOẠI TRỪ tuyệt đối thư mục app để tránh lỗi 700585
            './app/**/*', 
            './api/**/*',
            './next.config.mjs',
            './tailwind.config.js',
            './postcss.config.mjs',
            'node_modules'
        ],
        log: true,
    }
);

export default withNextJsObfuscator(nextConfig);
