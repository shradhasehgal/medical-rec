pragma solidity >=0.4.23;

contract IPFSInbox {
    struct patRec{
        address docAdd;
        address patAdd;
        string ipfsHash;
        bool isExists;
        bool patUpd;
        bool docUpd;
    }
    struct shareRec{
        address shareAdd;
        address patAdd;
        string ipfsHash;
    }
    // Grabs the name of the resources based on address
    mapping (address => patRec) ipfsInbox;
    mapping (address => shareRec) shareInbox;
    // Events
    event ipfsSent(string _ipfsHash, address _address);
    event inboxResponse(string response);

    // Modifiers
    modifier notFull (string memory _string) {bytes memory stringTest = bytes(_string); require (stringTest.length == 0); _;}

    constructor() public {

    }

    function sendIPFS(address _address, string memory _ipfsHash) notFull(ipfsInbox[_address].ipfsHash) public {
        require(ipfsInbox[_address].isExists == false);
        ipfsInbox[_address].ipfsHash = _ipfsHash;
        ipfsInbox[_address].patAdd = _address;
        ipfsInbox[_address].docAdd = msg.sender;
        ipfsInbox[_address].isExists = true;
        emit ipfsSent(_ipfsHash, _address);
    }
    
    function canUpdate(address _address){
        if(ipfsInbox[_address].docAdd == msg.sender){
            ipfsInbox[_address].docUpd = true;
        }
        if(ipfsInbox[_address].patAdd == msg.sender){
            ipfsInbox[_address].patUpd = true;
        }
        if(ipfsInbox[_address].patUpd == true && ipfsInbox[_address].docUpd == true){
            ipfsInbox[_address].patUpd = false;
            ipfsInbox[_address].docUpd = false;
            ipfsInbox[_address].isExists = false;
        }
    }
    function checkInbox() public{
        string memory ipfs_hash = ipfsInbox[msg.sender].ipfsHash;
        if(bytes(ipfs_hash).length == 0) {
            emit inboxResponse("Empty Inbox");
        } else {
            // ipfsInbox[msg.sender] = "";
            emit inboxResponse(ipfs_hash);
        }
    }
    function getRecord(address _reqaddress) public{
        if(ipfsInbox[_reqaddress].docAdd == msg.sender || ipfsInbox[_reqaddress].patAdd == msg.sender){
            string memory ipfs_hash = ipfsInbox[_reqaddress].ipfsHash;
            if(bytes(ipfs_hash).length == 0) {
                emit inboxResponse("Empty Inbox");
            } 
            else {
                // ipfsInbox[msg.sender] = "";
                emit inboxResponse(ipfs_hash);
            }
        }
    }
    function requestRecord(address _reqaddress) public{
        shareInbox[msg.sender].shareAdd = msg.sender;
        shareInbox[msg.sender].patAdd = _reqaddress;
    }
    function signRequest(address _shareaddress) public{
        if(shareInbox[_shareaddress].patAdd == msg.sender){
            shareInbox[_shareaddress].ipfsHash = ipfsInbox[msg.sender].ipfsHash;
        }
    }
    function getSharedRecord() public{
        string memory ipfs_hash = shareInbox[msg.sender].ipfsHash;
        if(bytes(ipfs_hash).length == 0) {
            emit inboxResponse("Empty Inbox");
        } else {
            // ipfsInbox[msg.sender] = "";
            emit inboxResponse(ipfs_hash);
        }
    }
    }
}