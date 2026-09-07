import { Redis } from '@upstash/redis';

export default async function handler(request, response) {
  const redis = Redis.fromEnv();
  const userIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  const countKey = "birthday_total";
  const ipSetKey = "birthday_clicked_ips";

  if (request.method === 'GET') {
    const total = await redis.get(countKey) || 0;
    const hasClicked = await redis.sismember(ipSetKey, userIp);
    return response.status(200).json({ total, hasClicked: !!hasClicked });
  }

  if (request.method === 'POST') {
    const alreadyClick = await redis.sismember(ipSetKey, userIp);
    if (alreadyClick) {
      return response.status(400).json({msg:"你已经为TA庆生过啦", total: await redis.get(countKey)});
    }
    await redis.sadd(ipSetKey, userIp);
    await redis.incr(countKey);
    const newTotal = await redis.get(countKey);
    return response.status(200).json({total: newTotal, msg:"庆生成功！"});
  }
  return response.status(405).json({msg:"方法不允许"});
}
