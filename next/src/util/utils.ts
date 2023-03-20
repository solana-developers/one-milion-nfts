import {
  ConcurrentMerkleTreeAccount,
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  MerkleTree
} from "@solana/spl-account-compression";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Signer,
  AccountMeta,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { WrappedConnection } from "../wrappedConnection";
import {
  createCreateTreeInstruction,
  createDecompressV1Instruction,
  createMintToCollectionV1Instruction,
  createRedeemInstruction,
  createTransferInstruction,
  Creator,
  MetadataArgs,
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  TokenProgramVersion,
  TokenStandard,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  createSetCollectionSizeInstruction,
  Key,
} from "@metaplex-foundation/mpl-token-metadata";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@project-serum/anchor";
import {
  bufferToArray,
  execute,
  getBubblegumAuthorityPDA,
  getVoucherPDA,
} from "./helpers";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { CollectionMint } from "./const";

// Creates a new merkle tree for compression.
export const initTree = async (
  connectionWrapper: WrappedConnection,
  payerKeypair: Keypair,
  treeKeypair: Keypair,
  maxDepth: number = 14,
  maxBufferSize: number = 64
) => {
  const payer = payerKeypair.publicKey;
  const space = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize, maxBufferSize);
  const [treeAuthority, _bump] = await PublicKey.findProgramAddress(
    [treeKeypair.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );
  const allocTreeIx = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: treeKeypair.publicKey,
    lamports: await connectionWrapper.getMinimumBalanceForRentExemption(space),
    space: space,
    programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  });
  const createTreeIx = createCreateTreeInstruction(
    {
      merkleTree: treeKeypair.publicKey,
      treeAuthority,
      treeCreator: payer,
      payer,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    },
    {
      maxBufferSize,
      maxDepth,
      public: false,
    },
    BUBBLEGUM_PROGRAM_ID
  );
  let tx = new Transaction().add(allocTreeIx).add(createTreeIx);
  tx.feePayer = payer;
  try {
    console.log("sending txn");
    await sendAndConfirmTransaction(
      connectionWrapper,
      tx,
      [treeKeypair, payerKeypair],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );
    console.log(
      "Successfull created merkle tree for account: " + treeKeypair.publicKey
    );
  } catch (e) {
    console.error("Failed to create merkle tree: ", e);
    throw e;
  }
};

export function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r: number, g: number, b: number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// Creates a metaplex collection NFT
export const initCollection = async (
  connectionWrapper: WrappedConnection,
  payer: Keypair
) => {
  const collectionMint = await Token.createMint(
    connectionWrapper,
    payer,
    payer.publicKey,
    payer.publicKey,
    0,
    TOKEN_PROGRAM_ID
  );
  const collectionTokenAccount = await collectionMint.createAccount(
    payer.publicKey
  );
  await collectionMint.mintTo(collectionTokenAccount, payer, [], 1);
  const [collectionMetadataAccount, _b] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.publicKey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  const collectionMeatadataIX = createCreateMetadataAccountV3Instruction(
    {
      metadata: collectionMetadataAccount,
      mint: collectionMint.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: "Many NFT",
          symbol: "ONEM",
          uri: "https://metadata.y00ts.com/y/collection.json",
          sellerFeeBasisPoints: 100,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: false,
        collectionDetails: null,
      },
    }
  );
  const [collectionMasterEditionAccount, _b2] =
    await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.publicKey.toBuffer(),
        Buffer.from("edition", "utf8"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
  const collectionMasterEditionIX = createCreateMasterEditionV3Instruction(
    {
      edition: collectionMasterEditionAccount,
      mint: collectionMint.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
      metadata: collectionMetadataAccount,
    },
    {
      createMasterEditionArgs: {
        maxSupply: 0,
      },
    }
  );

  const sizeCollectionIX = createSetCollectionSizeInstruction(
    {
      collectionMetadata: collectionMetadataAccount,
      collectionAuthority: payer.publicKey,
      collectionMint: collectionMint.publicKey,
    },
    {
      setCollectionSizeArgs: { size: 50 },
    }
  );

  let tx = new Transaction()
    .add(collectionMeatadataIX)
    .add(collectionMasterEditionIX)
    .add(sizeCollectionIX);
  try {
    await sendAndConfirmTransaction(connectionWrapper, tx, [payer], {
      commitment: "confirmed",
      skipPreflight: true,
    });
    console.log(
      "Successfull created NFT collection with collection address: " +
        collectionMint.publicKey.toBase58()
    );
    return {
      collectionMint,
      collectionMetadataAccount,
      collectionMasterEditionAccount,
    };
  } catch (e) {
    console.error("Failed to init collection: ", e);
    throw e;
  }
};

