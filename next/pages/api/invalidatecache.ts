// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NftPixel } from '@/src/components/Grid';
import { CollectionMint, CONNECTION } from '@/src/util/const';
import { atob } from 'buffer';
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

  client.on("error", (error) => console.error(`Ups inv: ${error}`));
  await client.connect();

  const sortBy = {
    sortBy: "created",
    sortDirection: "asc",
  };

  const allAssetsOwned = await CONNECTION.getAllAssetsByGroup(
    "collection",
    CollectionMint.toBase58(),
    sortBy,
    1000,
    1,
    "",
    ""
  );

  var nftGrid = new Array<Array<NftPixel>>(1000);

  for (var i = 0; i < nftGrid.length; i++) {
    nftGrid[i] = new Array<NftPixel>(1000);
  }

  for (var i = 0; i < nftGrid.length; i++) {
    var cube = nftGrid[i];
    for (var j = 0; j < cube.length; j++) {
      nftGrid[i][j] = new NftPixel();
    }
  }

  for (var i = 0; i < allAssetsOwned.length; i++) {
    const nft = allAssetsOwned[i];
    const name = nft.content.metadata.name;
    //console.log(name);
    try {
      const x = name.split(".")[0];
      const y = name.split(".")[1].split("-")[0];
      let color = name.split(".")[1].split("-")[1];
      color = color.replace("#", "");
      nftGrid[x][y].c = color;
      nftGrid[x][y].o = nft.ownership.owner;
      const entry = nftGrid[x][y];
      
    } catch (e) {
      //console.log("error " + e);
    }
  }
  let size = new TextEncoder().encode(JSON.stringify(nftGrid)).length
  let kiloBytes = size / 1024;
  let megaBytes = kiloBytes / 1024;
 // console.log("megabytes: " + megaBytes);

  const compressed = await gzip(JSON.stringify(nftGrid))
//  console.log("compressed: " + compressed);

  const compressedBase64 = Buffer.from(compressed).toString('base64');
 // console.log("compressedBase64: " + compressedBase64);
  
  const result = await client.set("allNfts", compressedBase64);
 // console.log(result);

  let buff = new Buffer(compressedBase64, 'base64');
  let text = buff.toString('ascii');
 // console.log("decompressedBase64: " + text);

  const reverse = await ungzip(buff)
//  console.log("reverse: " + reverse);

  size = new TextEncoder().encode(compressedBase64).length
  kiloBytes = size / 1024;
  megaBytes = kiloBytes / 1024;
  console.log("megabytes compressed: " + megaBytes);
  //console.log("data compressed: " + Buffer.from(JSON.stringify(nftGrid)).toString('base64'));
  client.quit();

  res.status(200).json({
    allNfts: compressedBase64, 
  });
};

const post = async (req: NextApiRequest, res: NextApiResponse<POST>) => {

  const accountField = getFromPayload(req, 'Body', 'account');
  const instructionField = getFromPayload(req, 'Query', 'instruction');
  const amountField = getFromPayload(req, 'Query', 'amount');

  res.status(200).send({ transaction: "", message: "Success" });
};
