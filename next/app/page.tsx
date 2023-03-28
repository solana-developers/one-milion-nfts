"use client"; // this makes next know that this page should be rendered in the client
import React, { useEffect, useState } from "react";
import {
  CONNECTION,
  TreeAccount,
} from "@/src/util/const";
import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
const {gzip, ungzip} = require('node-gzip');

import { ConcurrentMerkleTreeAccount } from "@solana/spl-account-compression";
import { Grid } from "@/src/components/Grid";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { MyPixels } from "@/src/components/MyPixels";
import Upload from "@/src/ShadowDrive/ShadowDriveUpload";
import {
  decompress,
  redeemAsset,
  transferAsset,
} from "@/src/util/utils";
import TransferAdressInput from "@/src/components/TransferAdressInput";
import ColorPicker from "@/src/components/CustomColorPicker";
import { NftPixel } from "../src/components/Grid";
import { MyPixel } from "../src/components/MyPixels";
import { AppBar } from "@/src/components/AppBar";

export default function Home() {
  const [treeAccount, setTreeAccount] = useState<any>();
  const [allNFTsOfCollection, setAllNFTsOfCollection] = useState<any>();
  const [myNFTs, setMyNFTs] = useState<any>();
  const { publicKey, sendTransaction } = useWallet();
  const [color, setColor] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [transferInProgress, setTransferInProgress] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<MyPixel>();

  const colorSketchPickerOnOkHandle = (color: string) => {
    //console.log("Color picker: " + color);
    setColor(color);
  };

  const onTransferCancel = () => {
    setTransferInProgress(false);
  };

  const onTransferSubmit = async (address: string) => {
    if (!publicKey) {
      return;
    }
    setTransferInProgress(false);
    setLoading(true);
    try {
      console.log(
        "transfer to: " +
          address +
          " asset: " +
          selectedAsset?.id +
          " from: " +
          publicKey.toBase58()
      );
      const transaction = await transferAsset(
        CONNECTION,
        publicKey,
        new PublicKey(address),
        selectedAsset?.id
      );
      const signature = await sendTransaction(transaction, CONNECTION, {
        skipPreflight: true,
      });
      console.log("signature: " + signature);
      await CONNECTION.confirmTransaction(signature, "confirmed");
    
      const currentBaseUrl = window.location.href;
      let url =
          currentBaseUrl +
          "/api/transferSuccess?x=" +
          selectedAsset?.x  +
          "&y=" +
          selectedAsset?.y +
          "&pubkey=" + address;
        // After the mint we inform the backend that the transfer was successful to add it to the cache.
        await fetch(url);
        setLoading(false);
    } catch (error) {
      console.log(error);
      setTransferInProgress(false);
      setLoading(false);
    }
    getAssetsByOwner(publicKey);
    getCachedNftsFromAPI();
    setTransferInProgress(false);
  };

  const getMerkelTreeInfo = async () => {
    console.log("Load tree data");
    let treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
      CONNECTION,
      TreeAccount
    );
    //console.log(JSON.stringify(treeAccount));
    setTreeAccount(treeAccount);
  };

  async function getAssetsByOwner(ownerAddress: PublicKey) {
    const sortBy = {
      sortBy: "created",
      sortDirection: "asc",
    };
    const limit = 1000;
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
    //console.log(allAssetsOwned);
  }

  async function getCachedNftsFromAPI() {
    const currentBaseUrl = window.location.href;
    let result = await fetch(currentBaseUrl + "/api/nfts/");
    let data = await result.json();
    let base64Buffer = new Buffer(data.allNfts, 'base64');
    const unzippedData = await ungzip(base64Buffer)
    //console.log(unzippedData);

    setLoading(true);
    setAllNFTsOfCollection(unzippedData.toString());      
    setLoading(false);
  }

  // Get all pixels as soon as the page loads
  useEffect(() => {
    getMerkelTreeInfo();
    // This will be too slow for the whole collection since you can only get 1000 at a time so we cache the pixels in the backend and get them via API
    // getAssetsByGroup(CollectionMint.toBase58());
    getCachedNftsFromAPI();
    console.log("Request nfts");
  }, []);

  // Get user pixels as soon as his wallet is connected
  useEffect(() => {
    if (publicKey == undefined) {
      return;
    }
    setMyNFTs(undefined);
    getAssetsByOwner(publicKey);
  }, [publicKey]);

  const mintCompressedNFT = async (x: Number, y: Number, color: string) => {
    if (publicKey == undefined) {
      return;
    }
    setLoading(true);
    const getPartialSignedTransactionFromApiAndSign = async () => {
      try {
        const escapedColor = color.replace("#", "%23");
        const currentBaseUrl = window.location.href;
        console.log(currentBaseUrl);
        let url =
          currentBaseUrl +
          "/api/mint?x=" +
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
        const result = await CONNECTION.confirmTransaction(signature, "confirmed");
        if (result.value.err) {
          console.log("Mint failed "+ JSON.stringify(result.value.err));
          return;
        }

        url =
          currentBaseUrl +
          "/api/success?x=" +
          x +
          "&y=" +
          y +
          "&color=" +
          escapedColor +
          "&pubkey=" +
          publicKey.toBase58();
        // After the mint we inform the backend that the mint was successful to add it to the cache.
        // Probably not the best way to do it. We could also mint in the backend, but I don't have that much sol. 
        // Or use a helius webhook to listen to the tree and then update the cache. 

        // After the mint refresh the list of collection NFTs
        //await getAssetsByGroup(CollectionMint.toBase58());
        console.log("get assets by owner");
        getAssetsByOwner(publicKey);
        console.log("fetch nfts");
        await fetch(url);
        console.log("getCachedNftsFromAPI");
        await getCachedNftsFromAPI();
        console.log("getMerkelTreeInfo");
        getMerkelTreeInfo();

      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    await getPartialSignedTransactionFromApiAndSign();
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

  async function OnRedeemClicked(asset: string) {
    alert("Redeem is not ready yet. Don't use it. Helius can not handle the redeemed leafs yet.");
    return;
/*
    if (!publicKey) {
      alert("Please connect wallet to decompress your nft.");
      return;
    }
    console.log("Decompressing: " + asset);
    const transaction = await redeemAsset(CONNECTION, publicKey, asset);
    const signature = await sendTransaction(transaction, CONNECTION, {
      skipPreflight: true,
    });
    console.log("signature: " + signature);
    await CONNECTION.confirmTransaction(signature, "confirmed");*/
  }

  async function OnDecompressClicked(asset: string, name: string) {
    alert("You need to Redeem first and then Decompress. Helius can not handle the redeemed leafs yet.");
    return;
/*
    if (!publicKey) {
      alert("Please connect wallet to decompress your nft.");
      return;
    }
    console.log("Decompressing: " + asset);
    const transaction = await decompress(CONNECTION, publicKey, name, asset);
    const signature = await sendTransaction(transaction, CONNECTION, {
      skipPreflight: true,
    });
    console.log("signature: " + signature);
    await CONNECTION.confirmTransaction(signature, "confirmed");*/
  }

  async function OnTransferClicked(nftPixel: MyPixel) {
    if (!publicKey) {
      alert("Please connect wallet to transfer your NFT.");
      return;
    }
    setSelectedAsset(nftPixel);
    setTransferInProgress(true);
  }

  return (
    <div className="w-full min-h-screen bg-no-repeat bg-cover bg-center bg-fixed">
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
            assetId={selectedAsset?.id}
            nftPixel={selectedAsset}
          />
        </div>
      )}

      <AppBar/>

      <div className="w-full min-h-screen bg-no-repeat bg-cover bg-center bg-fixed bg-gradient-to-t from-gray-800 to-black pt-4">
        <div className="flex justify-center gap-0">
          {treeAccount && (<p className="text-fuchsia-50">
            Pixels Minted: {treeAccount.tree.sequenceNumber.toString()}
          </p>)}
        </div>             

        <h2 className="mt-0 mb-4 text-xl font-medium leading-tight text-primary text-center text-fuchsia-50">
          Pick a color - Use mouse wheel to zoom
        </h2>
       
        <div className="flex justify-center gap-0">
          <ColorPicker
            color={color}
            onChangeComplete={colorSketchPickerOnOkHandle}
          />
     
         </div>

         {!allNFTsOfCollection && (
            <>
              <div className="flex justify-center gap-0 ">
                <div className="loading-spinner">                  
                </div>
              </div>
            </>
        )}
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

        </div>
        {myNFTs && (myNFTs.items.length > 0) && (
            <>
              <div className="flex flex-col justify-center items-center">
                <p className="text-sky-400/100 text-center text-center">
                  Your Pixels
                </p>
              </div>

              <MyPixels
                onRedeemCallback={OnRedeemClicked}
                onDecompressCallback={OnDecompressClicked}
                onTransferCallback={OnTransferClicked}
                allNFTs={myNFTs}
              ></MyPixels>
            </>
          )}
        {/* These are some debug buttons for getting data */}
        <div className="flex-col justify-center">
          { /* Some buttons to interact with the merkle tree
          publicKey && (
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
                  getAssetsByOwner(publicKey);
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Get My Pixels By Owner
              </button>
              <button
                onClick={() => {
                  mintPixels(10);
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Mint 1000 Pixels
              </button>
              <button
                onClick={() => {
                  getCachedNftsFromAPI();
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                getCachedNftsFromAPI
              </button>
            </>
              )*/}
        </div>

        {/* Some merkle tree stats
          treeAccount && (
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
                )*/}
      </div>
    </div>
  );
}
