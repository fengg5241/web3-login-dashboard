"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const TOKENS = [
  {
    symbol: "USDC",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  {
    symbol: "DAI",
    address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
  },
  {
    symbol: "WETH",
    address: "0xdd13E55209Fd76AfE204dBda4007C227904f0a81",
  },
];

interface TokenBalance {
  symbol: string;
  balance: string;
}

export default function TokenBalances({ address }: { address: string }) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchBalances = async () => {
      setLoading(true);

      try {
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_RPC_URL
        );

        const results: TokenBalance[] = [];

        for (const token of TOKENS) {
          const contract = new ethers.Contract(
            token.address,
            ERC20_ABI,
            provider
          );

          const [rawBalance, decimals, symbol] = await Promise.all([
            contract.balanceOf(address),
            contract.decimals(),
            contract.symbol(),
          ]);

          results.push({
            symbol,
            balance: ethers.formatUnits(rawBalance, decimals),
          });
        }

        setBalances(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address]);

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Token Balances</h3>

      {loading && <p>Loading tokens...</p>}

      <ul>
        {balances.map((t) => (
          <li key={t.symbol}>
            {t.symbol}: {t.balance}
          </li>
        ))}
      </ul>
    </div>
  );
}
