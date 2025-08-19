#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

use multiversx_sc_modules::default_issue_callbacks;

#[multiversx_sc::contract]
pub trait Factory: default_issue_callbacks::DefaultIssueCallbacksModule {
    #[init]
    fn init(&self) {}

    #[payable("EGLD")]
    #[endpoint(createStaking)]
    fn create_staking(
        &self,
        token_id: TokenIdentifier,
        apy_bps: u64,
        min_stake: BigUint,
        max_stake: BigUint,
        start_time: u64,
        end_time: u64,
    ) -> ManagedAddress {
        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "Payment required for deployment");

        let staking_code = self.staking_template_code().get();
        require!(!staking_code.is_empty(), "Staking template not set");

        let mut args = ManagedArgBuffer::new();
        args.push_arg(token_id.clone());
        args.push_arg(apy_bps);
        args.push_arg(min_stake.clone());
        args.push_arg(max_stake.clone());
        args.push_arg(start_time);
        args.push_arg(end_time);

        let (contract_address, _) = self.send_raw().deploy_contract(
            payment,
            &staking_code,
            CodeMetadata::UPGRADEABLE | CodeMetadata::READABLE | CodeMetadata::PAYABLE,
            &args,
        );

        // Store deployment info
        self.deployed_contracts(&contract_address).set(true);
        self.contract_type(&contract_address).set(&ManagedBuffer::from(b"staking"));
        
        // Emit event
        self.staking_deployed_event(&contract_address, &token_id, &apy_bps);

        contract_address
    }

    #[payable("EGLD")]
    #[endpoint(createPresale)]
    fn create_presale(
        &self,
        token_id: TokenIdentifier,
        price_per_token: BigUint,
        total_supply: BigUint,
        start_time: u64,
        end_time: u64,
        min_contribution: BigUint,
        max_contribution: BigUint,
    ) -> ManagedAddress {
        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "Payment required for deployment");

        let presale_code = self.presale_template_code().get();
        require!(!presale_code.is_empty(), "Presale template not set");

        let mut args = ManagedArgBuffer::new();
        args.push_arg(token_id.clone());
        args.push_arg(price_per_token.clone());
        args.push_arg(total_supply.clone());
        args.push_arg(start_time);
        args.push_arg(end_time);
        args.push_arg(min_contribution.clone());
        args.push_arg(max_contribution.clone());

        let (contract_address, _) = self.send_raw().deploy_contract(
            payment,
            &presale_code,
            CodeMetadata::UPGRADEABLE | CodeMetadata::READABLE | CodeMetadata::PAYABLE,
            &args,
        );

        // Store deployment info
        self.deployed_contracts(&contract_address).set(true);
        self.contract_type(&contract_address).set(&ManagedBuffer::from(b"presale"));
        
        // Emit event
        self.presale_deployed_event(&contract_address, &token_id, &total_supply);

        contract_address
    }

    #[only_owner]
    #[endpoint(setStakingTemplate)]
    fn set_staking_template(&self, code: ManagedBuffer) {
        self.staking_template_code().set(code);
    }

    #[only_owner]
    #[endpoint(setPresaleTemplate)]
    fn set_presale_template(&self, code: ManagedBuffer) {
        self.presale_template_code().set(code);
    }

    #[view(getDeployedContracts)]
    fn get_deployed_contracts(&self, address: ManagedAddress) -> bool {
        self.deployed_contracts(&address).get()
    }

    #[view(getContractType)]
    fn get_contract_type(&self, address: ManagedAddress) -> ManagedBuffer {
        self.contract_type(&address).get()
    }

    // Storage
    #[storage_mapper("stakingTemplateCode")]
    fn staking_template_code(&self) -> SingleValueMapper<ManagedBuffer>;

    #[storage_mapper("presaleTemplateCode")]
    fn presale_template_code(&self) -> SingleValueMapper<ManagedBuffer>;

    #[storage_mapper("deployedContracts")]
    fn deployed_contracts(&self, address: &ManagedAddress) -> SingleValueMapper<bool>;

    #[storage_mapper("contractType")]
    fn contract_type(&self, address: &ManagedAddress) -> SingleValueMapper<ManagedBuffer>;

    // Events
    #[event("stakingDeployed")]
    fn staking_deployed_event(
        &self,
        #[indexed] contract_address: &ManagedAddress,
        #[indexed] token_id: &TokenIdentifier,
        #[indexed] apy_bps: &u64,
    );

    #[event("presaleDeployed")]
    fn presale_deployed_event(
        &self,
        #[indexed] contract_address: &ManagedAddress,
        #[indexed] token_id: &TokenIdentifier,
        #[indexed] total_supply: &BigUint,
    );
}