export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB;

    if (!db) {
        return new Response("数据库未绑定", { status: 500 });
    }

    // 处理提交成绩 (POST)
    if (request.method === "POST") {
        try {
            const { username, time } = await request.json();
            
            // 1. 获取现有成绩，并强制确保它是一个数组
            let rawData = await db.get("scores");
            let scores = [];
            try {
                scores = rawData ? JSON.parse(rawData) : [];
                if (!Array.isArray(scores)) scores = []; // 如果解析出来不是数组，重置它
            } catch (e) {
                scores = []; // 解析失败也重置
            }

            // 2. 插入新成绩（允许昵称重复，只是记录不同）
            const newEntry = { 
                username: String(username).substring(0, 10), // 限制昵称长度
                time: parseFloat(time), 
                date: new Date().getTime() // 使用时间戳防止排序冲突
            };
            
            scores.push(newEntry);

            // 3. 排序：时间越短越靠前
            scores.sort((a, b) => a.time - b.time);

            // 4. 只保留前 10 名
            const topTen = scores.slice(0, 10);

            // 5. 写回 KV
            await db.put("scores", JSON.stringify(topTen));

            return new Response(JSON.stringify(topTen), {
                headers: { "Content-Type": "application/json" }
            });

        } catch (err) {
            return new Response("提交处理失败: " + err.message, { status: 500 });
        }
    }

    // 获取成绩 (GET)
    let rawData = await db.get("scores");
    return new Response(rawData || "[]", {
        headers: { "Content-Type": "application/json" }
    });
}