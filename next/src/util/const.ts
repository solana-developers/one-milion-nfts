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

  export const CollectionMint = new PublicKey("G8sPwd2jj4UXXyvTHKd6awFhi4aUQUZ7cbB3KRsPuXJU");
  export const TreeAccount = new PublicKey("tr4YwToCp79vnapocnujb6KbZpcbcRKdntBqgFW459P");

  export const collectionMetadataAccount = new PublicKey("7ns3EDsE1qaysniaR4guyBWihzmcCPisGRdpL262pmgU");
  export const collectionMasterEditionAccount = new PublicKey("n1kf6hEFtBd2ncY2MrMFffMN69LzjSVjScTTWrRGVZ7");

  /*
    ===Collection Details===
    Mint account: 7gZEKGK9V7iFRF79F3otjBp7jMuejMLirvovcgNofAhX
    Metadata account: HqAYQfkyMKDG5h4kUTaWCh45AYRHF95KHstYhgcf4Dy7
    Master edition account: 2jF5C8yErRtp52CgYY9YpuaYLQkS3gQ5UHWATUZzQxj3

    Main net

===Collection Details===
Mint account: G8sPwd2jj4UXXyvTHKd6awFhi4aUQUZ7cbB3KRsPuXJU
Metadata account: 7ns3EDsE1qaysniaR4guyBWihzmcCPisGRdpL262pmgU
Master edition account: n1kf6hEFtBd2ncY2MrMFffMN69LzjSVjScTTWrRGVZ7
  */

