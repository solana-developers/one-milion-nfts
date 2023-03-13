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

  export const CollectionMint = new PublicKey("5nz36yBLh6Rw9rm8hDzEfAn36gfT7tvYKeS82CFQuZZY");
  export const TreeAccount = new PublicKey("tr13LbiqVZCuuLWUnKAunkNrZVMw1H8fW3Eu9hqoNgv");

/*
  Mint account: 5nz36yBLh6Rw9rm8hDzEfAn36gfT7tvYKeS82CFQuZZY
  Metadata account: E4jD3VGdgJ3NjViv5TSHkDUmAwPWsULqXtJS46wVrdMz
  Master edition account: AopwdM84PcvAtG35V9kwfxn4HEDw8CV4eDsNLf1AHcJd
*/
