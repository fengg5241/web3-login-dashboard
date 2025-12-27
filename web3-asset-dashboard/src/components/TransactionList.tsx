"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber: number;
  timestamp: number;
}

interface Props {
  address: string;
}

export default function TransactionList({ address }: Props) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
        if (!rpcUrl) {
          throw new Error("RPC URL not configured");
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // 获取最近区块
        const currentBlock = await provider.getBlockNumber();
        const startBlock = Math.max(currentBlock - 1000, 0);

        const transactions: Transaction[] = [];

        for (let i = currentBlock; i >= startBlock && transactions.length < 10; i--) {
          const block = await provider.getBlock(i, true);
          if (!block || !block.transactions) continue;

          for (const tx of block.transactions) {
            if (
              tx.from?.toLowerCase() === address.toLowerCase() ||
              tx.to?.toLowerCase() === address.toLowerCase()
            ) {
              const receipt = await provider.getTransactionReceipt(tx.hash);

              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                blockNumber: tx.blockNumber ?? 0,
                timestamp: block.timestamp,
              });

              if (transactions.length >= 10) break;
            }
          }
        }

        setTxs(transactions);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [address]);

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Recent Transactions</h3>

      {loading && <p>Loading transactions...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && txs.length === 0 && (
        <p>No recent transactions found.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {txs.map((tx) => {
          const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();

          return (
            <li
              key={tx.hash}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #eaeaea",
              }}
            >
              <div>
                <strong>{isOutgoing ? "Sent" : "Received"}</strong>{" "}
                {tx.value} ETH
              </div>

              <div style={{ fontSize: 12, color: "#666" }}>
                {new Date(tx.timestamp * 1000).toLocaleString()}
              </div>

              <div style={{ fontSize: 12 }}>
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Etherscan
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