export const getCollectionDetailsFromMintAccount = async (
  connectionWrapper: WrappedConnection,
  collectionMintAccount: PublicKey,
  payer: PublicKey
) => {

  const [collectionMetadataAccount, _b] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMintAccount.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  const [collectionMasterEditionAccount, _b2] =
    await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata", "utf8"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMintAccount.toBuffer(),
        Buffer.from("edition", "utf8"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
  return {
    collectionMetadataAccount,
    collectionMasterEditionAccount,
  };
};

// Avoid re-creating the collection each time. You can re-create it by commenting out the conditions.
// Retrieves or initializes a collection for the given mint account.
export const getOrInitCollection = async (
  connectionWrapper: WrappedConnection,
  collectionMintAccount: PublicKey,
  owner: Keypair
) => {
  const collectionMintInfo = await connectionWrapper.getAccountInfo(
    collectionMintAccount
  );
  if (collectionMintInfo?.data) {
    console.log("Collection details already exist.");
    return await getCollectionDetailsFromMintAccount(
      connectionWrapper,
      collectionMintAccount,
      owner.publicKey
    );
  } else {
    console.log("Collection does not exist. Initializing.");
    return await initCollection(connectionWrapper, owner);
  }
};

export const mintCompressedNft = async (
  connectionWrapper: WrappedConnection,
  nftArgs: MetadataArgs,
  ownerKeypair: PublicKey,
  treeKeypair: PublicKey,
  collectionMint: PublicKey,
  collectionMetadata: PublicKey,
  collectionMasterEditionAccount: PublicKey,
  feepayer: PublicKey
) => {
  const [treeAuthority, _bump] = await PublicKey.findProgramAddress(
    [treeKeypair.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );
  const [bgumSigner, __] = await PublicKey.findProgramAddress(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID
  );
  const mintIx = createMintToCollectionV1Instruction(
    {
      merkleTree: treeKeypair,
      treeAuthority: treeAuthority,
      treeDelegate: ownerKeypair,
      payer: feepayer, 
      leafDelegate: feepayer,
      leafOwner: feepayer,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      collectionAuthority: ownerKeypair,
      collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
      collectionMint: collectionMint,
      collectionMetadata: collectionMetadata,
      editionAccount: collectionMasterEditionAccount,
      bubblegumSigner: bgumSigner,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    },
    {
      metadataArgs: Object.assign(nftArgs, {
        collection: { key: collectionMint, verified: false },
      }),
    }
  );
  const tx = new Transaction().add(mintIx);
  tx.feePayer = feepayer;
  
  return tx;
};

export const getLastCompressedNftIdFromTree = async (
  connectionWrapper: WrappedConnection,
  treeKeypair: Keypair
) => {
  let mkAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
    connectionWrapper,
    treeKeypair.publicKey
  );
  let canopyHeight = mkAccount.getCanopyDepth();
  console.log("Canopy height of tree: " + canopyHeight);
  
  console.log("activeIndex: " + mkAccount.tree.activeIndex);
  console.log("bufferSize: " + mkAccount.tree.bufferSize);
  console.log("rightMostPath: " + mkAccount.tree.rightMostPath.index);
  console.log("sequenceNumber: " + mkAccount.tree.sequenceNumber);

  const leafIndex = new BN.BN(mkAccount.tree.rightMostPath.index - 1);
  // grabbing the asset id so that it can be passed to transfer
  const [assetId] = await PublicKey.findProgramAddress(
    [
      Buffer.from("asset", "utf8"),
      treeKeypair.publicKey.toBuffer(),
      Uint8Array.from(leafIndex.toArray("le", 8)),
    ],
    BUBBLEGUM_PROGRAM_ID
  );
  return assetId;
};

export const getCompressedNftIdFromTreeById = async (
  connectionWrapper: WrappedConnection,
  treeKeypair: Keypair,
  leafId: BN
) => {
  let mkAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
    connectionWrapper,
    treeKeypair.publicKey
  );
  let canopyHeight = mkAccount.getCanopyDepth();
  const leafIndex = new BN.BN(leafId);
  // grabbing the asset id so that it can be passed to transfer
  const [assetId] = await PublicKey.findProgramAddress(
    [
      Buffer.from("asset", "utf8"),
      treeKeypair.publicKey.toBuffer(),
      Uint8Array.from(leafIndex.toArray("le", 8)),
    ],
    BUBBLEGUM_PROGRAM_ID
  );
  return assetId;
};

