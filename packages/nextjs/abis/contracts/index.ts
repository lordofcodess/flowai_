// Direct imports for ENS contract ABIs - works with Vite bundler
import ENSRegistryABI from './sepolia/ENSRegistry.json';
import BaseRegistrarABI from './sepolia/BaseRegistrarImplementation.json';
import ETHRegistrarControllerABI from './sepolia/ETHRegistrarController.json';
import DNSRegistrarABI from './sepolia/DNSRegistrar.json';
import ReverseRegistrarABI from './sepolia/ReverseRegistrar.json';
import NameWrapperABI from './sepolia/NameWrapper.json';
import PublicResolverABI from './sepolia/PublicResolver.json';
import UniversalResolverABI from './sepolia/UniversalResolver.json';
import OffchainDNSResolverABI from './sepolia/OffchainDNSResolver.json';

export const CONTRACT_ABIS = {
  ENSRegistry: ENSRegistryABI.abi,
  BaseRegistrar: BaseRegistrarABI.abi,
  ETHRegistrarController: ETHRegistrarControllerABI.abi,
  DNSRegistrar: DNSRegistrarABI.abi,
  ReverseRegistrar: ReverseRegistrarABI.abi,
  NameWrapper: NameWrapperABI.abi,
  PublicResolver: PublicResolverABI.abi,
  UniversalResolver: UniversalResolverABI.abi,
  OffchainDNSResolver: OffchainDNSResolverABI.abi
};
