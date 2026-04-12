import axios from 'axios';

async function checkAddress() {
    const address = '0xf137b5f7da0e4a51af2c0d5305d366160c84d76b';
    const token = '0xffffffff7d3875460d4509eb8d0362c611b4e841';
    
    // Using standard Moonbeam explorer web address
    const url = `https://moonbeam.moonscan.io/token/${token}?a=${address}`;
    
    console.log('You can check your address directly here:', url);
    console.log('Common reasons for missing assets:');
    console.log('1. Asset is bridged and exists on the original chain as a different contract address.');
    console.log('2. Asset is staked in a protocol and shows as "deposited" rather than "in wallet".');
    console.log('3. Asset is hidden in wallet settings (Token not imported).');
    console.log('4. Wallet interface syncing issue (zapper/debank cache).');
}

checkAddress();
