import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // 获取访问者IP
  const userIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  const countKey = "birthday_total";
  const ipSetKey = "birthday_clicked_ips";

  if (request.method === 'GET') {
    // 读取总人数
    const total = await kv.get(countKey) || 0;
    const hasClicked = await kv.sismember(ipSetKey, userIp);
    return response.status(200).json({ total, hasClicked: !!hasClicked });
  }

  if (request.method === 'POST') {
    // 判断是否已经点过
    const alreadyClick = await kv.sismember(ipSetKey, userIp);
    if (alreadyClick) {
      return response.status(400).json({msg:"你已经为TA庆生过啦", total: await kv.get(countKey)});
    }
    // IP存入集合，计数+1
    await kv.sadd(ipSetKey, userIp);
    await kv.incr(countKey);
    const newTotal = await kv.get(countKey);
    return response.status(200).json({total: newTotal, msg:"庆生成功！"});
  }

  return response.status(405).json({msg:"方法不允许"});
}