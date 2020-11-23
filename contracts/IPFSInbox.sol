pragma solidity >=0.4.23;

contract IPFSInbox {
    /// @dev patRec stores the patient records
    /// @dev docAdd: Doctor address, patAdd: patient address, ipfsHash: patient record ipfs hash, isExists:checks if record exists
    /// @dev patUpd,docUpd checks for update and deletion operations
    /// @dev shareAdd addresses of additional people that the record has been shared with.
    struct patRec{
        address docAdd;
        address patAdd;
        string ipfsHash;
        bool isExists;
        bool patUpd;
        bool docUpd;
        address[] sharedAdd;
    }

    /// @dev mapping of addresses to records
    mapping (address => patRec) ipfsInbox;

    /// @dev mapping of addresses to roles
    mapping (address => uint8) roles;
    // Events
    event ipfsSent(string _ipfsHash, address _address);
    event inboxResponse(string response);

    /// @dev Here for testing purposes roles are declared
    constructor() public {
        roles[0x4c2D220c5c16c1b10531Eaa06955Fc405f083A6C]=1; // doctor
        roles[0xE6b77C28b0a5A63b73e1a470F36187d74B8Aa0b4]=2; // pat
        roles[0x01F80c59484EBf5f2956Db8ec58E502DbDA9DfF9]=3; // hc prov
    }

    /// @dev function to add a patient record
    /// @param _address is the address of the patient whose record is being added
    /// @param _ipfsHash is the hash of the record of the patient
    function sendIPFS(address _address, string memory _ipfsHash) public {
        if(ipfsInbox[_address].isExists == true)
            emit inboxResponse("exists");
            // emit ipfsSent("Patient record exists already!", _address);
        // require(ipfsInbox[_address].isExists == false);
        else {
            if(roles[msg.sender] == 1){
                ipfsInbox[_address].ipfsHash = _ipfsHash;
                ipfsInbox[_address].patAdd = _address;
                ipfsInbox[_address].docAdd = msg.sender;
                ipfsInbox[_address].isExists = true;
                emit ipfsSent(_ipfsHash, _address);
            }
            else{
                emit inboxResponse("Not a doctor");
            }
        }
        
    }
    /// @dev function that is used by healthcare provider to assign doctor role
    /// @param _address is the address of the doctor whose role is to be assigned
    function assignDoc(address _address) public{
        if(roles[msg.sender] == 3){
            roles[_address] = 1;
        }
    }
    /// @dev function that is used by healthcare provider to assign patient role
    /// @param _address is the address of the patient whose role is to be assigned
    function assignPat(address _address) public{
        if(roles[msg.sender] == 3){
            roles[_address] = 2;
        }
    }
    
    /// @dev function is to get permissions from both the doctor and the patient before updating records
    /// @param _address is the address of the patient whose record is to be updated
    function canUpdate(address _address) public{
        uint8 f = 0;
        if(ipfsInbox[_address].docAdd == msg.sender){
            ipfsInbox[_address].docUpd = true;
            f += 1;
        }
        if(ipfsInbox[_address].patAdd == msg.sender){
            ipfsInbox[_address].patUpd = true;
            f += 1;
        }

        if(ipfsInbox[_address].isExists == false)
            emit inboxResponse("No record");
        else if (f==0)
            emit inboxResponse("Insufficient Permissions");
        
        else if(ipfsInbox[_address].patUpd == true && ipfsInbox[_address].docUpd == true){
            ipfsInbox[_address].patUpd = false;
            ipfsInbox[_address].docUpd = false;
            ipfsInbox[_address].isExists = false;
            emit inboxResponse("2 sign");
        }

        else if(f==1)
            emit inboxResponse("1 sign");
        
        
    }
    /// @dev function to check ipfsInbox default
    function checkInbox() public{
        string memory ipfs_hash = ipfsInbox[msg.sender].ipfsHash;
        if(bytes(ipfs_hash).length == 0) {
            emit inboxResponse("No record");
        } else {
            // ipfsInbox[msg.sender] = "";
            emit inboxResponse(ipfs_hash);
        }
    }

    /// @dev function used to get the record of a particular patient
    /// @param _reqaddress is the address of the patient whose record we wish to view
    function getRecord(address _reqaddress) public{
        if(ipfsInbox[_reqaddress].isExists == false)
            emit inboxResponse("No record");

        else if(ipfsInbox[_reqaddress].docAdd == msg.sender || ipfsInbox[_reqaddress].patAdd == msg.sender){
            string memory ipfs_hash = ipfsInbox[_reqaddress].ipfsHash;
            if(bytes(ipfs_hash).length == 0) {
                emit inboxResponse("No record");
            } 
            else {
                // ipfsInbox[msg.sender] = "";
                emit inboxResponse(ipfs_hash);
            }
        }

        else {
            string memory ipfs_hash = ipfsInbox[_reqaddress].ipfsHash;
            uint8 i = 0;
            bool hasPerm = false;

            for(i = 0;i<ipfsInbox[_reqaddress].sharedAdd.length;i++)
            {
                if(ipfsInbox[_reqaddress].sharedAdd[i] == msg.sender)
                {
                    hasPerm = true;
                }
            }
            if(hasPerm == false) {
                emit inboxResponse("Insufficient Permissions");
            } else {
                emit inboxResponse(ipfs_hash);
            }
        }
    }

    /// @dev function used to share the record of a particular patient
    /// @param _shareaddress is the address of the person who record is being shared with
    function signRequest(address _shareaddress) public{
        if(ipfsInbox[msg.sender].isExists == true)
            ipfsInbox[msg.sender].sharedAdd.push(_shareaddress); 
        else
            emit inboxResponse("No record");
    }

    /// @dev function used to fetch a shared record
    /// @param _shareaddress is the address of the patient whose record we wish to view
    function getSharedRecord(address _shareaddress) public{
        string memory ipfs_hash = ipfsInbox[_shareaddress].ipfsHash;
        uint8 i = 0;
        bool hasPerm = false;
        for(i = 0;i<ipfsInbox[_shareaddress].sharedAdd.length;i++)
        {
            if(ipfsInbox[_shareaddress].sharedAdd[i] == msg.sender)
            {
                hasPerm = true;
            }
        }
        if(hasPerm == false) {
            emit inboxResponse("Empty Inbox");
        } else {
            emit inboxResponse(ipfs_hash);
        }
    }
}
