import axios from 'axios';

async function checkDeBank() {
    const address = '0xf137b5f7da0e4a51af2c0d5305d366160c84d76b';
    // Using a conceptual structure for checking DeBank API (requires an API key for actual production use)
    const url = `https://api.debank.com/history?user_addr=${address}&chain_id=moonbeam`;
    
    console.log('You should use the DeBank web interface directly as it indexes contract internal transactions better than standard block explorers.');
    console.log('Follow these steps:');
    console.log('1. Go to https://debank.com/profile/' + address);
    console.log('2. Click on the "History" tab.');
    console.log('3. Filter by chain: "Moonbeam".');
    console.log('4. Sort by the date of the receipt transaction (2024-01-18) to find the subsequent outflow.');
}

checkDeBank();
