import React, { useState } from "react";
import { ShdwDrive } from "@shadow-drive/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { CONNECTION_MAINNET } from "../util/const";
import { tailwindColours } from '../ShadowDrive/tailwindColours';

//var nearestColor = require('nearest-color').from(tailwindColours);
  
export default function Upload() {
    const [file, setFile] = useState<File>(undefined)
    const [uploadUrl, setUploadUrl] = useState<String>(undefined)
    const [txnSig, setTxnSig] = useState<String>(undefined)
    const wallet = useWallet();

    const onSubmit = async (event: any) => {

        event.preventDefault()
        console.log(wallet);

        console.log(wallet?.publicKey);
        const drive = await new ShdwDrive(CONNECTION_MAINNET, wallet).init();

        // Use this to create a new storage account
        //const newAcct = await drive.createStorageAccount("pixelBucket","10MB", "v1")
        //console.log(newAcct)

        // My second V2 bucket: AzjHvXgqUJortnr5fXDG2aPkp2PfFMvu4Egr57fdiite
        // My V1 bucket: 

        // getting the context will allow to manipulate the image
        // WIP Create a pixel canvas and upload images per pixel color
        /*
        const compactColors = ['#4D4D4D', '#999999', '#FFFFFF', '#F44E3B', '#FE9200', '#FCDC00', '#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF', '#333333', '#808080', '#cccccc', '#D33115', '#E27300', '#FCC400', '#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF', '#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00', '#808900', '#194D33', '#0C797D', '#0062B1', '#653294', '#AB149E']
        
        var canvas = document.createElement('canvas');
        var height=100;
        var width=100;

        canvas.height=height;
        canvas.width=width;

        var context = canvas.getContext("2d");

        var imageData=context.createImageData(width, height);
        context.fillStyle="#4D4D4D";
        context.fillRect(0,0,1,1);

        console.log(createData("png","image/png"));
        function createData(type, mimetype) {
            var value=canvas.toDataURL(mimetype);
            if (value.indexOf(mimetype)>0) { // we check if the format is supported
                return {
                    type:type,
                    value:value
                }
            } else {
                return false;
            }
        }
        for (let i = 0; i < compactColors.length; i++) {
            const color = compactColors[i];            
        }
        */

        const accounts = await drive.getStorageAccounts("v2");
        const acc = accounts[0].publicKey;
        const getStorageAccount = await drive.getStorageAccount(acc);

        console.log(getStorageAccount);
        console.log(acc);

        const upload = await drive.uploadFile(acc, file);
        console.log(upload);
        setUploadUrl(upload.finalized_locations)
        setTxnSig(upload.transaction_signature)        
    }

    return (
        <div>
            <form onSubmit={onSubmit}>
                <h1 className="text-white">Shadow Drive File Upload</h1>
                <input className="text-white" type="file" onChange={e => setFile(e.target.files[0])} />
                <br />
                <button className="text-white" type="submit">Upload</button>
            </form>
            <span className="text-white">You may have to wait 60-120s for the URL to appear</span>
            <div>
                {(uploadUrl) ? (
                    <div>
                        <h3 className="text-white">Success!</h3>
                        <h4 className="text-white">URL: {uploadUrl}</h4>
                        <h4 className="text-white">Sig: {txnSig}</h4>
                    </div>
                ) : (<div></div>)
                }
            </div>
        </div>
    )
}