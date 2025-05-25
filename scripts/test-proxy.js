// 测试代理配置的简单脚本
// 使用方法: node scripts/test-proxy.js

import http from 'http';

console.log('🧪 测试代理配置...\n');

// 测试前端开发服务器
const testFrontend = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            console.log(`✅ 前端服务器: http://localhost:3000 - 状态码: ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', () => {
            console.log('❌ 前端服务器: http://localhost:3000 - 连接失败');
            resolve(false);
        });

        req.setTimeout(3000, () => {
            console.log('⏱️  前端服务器: http://localhost:3000 - 超时');
            req.destroy();
            resolve(false);
        });
    });
};

// 测试后端服务器
const testBackend = () => {
    return new Promise((resolve) => {
        const req = http.get('http://127.0.0.1:9000', (res) => {
            console.log(`✅ 后端服务器: http://127.0.0.1:9000 - 状态码: ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', () => {
            console.log('❌ 后端服务器: http://127.0.0.1:9000 - 连接失败');
            resolve(false);
        });

        req.setTimeout(3000, () => {
            console.log('⏱️  后端服务器: http://127.0.0.1:9000 - 超时');
            req.destroy();
            resolve(false);
        });
    });
};

// 运行测试
const runTests = async () => {
    const frontendOk = await testFrontend();
    const backendOk = await testBackend();

    console.log('\n📋 测试结果:');
    console.log(`前端服务器: ${frontendOk ? '✅ 正常' : '❌ 异常'}`);
    console.log(`后端服务器: ${backendOk ? '✅ 正常' : '❌ 异常'}`);

    if (frontendOk && backendOk) {
        console.log('\n🎉 代理配置应该正常工作！');
        console.log('💡 在浏览器中访问 http://localhost:3000 进行测试');
    } else {
        console.log('\n⚠️  请检查服务器状态:');
        if (!frontendOk) console.log('   - 运行 pnpm dev 启动前端服务器');
        if (!backendOk) console.log('   - 确保后端服务器运行在 http://127.0.0.1:9000');
    }
};

runTests().catch(console.error); 