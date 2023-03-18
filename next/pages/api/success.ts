// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Keypair, PublicKey } from '@solana/web3.js';
import { CollectionMint, CONNECTION, TreeAccount } from '@/src/util/const';
import { getCollectionDetailsFromMintAccount, mintCompressedNft } from '@/src/util/utils';
import { Creator, TokenProgramVersion, TokenStandard } from '@metaplex-foundation/mpl-bubblegum';
import globalCache from 'global-cache';
import { MyPixel } from '@/src/components/MyPixels';
import { NftPixel } from '@/src/components/Grid';
import { Console } from 'console';

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
  const colorString = getFromPayload(req, 'Query', 'color');
  const color = colorString;
  if (!isColor(color)) {
    res.status(400).json({
      message: "Invalid color",
    });
    return;
  }
  const pubkey = getFromPayload(req, 'Query', 'pubkey');

  console.log("color " + color);
  const noHashTagColor = color.replace("#", "");

  let parsedNfts: Array<Array<NftPixel>> = JSON.parse(globalCache.get("allNfts") as string);
  parsedNfts[x][y].c = noHashTagColor;
  parsedNfts[x][y].o = pubkey;
  globalCache.set("allNfts", JSON.stringify(parsedNfts));
  console.log("added color to cache: " + parsedNfts[x][y].c + " to " + x + " " + y + " for " + pubkey);

  res.status(200).json({
    message: "OK",
  });
};

const post = async (req: NextApiRequest, res: NextApiResponse<POST>) => {
  res.status(200).send({ transaction: "", message: "" });
};
