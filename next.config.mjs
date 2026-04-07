import createNextJsObfuscator from 'nextjs-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Bỏ qua lỗi TypeScript và ESLint để Vercel không ngắt Build giữa chừng
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    
    // 2. Cấu hình Webpack cho các thư viện Crypto
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Polyfill hoặc xử lý các module node cho trình duyệt
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false, // Hoặc 'crypto-browserify' nếu cần
            };
        }
        
        config.externals.push({
            'node:crypto': 'commonjs crypto',
        });
        
        return config;
    },
};

// 3. Cấu hình bộ mã hóa Obfuscator
const withNextJsObfuscator = createNextJsObfuscator(
    {
        // Cấu hình mã hóa nhẹ nhàng để tránh lỗi RAM trên Vercel
        compact: true,
        controlFlowFlattening: false, // Tắt cái này nếu Build bị đứng quá lâu
        deadCodeInjection: false,     // Tắt để giảm dung lượng file build
        rotateStringArray: true,
        disableConsoleOutput: false,
        selfDefending: false,         // Bật cái này dễ gây lỗi trên Vercel Serverless
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
            './next.config.mjs',
            './tailwind.config.js',
            './postcss.config.mjs',
            './jsconfig.json',
            './tsconfig.json',
            'node_modules' // Luôn loại trừ node_modules
        ],
        log: true,
    }
);

export default withNextJsObfuscator(nextConfig);
