import { useState } from "react";
import { getProvider } from "@/utils/web3";

// 钱包连接组件 - 面试加分点说明：
// 1. 使用 React Hooks 管理状态
// 2. 集成 ethers.js v6 进行区块链交互
// 3. 实现钱包连接和账户信息获取
// 4. 响应式UI状态管理
export default function WalletConnect() {
  // 使用useState管理钱包地址状态，初始值为空字符串
  const [address, setAddress] = useState<string>("");

  // 连接钱包的异步函数
  const connectWallet = async () => {
    // 1. 获取Web3提供者（如MetaMask）
    const provider = getProvider();
    // 如果用户未安装钱包扩展，则直接返回
    if (!provider) return;

    // 2. 请求用户授权连接钱包
    // 这会触发MetaMask弹窗要求用户确认连接
    await provider.send("eth_requestAccounts", []);
    
    // 3. 获取签名者对象，用于后续交易签名
    const signer = await provider.getSigner();
    
    // 4. 获取用户的钱包地址
    const addr = await signer.getAddress();
    
    // 5. 更新组件状态，保存钱包地址
    setAddress(addr);
  };

  return (
    // 主容器：添加内边距、边框、圆角和最大宽度
    <div className="p-6 border rounded-lg max-w-md mx-auto text-center">
      {/* 条件渲染：根据是否已连接钱包显示不同UI */}
      {!address ? (
        // 未连接钱包时显示连接按钮
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Connect Wallet
        </button>
      ) : (
        // 已连接钱包时显示钱包地址
        <div>
          <p className="text-sm text-gray-500">Connected Wallet</p>
          {/* 显示格式化的钱包地址：前6位 + ... + 后4位 */}
          <p className="font-mono mt-2" title={address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
      )}
    </div>
  );
}

