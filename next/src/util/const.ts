import { PublicKey } from "@solana/web3.js";
import { WrappedConnection } from "../wrappedConnection";

export const CONNECTION = new WrappedConnection(process.env.NEXT_PUBLIC_RPC ? process.env.NEXT_PUBLIC_RPC : 'add your rpc here .env.local',  {
    wsEndpoint: process.env.NEXT_PUBLIC_WSS_RPC ? process.env.NEXT_PUBLIC_WSS_RPC : "wss:// add your rpc here .env.local",
    commitment: 'confirmed' 
  });

  export const METAPLEX_READAPI = "https://read-api.metaplex.com";
  export const REDIS_KEY = "allNfts3";

  export const CONNECTION_MAINNET = new WrappedConnection(process.env.NEXT_PUBLIC_RPC ? process.env.NEXT_PUBLIC_RPC : 'add your rpc here or as in .env.local',   {
    wsEndpoint: process.env.NEXT_PUBLIC_WSS_RPC ? process.env.NEXT_PUBLIC_WSS_RPC : "wss:// add your rpc here .env.local",
    commitment: 'confirmed' 
  });

  export const TreeAccount = new PublicKey("tr4YwToCp79vnapocnujb6KbZpcbcRKdntBqgFW459P");

  export const CollectionMint = new PublicKey("7Nbk8nKHXisM9busRg3aXHWmZ7J2uPTKBWcXieNJt6on");
  export const collectionMetadataAccount = new PublicKey("6SPni9gRv9vvqKD3y9aurL9DbEVVMrVXSATEiw8RDuh9");
  export const collectionMasterEditionAccount = new PublicKey("HXWEggbuy5WUDLrp11S4jaUn2YQJ3x7c53kBCDcWNH9U");
  
/*
export const CollectionMint = new PublicKey("7gZEKGK9V7iFRF79F3otjBp7jMuejMLirvovcgNofAhX");
export const collectionMetadataAccount = new PublicKey("HqAYQfkyMKDG5h4kUTaWCh45AYRHF95KHstYhgcf4Dy7");
export const collectionMasterEditionAccount = new PublicKey("2jF5C8yErRtp52CgYY9YpuaYLQkS3gQ5UHWATUZzQxj3");
*/

/*
=== Main net Collection Details 3 mutable===
Mint account: 7Nbk8nKHXisM9busRg3aXHWmZ7J2uPTKBWcXieNJt6on
Metadata account: 6SPni9gRv9vvqKD3y9aurL9DbEVVMrVXSATEiw8RDuh9
Master edition account: HXWEggbuy5WUDLrp11S4jaUn2YQJ3x7c53kBCDcWNH9U
collection json: https://shdw-drive.genesysgo.net/3guJ8ud32sragdu1JWUULCny1Qr7mMfynDuMv5nSqQ3a/collectionMeta.json
Nft json: https://shdw-drive.genesysgo.net/AzjHvXgqUJortnr5fXDG2aPkp2PfFMvu4Egr57fdiite/pixelMeta.json
*/ 

/*
DevNet
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



