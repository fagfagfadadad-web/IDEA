#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::contract]
pub trait Staking {
    #[init]
    fn init(
        &self,
        token_id: TokenIdentifier,
        apy_bps: u64,
        min_stake: BigUint,
        max_stake: BigUint,
        start_time: u64,
        end_time: u64,
    ) {
        self.token_id().set(&token_id);
        self.apy_bps().set(apy_bps);
        self.min_stake().set(&min_stake);
        self.max_stake().set(&max_stake);
        self.start_time().set(start_time);
        self.end_time().set(end_time);
    }

    #[payable("*")]
    #[endpoint]
    fn stake(&self) {
        let caller = self.blockchain().get_caller();
        let current_time = self.blockchain().get_block_timestamp();
        
        require!(current_time >= self.start_time().get(), "Staking not started");
        require!(current_time <= self.end_time().get(), "Staking ended");

        let payment = self.call_value().single_esdt();
        let token_id = self.token_id().get();
        
        require!(payment.token_identifier == token_id, "Invalid token");
        require!(payment.amount >= self.min_stake().get(), "Amount below minimum");
        require!(payment.amount <= self.max_stake().get(), "Amount above maximum");

        let current_stake = self.user_stake(&caller).get();
        let new_stake = current_stake + &payment.amount;
        
        self.user_stake(&caller).set(&new_stake);
        self.total_staked().update(|total| *total += &payment.amount);
        self.last_stake_time(&caller).set(current_time);

        self.stake_event(&caller, &payment.amount);
    }

    #[endpoint]
    fn unstake(&self, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        let current_stake = self.user_stake(&caller).get();
        
        require!(amount > 0, "Amount must be positive");
        require!(amount <= current_stake, "Insufficient staked amount");

        // Calculate rewards
        let rewards = self.calculate_rewards(&caller);
        
        self.user_stake(&caller).update(|stake| *stake -= &amount);
        self.total_staked().update(|total| *total -= &amount);
        
        let token_id = self.token_id().get();
        let total_amount = amount + rewards;
        
        self.send().direct_esdt(&caller, &token_id, 0, &total_amount);
        
        self.unstake_event(&caller, &amount, &rewards);
    }

    #[endpoint]
    fn claim_rewards(&self) {
        let caller = self.blockchain().get_caller();
        let rewards = self.calculate_rewards(&caller);
        
        require!(rewards > 0, "No rewards to claim");
        
        let token_id = self.token_id().get();
        self.send().direct_esdt(&caller, &token_id, 0, &rewards);
        self.last_stake_time(&caller).set(self.blockchain().get_block_timestamp());
        
        self.rewards_claimed_event(&caller, &rewards);
    }

    fn calculate_rewards(&self, user: &ManagedAddress) -> BigUint {
        let current_time = self.blockchain().get_block_timestamp();
        let last_stake = self.last_stake_time(user).get();
        let user_stake = self.user_stake(user).get();
        
        if user_stake == 0 || last_stake == 0 {
            return BigUint::zero();
        }
        
        let time_diff = current_time - last_stake;
        let apy_bps = self.apy_bps().get();
        
        // Calculate rewards: stake * apy * time / (365 * 24 * 3600 * 10000)
        let seconds_per_year = 365u64 * 24u64 * 3600u64;
        let rewards = &user_stake * apy_bps * time_diff / (seconds_per_year * 10000u64);
        
        rewards
    }

    // Views
    #[view(getUserStake)]
    fn get_user_stake(&self, user: ManagedAddress) -> BigUint {
        self.user_stake(&user).get()
    }

    #[view(getUserRewards)]
    fn get_user_rewards(&self, user: ManagedAddress) -> BigUint {
        self.calculate_rewards(&user)
    }

    #[view(getTokenId)]
    fn get_token_id(&self) -> TokenIdentifier {
        self.token_id().get()
    }

    #[view(getApyBps)]
    fn get_apy_bps(&self) -> u64 {
        self.apy_bps().get()
    }

    #[view(getTotalStaked)]
    fn get_total_staked(&self) -> BigUint {
        self.total_staked().get()
    }

    // Storage
    #[storage_mapper("tokenId")]
    fn token_id(&self) -> SingleValueMapper<TokenIdentifier>;

    #[storage_mapper("apyBps")]
    fn apy_bps(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("minStake")]
    fn min_stake(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("maxStake")]
    fn max_stake(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("startTime")]
    fn start_time(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("endTime")]
    fn end_time(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("userStake")]
    fn user_stake(&self, user: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[storage_mapper("totalStaked")]
    fn total_staked(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("lastStakeTime")]
    fn last_stake_time(&self, user: &ManagedAddress) -> SingleValueMapper<u64>;

    // Events
    #[event("stake")]
    fn stake_event(&self, #[indexed] user: &ManagedAddress, #[indexed] amount: &BigUint);

    #[event("unstake")]
    fn unstake_event(
        &self,
        #[indexed] user: &ManagedAddress,
        #[indexed] amount: &BigUint,
        #[indexed] rewards: &BigUint,
    );

    #[event("rewardsClaimed")]
    fn rewards_claimed_event(&self, #[indexed] user: &ManagedAddress, #[indexed] rewards: &BigUint);
}