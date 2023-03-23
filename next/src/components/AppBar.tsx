import { FC } from 'react';
import Link from "next/link";
import dynamic from 'next/dynamic';
import React from "react";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const AppBar: React.FC = () => {
  return (
    <div>
      <nav className="border-gray-200 px-2 sm:px-4 py-2.5 bg-black">
        <div className="container flex flex-wrap items-center justify-between mx-auto">
          <a href="https://solana.com/" className="flex items-center">
            <div className="md:w-full text-2x1 md:text-4xl text-center text-white my-2">
              One Million NFTs
            </div>
          </a>
          <div className="md:inline-flex align-items-center justify-items gap-6">
            <WalletMultiButtonDynamic className="btn-ghost btn-sm rounded-btn text-lg mr-6 " />
          </div>
        </div>
      </nav>
    </div>
  );
};
