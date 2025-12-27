"use client";

import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

interface TxItem {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: number;
}

export default function TransactionList({ address }: { address: string }) {
  const [txs, setTxs] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!address) return;
    if (fetchingRef.current) return;

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
      setError('RPC URL is not configured');
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    const fetchTxs = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const currentBlock = await provider.getBlockNumber();
        const startBlock = Math.max(currentBlock - 5, 0); // Reduced from 20 to 10 blocks
        const results: TxItem[] = [];
        const MAX_TXS = 10; // Maximum transactions to process per block
        const MAX_RESULTS = 3; // Maximum results to return

        for (let i = currentBlock; i >= startBlock; i--) {
          if (results.length >= MAX_RESULTS) break;

          try {
            const block = await provider.getBlock(i, true);
            if (!block?.transactions?.length) continue;

            // Process transactions in parallel with a limit
            const txPromises = block.transactions
              .slice(0, MAX_TXS)
              .map(async (txHash) => {
                try {
                  const tx = await provider.getTransaction(txHash);
                  if (!tx) return null;

                  const fromMatch = tx.from?.toLowerCase() === address.toLowerCase();
                  const toMatch = tx.to?.toLowerCase() === address.toLowerCase();
                  
                  if (fromMatch || toMatch) {
                    return {
                      hash: tx.hash,
                      from: tx.from,
                      to: tx.to,
                      value: ethers.formatEther(tx.value),
                      timestamp: block.timestamp,
                    };
                  }
                } catch (error) {
                  return null;
                }
                return null;
              });

            // Wait for all transaction checks to complete
            const txResults = (await Promise.all(txPromises)).filter(Boolean) as TxItem[];
            results.push(...txResults.slice(0, MAX_RESULTS - results.length));

          } catch (error) {
            console.warn(`Error processing block ${i}:`, error);
            continue;
          }
        }

        setTxs(results);
      } catch (e: any) {
        setError(`Failed to load transactions: ${e.message || 'Check console for details'}`);
        console.error('Error fetching transactions:', e);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchTxs();

    return () => {
      fetchingRef.current = false;
    };
  }, [address]);

  const sendTestTransaction = async () => {
    if (!window.ethereum) {
      setError('Ethereum provider not found. Please install MetaMask.');
      return;
    }

    setSending(true);
    setTxStatus('Preparing transaction...');
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Sending to self for testing
      const tx = await signer.sendTransaction({
        to: address,
        value: ethers.parseEther('0.0001')
      });
      
      setTxStatus(`Transaction sent! Hash: ${tx.hash}`);
      
      // Wait for the transaction to be mined
      await tx.wait();
      setTxStatus('Transaction confirmed! Refreshing transactions...');
      
      // Refresh the transaction list
      setLoading(true);
      const provider2 = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const currentBlock = await provider2.getBlockNumber();
      const block = await provider2.getBlock(currentBlock, true);
      
      if (block && block.transactions) {
        for (const txHash of block.transactions) {
          const tx = await provider2.getTransaction(txHash);
          if (tx && tx.hash === tx.hash) {
            setTxs(prev => [{
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: ethers.formatEther(tx.value),
              timestamp: block.timestamp,
            }, ...prev].slice(0, 5));
            break;
          }
        }
      }
      
    } catch (e: any) {
      console.error('Error sending transaction:', e);
      setError(`Transaction failed: ${e.message || 'Unknown error'}`);
    } finally {
      setSending(false);
      setTxStatus(null);
    }
  };

  return (
    <div style={{ marginTop: 24, maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Recent Transactions</h3>
        {/* <button 
          onClick={sendTestTransaction}
          disabled={sending || loading}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: (sending || loading) ? 0.7 : 1,
          }}
        >
          {sending ? 'Sending...' : 'Send Test Transaction'}
        </button> */}
      </div>

      {txStatus && <p style={{ color: '#4CAF50', margin: '10px 0' }}>{txStatus}</p>}
      {error && <p style={{ color: 'red', margin: '10px 0' }}>{error}</p>}
      {loading && <p>Loading transactions...</p>}

      {!loading && txs.length === 0 && (
        <div style={{ 
          padding: '20px', 
          background: '#f5f5f5', 
          borderRadius: '4px', 
          textAlign: 'center',
          margin: '20px 0'
        }}>
          <p>No recent transactions found.</p>
        </div>
      )}

      {txs.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {txs.map((tx) => {
            const isSent = tx.from.toLowerCase() === address.toLowerCase();
            return (
              <li 
                key={tx.hash}
                style={{
                  padding: '12px',
                  margin: '8px 0',
                  background: '#f9f9f9',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${isSent ? '#f44336' : '#4CAF50'}`
                }}
              >
                <div style={{ fontWeight: 'bold' }}>
                  {isSent ? 'Sent' : 'Received'} {tx.value} ETH
                </div>
                <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                  {isSent ? `To: ${tx.to}` : `From: ${tx.from}`}
                </div>
                {tx.timestamp && (
                  <div style={{ fontSize: '0.8em', color: '#999', marginTop: '4px' }}>
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </div>
                )}
                <div style={{ fontSize: '0.8em', marginTop: '4px', wordBreak: 'break-all' }}>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#2196F3', textDecoration: 'none' }}
                  >
                    View on Etherscan
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
