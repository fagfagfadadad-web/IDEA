#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::contract]
pub trait Presale {
    #[init]
    fn init(
        &self,
        token_id: TokenIdentifier,
        price_per_token: BigUint,
        total_supply: BigUint,
        start_time: u64,
        end_time: u64,
        min_contribution: BigUint,
        max_contribution: BigUint,
    ) {
        self.token_id().set(&token_id);
        self.price_per_token().set(&price_per_token);
        self.total_supply().set(&total_supply);
        self.start_time().set(start_time);
        self.end_time().set(end_time);
        self.min_contribution().set(&min_contribution);
        self.max_contribution().set(&max_contribution);
        self.tokens_sold().set(&BigUint::zero());
    }

    #[payable("EGLD")]
    #[endpoint]
    fn buy_tokens(&self) {
        let caller = self.blockchain().get_caller();
        let current_time = self.blockchain().get_block_timestamp();
        
        require!(current_time >= self.start_time().get(), "Presale not started");
        require!(current_time <= self.end_time().get(), "Presale ended");

        let payment = self.call_value().egld_value().clone_value();
        require!(payment >= self.min_contribution().get(), "Below minimum contribution");
        require!(payment <= self.max_contribution().get(), "Above maximum contribution");

        let price_per_token = self.price_per_token().get();
        let tokens_to_buy = &payment * &BigUint::from(1000000000000000000u64) / &price_per_token;
        
        let tokens_sold = self.tokens_sold().get();
        let total_supply = self.total_supply().get();
        
        require!(tokens_sold + &tokens_to_buy <= total_supply, "Not enough tokens available");

        // Update storage
        self.user_contribution(&caller).update(|contrib| *contrib += &payment);
        self.user_tokens(&caller).update(|tokens| *tokens += &tokens_to_buy);
        self.tokens_sold().update(|sold| *sold += &tokens_to_buy);
        self.total_raised().update(|raised| *raised += &payment);

        self.token_purchase_event(&caller, &payment, &tokens_to_buy);
    }

    #[endpoint]
    fn claim_tokens(&self) {
        let caller = self.blockchain().get_caller();
        let current_time = self.blockchain().get_block_timestamp();
        
        require!(current_time > self.end_time().get(), "Presale not ended");
        
        let user_tokens = self.user_tokens(&caller).get();
        require!(user_tokens > 0, "No tokens to claim");
        
        self.user_tokens(&caller).clear();
        
        let token_id = self.token_id().get();
        self.send().direct_esdt(&caller, &token_id, 0, &user_tokens);
        
        self.tokens_claimed_event(&caller, &user_tokens);
    }

    #[endpoint]
    fn refund(&self) {
        let caller = self.blockchain().get_caller();
        let current_time = self.blockchain().get_block_timestamp();
        
        // Allow refund if presale failed to reach minimum or if explicitly enabled
        require!(current_time > self.end_time().get(), "Presale not ended");
        
        let user_contribution = self.user_contribution(&caller).get();
        require!(user_contribution > 0, "No contribution to refund");
        
        self.user_contribution(&caller).clear();
        self.user_tokens(&caller).clear();
        
        self.send().direct_egld(&caller, &user_contribution);
        
        self.refund_event(&caller, &user_contribution);
    }

    // Views
    #[view(getUserContribution)]
    fn get_user_contribution(&self, user: ManagedAddress) -> BigUint {
        self.user_contribution(&user).get()
    }

    #[view(getUserTokens)]
    fn get_user_tokens(&self, user: ManagedAddress) -> BigUint {
        self.user_tokens(&user).get()
    }

    #[view(getTokensSold)]
    fn get_tokens_sold(&self) -> BigUint {
        self.tokens_sold().get()
    }

    #[view(getTotalRaised)]
    fn get_total_raised(&self) -> BigUint {
        self.total_raised().get()
    }

    #[view(getPresaleInfo)]
    fn get_presale_info(&self) -> MultiValue5<TokenIdentifier, BigUint, BigUint, u64, u64> {
        (
            self.token_id().get(),
            self.price_per_token().get(),
            self.total_supply().get(),
            self.start_time().get(),
            self.end_time().get(),
        ).into()
    }

    // Storage
    #[storage_mapper("tokenId")]
    fn token_id(&self) -> SingleValueMapper<TokenIdentifier>;

    #[storage_mapper("pricePerToken")]
    fn price_per_token(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("totalSupply")]
    fn total_supply(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("startTime")]
    fn start_time(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("endTime")]
    fn end_time(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("minContribution")]
    fn min_contribution(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("maxContribution")]
    fn max_contribution(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("userContribution")]
    fn user_contribution(&self, user: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[storage_mapper("userTokens")]
    fn user_tokens(&self, user: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[storage_mapper("tokensSold")]
    fn tokens_sold(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("totalRaised")]
    fn total_raised(&self) -> SingleValueMapper<BigUint>;

    // Events
    #[event("tokenPurchase")]
    fn token_purchase_event(
        &self,
        #[indexed] buyer: &ManagedAddress,
        #[indexed] egld_amount: &BigUint,
        #[indexed] tokens_bought: &BigUint,
    );

    #[event("tokensClaimed")]
    fn tokens_claimed_event(&self, #[indexed] user: &ManagedAddress, #[indexed] amount: &BigUint);

    #[event("refund")]
    fn refund_event(&self, #[indexed] user: &ManagedAddress, #[indexed] amount: &BigUint);
}