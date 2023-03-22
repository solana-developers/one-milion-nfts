import { Connection } from "@solana/web3.js";
import axios from "axios";
import { METAPLEX_READAPI } from "./util/const";

export class WrappedConnection extends Connection {
  async getAsset(assetId: any): Promise<any> {
    try {
      const response = await axios.post(METAPLEX_READAPI, {
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
      const response = await axios.post(METAPLEX_READAPI, {
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
      const response = await axios.post(METAPLEX_READAPI, {
        jsonrpc: "2.0",
        method: "get_assets_by_owner",
        id: "rpd-op-123",
        params: [assetId, sortBy, limit, page, before, after],
      });
      //console.log("getAssetsByOwner: " + JSON.stringify(response.data));
      return response.data.result;
    } catch (error) {
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
      const response = await axios.post(METAPLEX_READAPI, {
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
      const response = await axios.post(METAPLEX_READAPI, {
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
      let events = [];

      const response = await axios.post(METAPLEX_READAPI, {
        jsonrpc: "2.0",
        method: "get_assets_by_group",
        id: "rpd-op-123",
        params: [groupKey, groupValue, sortBy, limit, page, before, after],
      });
      events.push(...response.data.result.items);

      return events;
    } catch (error) {
      console.error(error);
    }
  }

  async getAllAssetsByGroup(
    groupKey: string,
    groupValue: string,
    sortBy: any,
    limit: number,
    page: number,
    before: string,
    after: string
  ): Promise<any> {
    try {
      let events = [];
      let response = await axios.post(METAPLEX_READAPI, {
        jsonrpc: "2.0",
        method: "get_assets_by_group",
        id: "rpd-op-123",
        params: [groupKey, groupValue, sortBy, limit, page, before, after],
      });

      events.push(...response.data.result.items);

      while (true) {        
        console.log("Requested page" + page);

        page += 1;
        response = await axios.post(METAPLEX_READAPI, {
          jsonrpc: "2.0",
          method: "get_assets_by_group",
          id: "rpd-op-123",
          params: [groupKey, groupValue, sortBy, limit, page, before, after],
        });

        events.push(...response.data.result.items);
        if (events.length % 1000 != 0 || response.data.result.items.length == 0) {
          break;
        }
      }

      return events;
    } catch (error) {
      console.error(error);
    }
  }

}


