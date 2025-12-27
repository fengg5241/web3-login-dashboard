"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

const SEPOLIA_CHAIN_ID = 11155111;

export default function SwitchNetworkButton() {
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);

    const loadNetwork = async () => {
      const network = await provider.getNetwork();
      setCurrentChainId(Number(network.chainId));
    };

    loadNetwork();

    const handleChainChanged = (chainIdHex: string) => {
      setCurrentChainId(parseInt(chainIdHex, 16));
    };

    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    setLoading(true);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // 11155111
      });
    } catch (error: any) {
      // Chain not added
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia",
              rpcUrls: ["https://rpc.sepolia.org"],
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "ETH",
                decimals: 18,
              },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentChainId) return null;

  if (currentChainId === SEPOLIA_CHAIN_ID) {
    return (
      <div style={{ marginBottom: 16, color: "green" }}>
        Connected to Sepolia
      </div>
    );
  }

  return (
    <button onClick={switchToSepolia} disabled={loading}>
      {loading ? "Switching..." : "Switch to Sepolia"}
    </button>
  );
}
