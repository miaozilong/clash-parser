module.exports.parse = async (raw, {axios, yaml, notify, console}, {name, url, interval, selected}) => {
    const obj = yaml.parse(raw);

    // 删除 obj.proxies 中 name 包含“免费”的节点
    if (obj.proxies) {
        obj.proxies = obj.proxies.filter(proxy => !proxy.name.includes("免费"));
    }

    // 请求远程节点
    let kanpian365Url = 'https://n544k.no-mad-world.club/link/jKS9t551FdpKroIC?clash=3&extend=1';
    let additionalData;
    try {
        const response = await axios.get(kanpian365Url);
        additionalData = yaml.parse(response.data);
        console.log("additionalData", additionalData);
    } catch (error) {
        console.error('Error fetching additional data:', error);
        notify('Error fetching additional data.');
    }

    // 合并远程代理到本地代理列表
    if (additionalData && additionalData.proxies) {
        if (!obj.proxies) {
            obj.proxies = [];
        }
        obj.proxies.push(...additionalData.proxies);
    }

    // 确保 proxy-groups 存在
    if (!obj['proxy-groups']) {
        obj['proxy-groups'] = [];
    }

    // 添加负载均衡分组
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
        }
    ];

    obj['proxy-groups'].push(...proxyGroups);

    // 收集代理名称
    const proxyNames = obj.proxies ? obj.proxies.map(proxy => proxy.name) : [];

    // 给各个负载均衡组添加匹配代理  所有类型都匹配
    // obj['proxy-groups'].forEach(group => {
    //     if (group.name.includes('香港')) {
    //         group.proxies = proxyNames.filter(name => name.includes('香港'));
    //     } else if (group.name.includes('下载专用')) {
    //         group.proxies = proxyNames.filter(name => name.includes('x0.01'));
    //     } else if (group.name.includes('所有日本')) {
    //         group.proxies = proxyNames.filter(name => name.includes('日本'));
    //     }
    // });

    // 香港节点仅匹配ss类型的节点
    obj['proxy-groups'].forEach(group => {
        if (group.name.includes('香港')) {
            group.proxies = obj.proxies
                .filter(proxy => proxy.name.includes('香港') && proxy.type === 'ss')
                .map(proxy => proxy.name);
        } else if (group.name.includes('下载专用')) {
            group.proxies = proxyNames.filter(name => name.includes('x0.01'));
        } else if (group.name.includes('所有日本')) {
            group.proxies = proxyNames.filter(name => name.includes('日本'));
        }
    });


    // 让第一个组引用所有负载均衡组名（可选）
    obj['proxy-groups'][0]['proxies'].unshift(...proxyGroups.map(v => v.name));

    // 新增普通分组“日本”：包含所有日本代理 + 所有“日本”负载均衡组
    const japanProxies = proxyNames.filter(name => name.includes('日本'));
    const japanGroups = obj['proxy-groups']
        .filter(group => group.name.includes('日本'))
        .map(group => group.name);

    obj['proxy-groups'].push({
        name: '日本',
        type: 'select',
        proxies: [...japanGroups, ...japanProxies]
    });

    // 确保 rules 节点存在
    if (!obj.rules) {
        obj.rules = [];
    }

    // 添加规则，注意顺序
    obj.rules.unshift(`DOMAIN,esd.mathworks.com,DIRECT`);
    obj.rules.unshift(`DOMAIN,esd.mathworks.cn,DIRECT`);
    obj.rules.unshift(`DOMAIN-SUFFIX,gemini.google.com,日本`);
    obj.rules.unshift(`DOMAIN-SUFFIX,cursor.com,日本`);
    obj.rules.unshift(`DOMAIN,cursor.com,日本`);
    obj.rules.unshift(`DOMAIN,download-cdn.jetbrains.com,DIRECT`);

    // 转为 YAML 字符串
    return yaml.stringify(obj);
};
