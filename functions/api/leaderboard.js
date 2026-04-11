export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB;
    const today = new Date(Date.now() + 8 * 3600000).toISOString().split('T')[0];

    // 1. 获取当前排行榜数据
    let data = await db.get("scores", { type: "json" }) || { date: today, list: [] };

    // 2. 检查日期：如果存储的日期不是今天，说明该换届了
    if (data.date !== today) {
        data = { date: today, list: [] };
        await db.put("scores", JSON.stringify(data)); // 清空并更新日期
    }

    if (request.method === "POST") {
        const { username, time } = await request.json();
        
        data.list.push({ 
            username: username.substring(0, 10), 
            time: parseFloat(time),
            timestamp: Date.now() 
        });
        
        // 排序并截取前十
        data.list.sort((a, b) => a.time - b.time);
        data.list = data.list.slice(0, 10);

        await db.put("scores", JSON.stringify(data));
        return new Response(JSON.stringify(data.list), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(data.list), { headers: { "Content-Type": "application/json" } });
}