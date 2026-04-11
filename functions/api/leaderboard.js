export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB; // 这里的 DB 会在第四步进行绑定

    // 处理提交成绩 (POST 请求)
    if (request.method === "POST") {
        try {
            const { username, time } = await request.json();
            if (!username || !time) return new Response("数据无效", { status: 400 });

            let scores = await db.get("scores", { type: "json" }) || [];
            scores.push({ username, time: parseFloat(time), date: new Date().toLocaleDateString() });
            scores.sort((a, b) => a.time - b.time); // 按用时升序排
            scores = scores.slice(0, 10); // 只取前10名

            await db.put("scores", JSON.stringify(scores));
            return new Response(JSON.stringify(scores), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
            return new Response("服务器错误", { status: 500 });
        }
    }

    // 获取成绩 (GET 请求)
    const scores = await db.get("scores", { type: "json" }) || [];
    return new Response(JSON.stringify(scores), { headers: { "Content-Type": "application/json" } });
}