import {
  ConcurrentMerkleTreeAccount,
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Signer,
} from "@solana/web3.js";
import { WrappedConnection } from "../wrappedConnection";
import {
  createCreateTreeInstruction,
  createMintToCollectionV1Instruction,
  createRedeemInstruction,
  createTransferInstruction,
  MetadataArgs,
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
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
      treeAuthority,
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
  leafId: BN.BN
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

export const transferAsset = async (
  connectionWrapper: WrappedConnection,
  owner: PublicKey,
  newOwner: PublicKey,
  assetId: string
) => {
  console.log(
    `Transfering asset ${assetId} from ${owner.toBase58()} to ${newOwner.toBase58()}. 
    This will depend on indexer api calls to fetch the necessary data.`
  );
  let assetProof = await connectionWrapper.getAssetProof(assetId);
  if (!assetProof?.proof || assetProof.proof.length === 0) {
    throw new Error("Proof is empty");
  }
  let proofPath = assetProof.proof.map((node: string) => ({
    pubkey: new PublicKey(node),
    isSigner: false,
    isWritable: false,
  }));
  console.log("Successfully got proof path from RPC.");

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
  const canopyHeight = rpcAsset.compression.seq;
  // TODO: in the original example the proof path was sliced to canopyHeight. Not sure if that is needed. 
  const slicedProofPath = proofPath.slice(
    0,
    proofPath.length - (!!canopyHeight ? canopyHeight : 0)
  );
  console.log("CanopyHight: "+ canopyHeight+ " Sliced proof path: " + slicedProofPath);
  console.log("Proofpath: "+ proofPath.length);
  let transferIx = createTransferInstruction(
    {
      treeAuthority,
      leafOwner: new PublicKey(rpcAsset.ownership.owner),
      leafDelegate: leafDelegate,
      newLeafOwner: newOwner,
      merkleTree: new PublicKey(assetProof.tree_id),
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      anchorRemainingAccounts: proofPath,
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
  const voucher = await getVoucherPDA(new PublicKey(assetProof.tree_id), 0);
  const leafNonce = rpcAsset.compression.leaf_id;
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
