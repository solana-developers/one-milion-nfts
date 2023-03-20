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

  export const CollectionMint = new PublicKey("7gZEKGK9V7iFRF79F3otjBp7jMuejMLirvovcgNofAhX");
  export const TreeAccount = new PublicKey("tr4YwToCp79vnapocnujb6KbZpcbcRKdntBqgFW459P");

  export const collectionMetadataAccount = new PublicKey("HqAYQfkyMKDG5h4kUTaWCh45AYRHF95KHstYhgcf4Dy7");
  export const collectionMasterEditionAccount = new PublicKey("2jF5C8yErRtp52CgYY9YpuaYLQkS3gQ5UHWATUZzQxj3");

  /*
    ===Collection Details===
    Mint account: 7gZEKGK9V7iFRF79F3otjBp7jMuejMLirvovcgNofAhX
    Metadata account: HqAYQfkyMKDG5h4kUTaWCh45AYRHF95KHstYhgcf4Dy7
    Master edition account: 2jF5C8yErRtp52CgYY9YpuaYLQkS3gQ5UHWATUZzQxj3
  */

