// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Keypair, PublicKey } from '@solana/web3.js';
import { CollectionMint, CONNECTION, REDIS_KEY, TreeAccount } from '@/src/util/const';
import { getCollectionDetailsFromMintAccount, mintCompressedNft } from '@/src/util/utils';
import { Creator, TokenProgramVersion, TokenStandard } from '@metaplex-foundation/mpl-bubblegum';
import globalCache from 'global-cache';
import { MyPixel } from '@/src/components/MyPixels';
import { NftPixel } from '@/src/components/Grid';
import { Console } from 'console';
import { createClient } from 'redis';
const {gzip, ungzip} = require('node-gzip');

type POST = {
  transaction: string;
  message: string;
}; 

type GET = {
  message: string;
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

const isColor = (strColor: string) => {
  var RegExp = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
  return RegExp.test(strColor);
}

const get = async (req: NextApiRequest, res: NextApiResponse<GET>) => {
  const xString = getFromPayload(req, 'Query', 'x');
  const x = Number.parseInt(xString);
  const yString = getFromPayload(req, 'Query', 'y');
  const y = Number.parseInt(yString);
  const pubkey = getFromPayload(req, 'Query', 'pubkey');

  const client = createClient({ url: process.env.REDIS_URL??"" });

  client.on("error", (error) => console.error(`Ups ts: ${error}`));
  await client.connect();

  const cachedResult = await client.get(REDIS_KEY);
  if (cachedResult === null) {
    client.quit();
    res.status(500).json({
      message: "Cache is empty",
    });
    return;
  }

  let base64Buffer = new Buffer(cachedResult, 'base64');
  const unzippedData = await ungzip(base64Buffer)

  let parsedNfts: Array<Array<NftPixel>> = JSON.parse(unzippedData.toString());
  parsedNfts[x][y].o = pubkey;
  const compressed = await gzip(JSON.stringify(parsedNfts))
  const compressedBase64 = Buffer.from(compressed).toString('base64'); 
  const result = await client.set(REDIS_KEY, compressedBase64);
  client.quit();
  console.log("Changed owner of " + parsedNfts[x][y].c + " " + x + " " + y + " to " + pubkey);

  res.status(200).json({
    message: "OK",
  });
};

const post = async (req: NextApiRequest, res: NextApiResponse<POST>) => {
  res.status(200).send({ transaction: "", message: "" });
};
