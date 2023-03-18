import { PublicKey } from "@solana/web3.js";
import { WrappedConnection } from "../wrappedConnection";

export const CONNECTION = new WrappedConnection(process.env.NEXT_PUBLIC_RPC ? process.env.NEXT_PUBLIC_RPC : 'https://rpc-devnet.helius.xyz/?api-key=dcee9dad-fb42-4a26-b394-41b53e81d913',  {
    wsEndpoint: process.env.NEXT_PUBLIC_WSS_RPC ? process.env.NEXT_PUBLIC_WSS_RPC : "wss://rpc-devnet.helius.xyz/?api-key=dcee9dad-fb42-4a26-b394-41b53e81d913",
    commitment: 'confirmed' 
  });

  export const CONNECTION_MAINNET = new WrappedConnection(process.env.NEXT_PUBLIC_RPC ? process.env.NEXT_PUBLIC_RPC : 'https://rpc.helius.xyz/?api-key=dcee9dad-fb42-4a26-b394-41b53e81d913',  {
    wsEndpoint: process.env.NEXT_PUBLIC_WSS_RPC ? process.env.NEXT_PUBLIC_WSS_RPC : "wss://rpc.helius.xyz/?api-key=dcee9dad-fb42-4a26-b394-41b53e81d913",
    commitment: 'confirmed' 
  });

  export const CollectionMint = new PublicKey("5o6eT9hrLLdzwNWo5cH784AtrqR18mPaY5kDoQbktHtd");
  export const TreeAccount = new PublicKey("tr3dw6VYYnjcmj1rTNNnajGyRWYnQK9sQgbFErPwrk7");

  export const collectionMetadataAccount = new PublicKey("ASqNRbZhV8NMf6nMZCsHK8su3UpfUTYxv6P7ZwvVt1GQ");
  export const collectionMasterEditionAccount = new PublicKey("2nJeMELovCrDEm4S4KArKcHkc2X5PtF3wgjuutmAEUVK");


