import { BrowserProvider } from "ethers";
//Web3 Provider 概念
//浏览器环境判断
//MetaMask 检测
export const getProvider = () => {
  if (typeof window === "undefined") return null;

  const { ethereum } = window as any;
  if (!ethereum) {
    alert("MetaMask is not installed");
    return null;
  }

  return new BrowserProvider(ethereum);
};