export const mapProof = (assetProof: { proof: string[] }): AccountMeta[] => {
  if (!assetProof.proof || assetProof.proof.length === 0) {
    throw new Error("Proof is empty");
  }
  return assetProof.proof.map((node) => ({
    pubkey: new PublicKey(node),
    isSigner: false,
    isWritable: false,
  }));
};

export const transferAsset = async (
  connectionWrapper: WrappedConnection,
  owner: PublicKey,
  newOwner: PublicKey,
  assetId: string | undefined
) => {
  console.log(
    `Transfering asset ${assetId} from ${owner.toBase58()} to ${newOwner.toBase58()}. 
    This will depend on indexer api calls to fetch the necessary data.`
  );

  let assetProof = await connectionWrapper.getAssetProof(assetId);
  console.log("assetProof: " + assetProof);

  if (!assetProof?.proof || assetProof.proof.length === 0) {
    throw new Error("Proof is empty");
  }

  let proofPath = mapProof(assetProof);

  const rpcAsset = await connectionWrapper.getAsset(assetId);
  console.log(
    "Successfully got asset from RPC. Current owner: " +
      rpcAsset.ownership.owner + " asset:" + rpcAsset
  );
  if (rpcAsset.ownership.owner !== owner.toBase58()) {
    throw new Error(
      `NFT is not owned by the expected owner. Expected ${owner.toBase58()} but got ${
        rpcAsset.ownership.owner
      }.`
    );
  }

  const leafNonce = rpcAsset.compression.leaf_id;
  const treeAuthority = await getBubblegumAuthorityPDA(
    new PublicKey(assetProof.tree_id)
  );

  const leafDelegate = rpcAsset.ownership.delegate
    ? new PublicKey(rpcAsset.ownership.delegate)
    : new PublicKey(rpcAsset.ownership.owner);

  console.log("Delegate: " + leafDelegate.toBase58() + " Owner: " + rpcAsset.ownership.owner);

  let mkAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
    connectionWrapper,
    new PublicKey(assetProof.tree_id)
  );

  console.log("rpcAsset: " + JSON.stringify(rpcAsset));

  console.log("assetProof: " + JSON.stringify(assetProof));

  const MerkleTreeProof = {
    leafIndex: leafNonce,
    leaf: rpcAsset.compression.asset_hash,
    proof: assetProof.proof.map((node:any) => bs58.decode(node)),
    root: bs58.decode(assetProof.root)
  };  
  console.log("rpcAsset: " + JSON.stringify(MerkleTreeProof));

  const isValide= MerkleTree.verify(assetProof.root, MerkleTreeProof, true);
 
  console.log("Is valid: " + isValide);

  let canopyHeight = mkAccount.getCanopyDepth();

  let slicedProofPath = proofPath.slice(
    0,
    proofPath.length - (!!canopyHeight ? canopyHeight : 0)
  )
  console.log("CanopyHight: "+ canopyHeight+ " Sliced proof path: " + slicedProofPath.length + " proof path: " + proofPath.length);
  let transferIx = createTransferInstruction(
    {
      treeAuthority,
      leafOwner: new PublicKey(rpcAsset.ownership.owner),
      leafDelegate: leafDelegate,
      newLeafOwner: newOwner,
      merkleTree: new PublicKey(assetProof.tree_id),
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      anchorRemainingAccounts: slicedProofPath,
    },
    {
      root: bufferToArray(bs58.decode(slicedProofPath[0].pubkey.toBase58())),
      dataHash: bufferToArray(
        bs58.decode(rpcAsset.compression.data_hash.trim())
      ),
      creatorHash: bufferToArray(
        bs58.decode(rpcAsset.compression.creator_hash.trim())
      ),
      nonce: leafNonce,
      index: leafNonce,
    }
  );
  const tx = new Transaction().add(transferIx);
  tx.feePayer = owner;
  return tx;
};

