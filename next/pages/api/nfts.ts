// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NftPixel } from '@/src/components/Grid';
import { CollectionMint, CONNECTION, REDIS_KEY } from '@/src/util/const';
import type { NextApiRequest, NextApiResponse, NextConfig } from 'next';
import { createClient } from 'redis';
const {gzip, ungzip} = require('node-gzip');

type POST = {
  transaction: string;
  message: string;
}; 

type GET = {
  allNfts: string;
};

function getFromPayload(req: NextApiRequest, payload: string, field: string): string {
  function parseError() { throw new Error(`${payload} parse error: missing ${field}`) };
  let value;
  if (payload === 'Query') {
    if (!(field in req.query)) parseError();
    value = req.query[field];
  }
  if (payload === 'Body') {
    if (!req.body || !(field in req.body)) parseError();
    value = req.body[field];
  }
  if (value === undefined || value.length === 0) parseError();
  return typeof value === 'string' ? value : value[0];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return get(req, res);
  }

  if (req.method === 'POST') {
    return post(req, res);
  }
}

const get = async (req: NextApiRequest, res: NextApiResponse<GET>) => {
  const client = createClient({ url: process.env.REDIS_URL??"" });

  client.on("error", (error) => {
    client.quit();
    console.error(`Ups nfts: ${error}`);
    res.status(500).json({
      allNfts: "rate limit redis",
    });
  });
  await client.connect();

  const cachedResult = await client.get(REDIS_KEY);
  client.quit();
  if (!cachedResult) {
    res.status(200).json({
      allNfts: cachedResult?.toString() || "[]",
    });
    return;
  }

  
 //To track the size of the cached result, the maximum is 4mb 1 million nfts in gziped json are 0.41mb \o/ 
  const size = new TextEncoder().encode(cachedResult).length
  const kiloBytes = size / 1024;
  const megaBytes = kiloBytes / 1024;
  console.log("megabytes compressed: " + megaBytes);

  res.status(200).json({
    allNfts: cachedResult,
  });
};

const post = async (req: NextApiRequest, res: NextApiResponse<POST>) => {

  const accountField = getFromPayload(req, 'Body', 'account');
  const instructionField = getFromPayload(req, 'Query', 'instruction');
  const amountField = getFromPayload(req, 'Query', 'amount');

  res.status(200).send({ transaction: "", message: "Success" });
};
