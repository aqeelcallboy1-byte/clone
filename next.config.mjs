import createNextJsObfuscator from 'nextjs-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Chống ngắt build do lỗi định dạng hoặc kiểu dữ liệu
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    
    // 2. Cấu hình Webpack cho các thư viện Crypto & Buffer (Dành cho web Web3/Crypto)
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

// 3. Cấu hình bộ mã hóa Obfuscator - Chiến thuật bảo mật an toàn cho Vercel
const withNextJsObfuscator = createNextJsObfuscator(
    {
        rotateStringArray: true,
        disableConsoleOutput: true,
        compact: true,
        // Tắt các tùy chọn nặng để tránh lỗi "Exiting now" do thiếu RAM 8GB
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
            // LOẠI TRỪ tuyệt đối thư mục app để tránh lỗi Entry Point trên Vercel
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