export const redeemAsset = async (
  connectionWrapper: WrappedConnection,
  owner: PublicKey,
  assetId?: string
) => {
  let assetProof = await connectionWrapper.getAssetProof(assetId);
  const rpcAsset = await connectionWrapper.getAsset(assetId);
  const leafNonce = rpcAsset.compression.leaf_id;
  console.log("leafNonce: " + leafNonce); 
  const voucher = await getVoucherPDA(new PublicKey(assetProof.tree_id), rpcAsset.compression.leaf_id);
  console.log("voucher: " + voucher.toBase58());
  const treeAuthority = await getBubblegumAuthorityPDA(
    new PublicKey(assetProof.tree_id)
  );
  const leafDelegate = rpcAsset.ownership.delegate
    ? new PublicKey(rpcAsset.ownership.delegate)
    : new PublicKey(rpcAsset.ownership.owner);
  const redeemIx = createRedeemInstruction(
    {
      treeAuthority,
      leafOwner: new PublicKey(rpcAsset.ownership.owner),
      leafDelegate,
      merkleTree: new PublicKey(assetProof.tree_id),
      voucher,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      anchorRemainingAccounts: mapProof(assetProof),
    },
    {
      root: bufferToArray(bs58.decode(assetProof.root)),
      dataHash: bufferToArray(
        bs58.decode(rpcAsset.compression.data_hash.trim())
      ),
      creatorHash: bufferToArray(
        bs58.decode(rpcAsset.compression.creator_hash.trim())
      ),
      nonce: leafNonce,
      index: leafNonce,
    }
  );
  const tx = new Transaction().add(redeemIx);
  tx.feePayer = owner;
  return tx;
};

export const decompress = async (
  connectionWrapper: WrappedConnection,
  owner: PublicKey,
  name: String,
  assetId?: string,
) => {
  let assetProof = await connectionWrapper.getAssetProof(assetId);
  const rpcAsset = await connectionWrapper.getAsset(assetId);
  const leafNonce = rpcAsset.compression.leaf_id;
  console.log("leafNonce: " + leafNonce); 
  const voucher = await getVoucherPDA(new PublicKey(assetProof.tree_id), rpcAsset.compression.leaf_id);
  console.log("voucher: " + voucher.toBase58());

  const { collectionMetadataAccount, collectionMasterEditionAccount } =
    await getCollectionDetailsFromMintAccount(
      connectionWrapper,
      CollectionMint,
      owner
    );

  console.log("\n===Collection Details===");
  console.log("Mint account: " + CollectionMint.toBase58());
  console.log("Metadata account: " + collectionMetadataAccount.toBase58());
  console.log(
    "Master edition account: " + collectionMasterEditionAccount.toBase58()
  );
  console.log("\n");

  const tokenAccount = await findAssociatedTokenAddress(owner, CollectionMint); 

  const creators: Creator[] = [ { address: new PublicKey("uNgdaBH6cmrq57dBdqXCi6AdTEXHMjFe8wnzutfXVNf"), verified: true, share: 100 } ];

  const x = name.split(".")[0];
  const y = name.split(".")[1].split("-")[0];
  const color = name.split(".")[1].split("-")[1];

  const unescapedColor = color.replace("%23", "#");

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
    sellerFeeBasisPoints: 0,
    isMutable: false,
  };

  // Voucher: 9B4QxTpv8H4Uod369ykQpg5v3XbtRWqGpjhZTBz278WB
  console.log("voucher: " + voucher.toBase58());
  const redeemIx = createDecompressV1Instruction(
    {
      voucher: voucher,
      leafOwner: new PublicKey(rpcAsset.ownership.owner),
      tokenAccount: tokenAccount,
      mint: new PublicKey("4stVftUTbGgeJxjx9PMWiu2vukCZM1EQU7GKEfhLHJGP"),
      mintAuthority: new PublicKey("HFZocwgmBd6BbDbCfiAMkDdYj9VZngKwXFu6xkNLB4PZ"),
      metadata: collectionMetadataAccount,
      masterEdition: collectionMasterEditionAccount,
      systemProgram: SystemProgram.programId,
      sysvarRent: SYSVAR_RENT_PUBKEY,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: SPL_NOOP_PROGRAM_ID,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      anchorRemainingAccounts: mapProof(assetProof),
    },
    {
      metadata: nftArgs,
    }
  );
  const tx = new Transaction().add(redeemIx);
  tx.feePayer = owner;
  return tx;
};

async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> {
  return (await PublicKey.findProgramAddress(
      [
          walletAddress.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenMintAddress.toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  ))[0];
}
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);