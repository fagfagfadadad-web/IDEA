import { useState } from 'react';
import { useGetAccount, useGetNetworkConfig } from 'lib';
import { ContractFactory, StakingParams, PresaleParams } from '../lib/contractFactory';
import { useCustomToast } from './useCustomToast';

export const useContractDeployment = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { showToast } = useCustomToast();

  const deployStakingContract = async (params: StakingParams): Promise<string | null> => {
    if (!address) {
      showToast('Please connect your wallet first', { type: 'error' });
      return null;
    }

    setIsDeploying(true);
    try {
      const factory = new ContractFactory({ chainId: network.chainId });
      const contractAddress = await factory.deployStakingContract(params, address);
      
      setDeployedAddress(contractAddress);
      showToast('Staking contract deployed successfully!', { type: 'success' });
      
      return contractAddress;
    } catch (error) {
      console.error('Deployment error:', error);
      showToast(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { type: 'error' });
      return null;
    } finally {
      setIsDeploying(false);
    }
  };

  const deployPresaleContract = async (params: PresaleParams): Promise<string | null> => {
    if (!address) {
      showToast('Please connect your wallet first', { type: 'error' });
      return null;
    }

    setIsDeploying(true);
    try {
      const factory = new ContractFactory({ chainId: network.chainId });
      const contractAddress = await factory.deployPresaleContract(params, address);
      
      setDeployedAddress(contractAddress);
      showToast('Presale contract deployed successfully!', { type: 'success' });
      
      return contractAddress;
    } catch (error) {
      console.error('Deployment error:', error);
      showToast(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { type: 'error' });
      return null;
    } finally {
      setIsDeploying(false);
    }
  };

  const resetDeployment = () => {
    setDeployedAddress(null);
    setIsDeploying(false);
  };

  return {
    deployStakingContract,
    deployPresaleContract,
    isDeploying,
    deployedAddress,
    resetDeployment
  };
};