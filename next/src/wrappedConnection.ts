import { Connection } from "@solana/web3.js";
import axios from "axios";

export class WrappedConnection extends Connection {
  async getAsset(assetId: any): Promise<any> {
    try {
      const response = await axios.post(this.rpcEndpoint, {
        jsonrpc: "2.0",
        method: "get_asset",
        id: "compression-example",
        params: [assetId],
      });
      return response.data.result;
    } catch (error) {
      console.error(error);
    }
  }

  async getAssetProof(assetId: any): Promise<any> {
    try {
      const response = await axios.post(this.rpcEndpoint, {
        jsonrpc: "2.0",
        method: "get_asset_proof",
        id: "compression-example",
        params: [assetId],
      });
      return response.data.result;
    } catch (error) {
      console.error(error);
    }
  }

  async getAssetsByOwner(
    assetId: string,
    sortBy: any,
    limit: number,
    page: number,
    before: string,
    after: string
  ): Promise<any> {
    try {
      const response = await axios.post(this.rpcEndpoint, {
        jsonrpc: "2.0",
        method: "get_assets_by_owner",
        id: "compression-example",
        params: [assetId, sortBy, limit, page, before, after],
      });
      console.log("Owner response" + response.data);
      return response.data.result;
    } catch (error) {
      console.log("Owner response");
      console.error(error);
    }
  }

  async getAssetsByCreator(
    assetId: string,
    sortBy: any,
    limit: number,
    page: number,
    before: string,
    after: string
  ): Promise<any> {
    try {
      const response = await axios.post(this.rpcEndpoint, {
        jsonrpc: "2.0",
        method: "get_assets_by_creator",
        id: "compression-example",
        params: [assetId, true, sortBy, limit, page, null, null],
      });

      return response.data.result;
    } catch (error) {
      console.error(error);
    }
  }

  async getAssetsByAuthority(
    assetId: string,
    sortBy: any,
    limit: number,
    page: number,
    before: string,
    after: string
  ): Promise<any> {
    try {
      const response = await axios.post(this.rpcEndpoint, {
        jsonrpc: "2.0",
        method: "get_assets_by_authority",
        id: "compression-example",
        params: [assetId, sortBy, limit, page, before, after],
      });
      return response.data.result;
    } catch (error) {
      console.error(error);
    }
  }
  async getAssetsByGroup(
    groupKey: string,
    groupValue: string,
    sortBy: any,
    limit: number,
    page: number,
    before: string,
    after: string
  ): Promise<any> {
    try {
      const response = await axios.post(this.rpcEndpoint, {
        jsonrpc: "2.0",
        method: "get_assets_by_group",
        id: "rpd-op-123",
        params: [groupKey, groupValue, sortBy, limit, page, before, after],
      });
      return response.data.result;
    } catch (error) {
      console.error(error);
    }
  }
}
