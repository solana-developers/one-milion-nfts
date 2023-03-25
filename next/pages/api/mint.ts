// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Keypair, PublicKey } from '@solana/web3.js';
import { collectionMasterEditionAccount, collectionMetadataAccount, CollectionMint, CONNECTION, TreeAccount } from '@/src/util/const';
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
  transaction: string;
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

  const authorityKeypair = JSON.parse(process.env.TREE_AUTHORITY??"[]");
  const ownerWallet = Keypair.fromSecretKey(
    Uint8Array.from(authorityKeypair)
  );

  const xString = getFromPayload(req, 'Query', 'x');
  const x = Number.parseInt(xString);
  const yString = getFromPayload(req, 'Query', 'y');
  const y = Number.parseInt(yString);
  const colorString = getFromPayload(req, 'Query', 'color');
  const color = colorString;
  if (!isColor(color)) {
    res.status(400).json({
      transaction: "",
      message: "Invalid color",
    });
    return;
  }

  const client = createClient({ url: process.env.REDIS_URL??"" });
  client.on("error", (error) => console.error(`Ups s: ${error}`));
  await client.connect();

  const cachedResult = await client.get("allNfts");
  if (cachedResult === null) {
    client.quit();
    res.status(500).json({
      transaction: "",
      message: "Redis error",
    });
    return;
  }

  let base64Buffer = new Buffer(cachedResult, 'base64');
  const unzippedData = await ungzip(base64Buffer)

  let parsedNfts: Array<Array<NftPixel>> = JSON.parse(unzippedData.toString());
  if (parsedNfts[x][y].o != "") {
    client.quit();
    res.status(400).json({
      transaction: "",
      message: "Pixel already taken",
    });
    return;
  };
  client.quit();

  const pubkey = getFromPayload(req, 'Query', 'pubkey');
  const feepayer: PublicKey = new PublicKey(pubkey);
  
  console.log("Creator" + ownerWallet.publicKey + "color " + color + "x " + x + "y " + y + "pubkey " + pubkey);

  console.log("\n===Collection Details===");
  console.log("Mint account: " + CollectionMint.toBase58());
  console.log("Metadata account: " + collectionMetadataAccount.toBase58());
  console.log(
    "Master edition account: " + collectionMasterEditionAccount.toBase58()
  );
  console.log("\n");

  console.log("color " + color);
  const unescapedColor = color.replace("%23", "#");
  const noHashTagColor = color.replace("#", "");

  const creators: Creator[] = [ { address: ownerWallet.publicKey, verified: true, share: 100 } ];

  const collection = {
    verified: true,
    key: CollectionMint
  }

  // We are saving position and color in the name
  const nftArgs = {
    name: x + "." + y + "-" + unescapedColor,
    symbol: "ONEM",
    uri: "https://shdw-drive.genesysgo.net/AzjHvXgqUJortnr5fXDG2aPkp2PfFMvu4Egr57fdiite/pixelMetaData.json",
    creators: creators,
    editionNonce: 253,
    tokenProgramVersion: TokenProgramVersion.Original,
    tokenStandard: TokenStandard.NonFungible,
    uses: null,
    collection: collection,
    primarySaleHappened: false,
    sellerFeeBasisPoints: 420,
    isMutable: true,
  };
  const hash = await CONNECTION.getLatestBlockhash();

  const transaction = await mintCompressedNft(
    CONNECTION,
    nftArgs,
    ownerWallet.publicKey,
    TreeAccount,
    CollectionMint,
    collectionMetadataAccount, 
    collectionMasterEditionAccount,
    feepayer
  );
  transaction.recentBlockhash = hash.blockhash;

  transaction.partialSign(ownerWallet);
  console.log("transaction " + transaction.instructions.length);
  
  const serializedTransaction = transaction.serialize({
    verifySignatures: false,
    requireAllSignatures: false,
  });

  const base64Transaction = serializedTransaction.toString('base64');

  res.status(200).json({
    transaction: base64Transaction,
    message: "OK",
  });
};

const post = async (req: NextApiRequest, res: NextApiResponse<POST>) => {
  res.status(200).send({ transaction: "", message: "" });
};
