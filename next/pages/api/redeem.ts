// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { CONNECTION } from '@/src/util/const';
import { redeemAsset } from '@/src/util/utils';

type POST = {
  transaction: string;
  message: string;
}; 

type GET = {
  transaction: string;
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

  // Will be signed from the client for now
  return;
  const authorityKeypair = JSON.parse(process.env.TREE_AUTHORITY??"[]");
  const ownerWallet = Keypair.fromSecretKey(
    Uint8Array.from(authorityKeypair)
  );

  const pubkey = getFromPayload(req, 'Query', 'pubkey');
  const feepayer: PublicKey = new PublicKey(pubkey);
  const pubkeyAsset = getFromPayload(req, 'Query', 'asset');
  const assetPubkey: PublicKey = new PublicKey(pubkeyAsset);

  console.log("\n");

  const hash = await CONNECTION.getLatestBlockhash();

  const transaction = await redeemAsset(
    CONNECTION,
    feepayer,
    assetPubkey.toBase58(),
  );
  transaction.recentBlockhash = hash.blockhash;
  transaction.feePayer = feepayer;

  transaction.partialSign(ownerWallet);
  console.log("transaction " + transaction.instructions.length);
  
  const serializedTransaction = transaction.serialize({
    verifySignatures: false,
    requireAllSignatures: false,
  });

  const base64Transaction = serializedTransaction.toString('base64');

  res.status(200).json({
    transaction: base64Transaction,
  });
};

const post = async (req: NextApiRequest, res: NextApiResponse<POST>) => {

  res.status(200).send({ transaction: "", message: "" });
};
