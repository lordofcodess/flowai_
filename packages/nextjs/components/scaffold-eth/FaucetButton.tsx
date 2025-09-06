"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { BanknotesIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

/**
 * FaucetButton button which directs users to Sepolia testnet faucets.
 */
export const FaucetButton = () => {
  const { address, chain: ConnectedChain } = useAccount();

  const { data: balance } = useWatchBalance({ address });

  const [loading, setLoading] = useState(false);

  const openFaucet = () => {
    // Open Sepolia faucet in new tab
    window.open("https://sepoliafaucet.com/", "_blank");
  };

  // Render only on Sepolia testnet
  if (ConnectedChain?.id !== 11155111) { // Sepolia chain ID
    return null;
  }

  const isBalanceZero = balance && balance.value === 0n;

  return (
    <div
      className={
        !isBalanceZero
          ? "ml-1"
          : "ml-1 tooltip tooltip-bottom tooltip-primary tooltip-open font-bold before:left-auto before:transform-none before:content-[attr(data-tip)] before:-translate-x-2/5"
      }
      data-tip="Get testnet ETH from Sepolia faucet"
    >
      <button className="btn btn-secondary btn-sm px-2 rounded-full" onClick={openFaucet} disabled={loading}>
        {!loading ? (
          <div className="flex items-center gap-1">
            <BanknotesIcon className="h-4 w-4" />
            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
          </div>
        ) : (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </button>
    </div>
  );
};
