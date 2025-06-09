module.exports.parse = async (raw, {axios, yaml, notify, console}, {name, url, interval, selected}) => {
    const obj = yaml.parse(raw);

    // 删除obj中proxies节点下的name中带有“免费”的节点
    if (obj.proxies) {
        obj.proxies = obj.proxies.filter(proxy => !proxy.name.includes("免费"));
    }

    // 请求 https://n544k.no-mad-world.club/link/jKS9t551FdpKroIC?clash=3&extend=1
    let kanpian365Url = 'https://n544k.no-mad-world.club/link/jKS9t551FdpKroIC?clash=3&extend=1';
    let additionalData;
    try {
        const response = await axios.get(kanpian365Url);
        // 解析出数据
        additionalData = yaml.parse(response.data);
        console.log("additionalData", additionalData);
    } catch (error) {
        console.error('Error fetching additional data:', error);
        notify('Error fetching additional data.');
    }

    // 添加到 obj 中 proxies 节点下
    if (additionalData.proxies) {
        console.log("additionalData.proxies", additionalData.proxies);
        if (!obj.proxies) {
            obj.proxies = [];
        }
        obj.proxies.push(...additionalData.proxies);
    }

    // 新增功能：添加 proxy-groups 节点
    if (!obj['proxy-groups']) {
        obj['proxy-groups'] = [];
    }

    // 添加负载均衡配置
    const proxyGroups = [
        {
            name: '负载均衡-香港-散列',
            type: 'load-balance',
            url: 'http://www.google.com/generate_204',
            interval: 30,
            strategy: 'consistent-hashing',
            proxies: []
        },
        {
            name: '负载均衡-所有日本-散列',
            type: 'load-balance',
            url: 'http://www.google.com/generate_204',
            interval: 30,
            strategy: 'consistent-hashing',
            proxies: []
        },
        {
            name: '负载均衡-香港-轮询',
            type: 'load-balance',
            url: 'http://www.google.com/generate_204',
            interval: 30,
            strategy: 'round-robin',
            proxies: []
        },
        {
            name: '负载均衡-下载专用-散列',
            type: 'load-balance',
            url: 'http://www.google.com/generate_204',
            interval: 30,
            strategy: 'consistent-hashing',
            proxies: []
        },
    ];

    obj['proxy-groups'].push(...proxyGroups);

    // 执行 commands，将 proxy names 分配到各个 proxy-group 中
    const proxyNames = obj.proxies ? obj.proxies.map(proxy => proxy.name) : [];
    obj['proxy-groups'].forEach(group => {
        if (group.name.includes('香港')) {
            group.proxies = proxyNames.filter(name => name.includes('香港'));
        } else if (group.name.includes('下载专用')) {
            group.proxies = proxyNames.filter(name => name.includes('x0.01') || name.includes('免费'));
        } else if (group.name.includes('所有日本')) {
            group.proxies = proxyNames.filter(name => name.includes('日本'));
        }
    });
    obj['proxy-groups'][0]['proxies'].unshift(...proxyGroups.map(v => v.name));

    // 确保 rules 节点存在
    if (!obj.rules) {
        obj.rules = [];
    }

    // 在 rules 开头添加 download-cdn.jetbrains.com 的直连规则
    obj.rules.unshift(`DOMAIN,download-cdn.jetbrains.com,DIRECT`);
	// 下载matlab的规则
    obj.rules.unshift(`DOMAIN,esd.mathworks.cn,DIRECT`);
    obj.rules.unshift(`DOMAIN,esd.mathworks.com,DIRECT`);

    let s = yaml.stringify(obj);
    return s;
};
