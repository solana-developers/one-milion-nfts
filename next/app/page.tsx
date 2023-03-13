"use client"; // this makes next know that this page should be rendered in the client
import React, { useEffect, useRef, useState } from "react";
import { CollectionMint, CONNECTION, TreeAccount } from "@/src/util/const";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

import { ConcurrentMerkleTreeAccount } from "@solana/spl-account-compression";
import { Grid } from "@/src/components/Grid";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { MyPixels } from "@/src/components/MyPixels";
import Upload from "@/src/ShadowDrive/ShadowDriveUpload";
import { redeemAsset, transferAsset } from "@/src/util/utils";
import TransferAdressInput from "@/src/components/TransferAdressInput";
import ColorPicker from "@/src/components/CustomColorPicker";

export default function Home() {
  const [treeAccount, setTreeAccount] = useState<any>();
  const [allNFTsOfCollection, setAllNFTsOfCollection] = useState<any>();
  const [myNFTs, setMyNFTs] = useState<any>();
  const { publicKey, sendTransaction } = useWallet();
  const [color, setColor] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [transferInProgress, setTransferInProgress] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState("");

  const colorSketchPickerOnOkHandle = (color: string) => {
    console.log("Color picker: " + color);
    setColor(color);
  };

  const onTransferCancel = () => {
    setTransferInProgress(false);
  };

  const onTransferSubmit = async (address: string) => {
    if (!publicKey) {
      return;
    }
    try {
      console.log(publicKey.toBase58());
      console.log(
        "transfer to: " +
          address +
          " asset: " +
          selectedAsset +
          " from: " +
          publicKey.toBase58()
      );
      const transaction = await transferAsset(
        CONNECTION,
        publicKey,
        new PublicKey(address),
        selectedAsset
      );
      const signature = await sendTransaction(transaction, CONNECTION, {
        skipPreflight: true,
      });
      console.log("signature: " + signature);
      await CONNECTION.confirmTransaction(signature, "confirmed");
      console.log(address);
    } catch (error) {
      console.log(error);
      setTransferInProgress(false);
    }
    getAssetsByOwner(publicKey);
    setTransferInProgress(false);
  };

  const getMerkelTreeInfo = async () => {
    console.log("load tree");
    let treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
      CONNECTION,
      TreeAccount
    );
    console.log(treeAccount);
    setTreeAccount(treeAccount);
  };

  async function getAssetsByOwner(ownerAddress: PublicKey) {
    const sortBy = {
      sortBy: "created",
      sortDirection: "asc",
    };
    const limit = 500;
    const page = 1;
    const before = "";
    const after = "";
    const allAssetsOwned = await CONNECTION.getAssetsByOwner(
      ownerAddress.toBase58(),
      sortBy,
      limit,
      page,
      before,
      after
    );

    setMyNFTs(allAssetsOwned);
    console.log(allAssetsOwned);
  }

  async function getAssetsByGroup(collection: string) {
    const sortBy = {
      sortBy: "created",
      sortDirection: "asc",
    };
    const limit = 500;
    const page = 1;
    const before = "";
    const after = "";
    const allAssetsOwned = await CONNECTION.getAssetsByGroup(
      "collection",
      collection,
      sortBy,
      limit,
      page,
      before,
      after
    );

    setAllNFTsOfCollection(allAssetsOwned);
    console.log(allAssetsOwned);
  }

  // Get all pixels as soon as the page loads
  useEffect(() => {
    getMerkelTreeInfo();
    getAssetsByGroup(CollectionMint.toBase58());
  }, []);

  // Get user pixels as soon as his wallet is connected
  useEffect(() => {
    if (publicKey == undefined) {
      return;
    }
    getAssetsByOwner(publicKey);
  }, [publicKey]);

  const mintCompressedNFT = async (x: Number, y: Number, color: string) => {
    if (publicKey == undefined) {
      return;
    }
    setLoading(true);
    const getpartialSignedTransactionFromApiAndSign = async () => {
      try {
        const escapedColor = color.replace("#", "%23");
        const currentBaseUrl = window.location.href;
        console.log(currentBaseUrl);
        const url =
        currentBaseUrl+"/api/mint?x=" +
          x +
          "&y=" +
          y +
          "&color=" +
          escapedColor +
          "&pubkey=" +
          publicKey.toBase58();

        console.log(url);

        const response = await fetch(url);
        const jsonResponse = await response.json(); //extract JSON from the http response

        const decodedTx = Buffer.from(jsonResponse.transaction, "base64");
        const transaction = Transaction.from(decodedTx);

        const signature = await sendTransaction(transaction, CONNECTION, {
          skipPreflight: true,
        });
        console.log("Mint Signature: " + signature);
        await CONNECTION.confirmTransaction(signature, "confirmed");
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    await getpartialSignedTransactionFromApiAndSign();

    // After the mint refresh the list of collection NFTs
    await getAssetsByGroup(CollectionMint.toBase58());
    await getAssetsByOwner(publicKey);
    setLoading(false);
  };

  function OnGridItemClicked(x: Number, y: Number): void {
    if (!publicKey) {
      alert("Please connect wallet to mint a pixel.");
      return;
    }
    if (color == "") {
      alert("Pick a Color.");
      return;
    }
    console.log("Clicked on x:" + x + " y:" + y + " color:" + color);

    mintCompressedNFT(x, y, color);
  }

  async function OnDecompressClicked(asset: string) {
    if (!publicKey) {
      alert("Please connect wallet to decompress your nft.");
      return;
    }
    const transaction = await redeemAsset(CONNECTION, publicKey, asset);
    const signature = await sendTransaction(transaction, CONNECTION, {
      skipPreflight: true,
    });
    console.log("signature: " + signature);
    await CONNECTION.confirmTransaction(signature, "confirmed");
  }

  async function OnTransferClicked(asset: string) {
    if (!publicKey) {
      alert("Please connect wallet to transfer your NFT.");
      return;
    }
    setSelectedAsset(asset);
    setTransferInProgress(true);
  }

  return (
    <div className="w-full min-h-screen bg-no-repeat bg-cover bg-center bg-fixed bg-[url('../public/bg.png')]">
      {/* {publicKey && <Upload/>} This is a shadow drive implementation in case you want to upload meta data or images*/}

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      {transferInProgress && (
        <div className="fixed inset-0 flex items-center justify-center">
          <TransferAdressInput
            onCancelCallback={onTransferCancel}
            onTransferCallback={onTransferSubmit}
          />
        </div>
      )}

      <div className="absolute ...">{treeAccount && <WalletMultiButton />}</div>

      <div className="w-full min-h-screen bg-no-repeat bg-cover bg-center bg-fixed bg-slate-900 bg-opacity-70 pt-4">
        <h1 className="mt-0 mb-2 text-5xl font-medium leading-tight text-primary text-center text-white">
          The One Million NFT Page 2
        </h1>

        <div className="flex justify-center gap-0">
          <ColorPicker
            color={color}
            onChangeComplete={colorSketchPickerOnOkHandle}
          />
        </div>
        <h6 className="mt-0 mb-2 text-s font-medium leading-tight text-primary text-center text-white">
          Pick a color - Use mouse wheel to zoom
        </h6>

        <div className="card flex justify-content-center"></div>

        <div className="flex justify-center gap-0">
          {allNFTsOfCollection && (
            <>
              <Grid
                onClickCallback={OnGridItemClicked}
                allNFTs={allNFTsOfCollection}
                selectedColor={color}
              ></Grid>
            </>
          )}
          {myNFTs && (
            <>
              <MyPixels
                onRedeemCallback={OnDecompressClicked}
                onTransferCallback={OnTransferClicked}
                allNFTs={myNFTs}
              ></MyPixels>
            </>
          )}
        </div>

        {/* These are some debug buttons for getting data */}
        <div className="flex-col justify-center">
          {publicKey && (
            <>
              <button
                onClick={() => {
                  getMerkelTreeInfo();
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Get Merkel Tree
              </button>
              <button
                onClick={() => {
                  getAssetsByGroup(CollectionMint.toBase58());
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Get All Pixels By Collection
              </button>
              <button
                onClick={() => {
                  getAssetsByOwner(publicKey);
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Get My Pixels By Owner
              </button>
            </>
          )}
        </div>

        {treeAccount && (
          <>
            <ul className="list-disc">
              <li className="text-sky-400/100"> Merkle tree info</li>
              <li className="text-sky-400/100">
                {" "}
                canopyHeight: ({treeAccount.getCanopyDepth().toString()})
              </li>
              <li className="text-sky-400/100">
                {" "}
                activeIndex: ({treeAccount.tree.activeIndex.toString()})
              </li>
              <li className="text-sky-400/100">
                {" "}
                bufferSize: ({treeAccount.tree.bufferSize.toString()})
              </li>
              <li className="text-sky-400/100">
                {" "}
                rightMostPath: (
                {treeAccount.tree.rightMostPath.index.toString()})
              </li>
              <li className="text-sky-400/100">
                {" "}
                sequenceNumber: ({treeAccount.tree.sequenceNumber.toString()}){" "}
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
