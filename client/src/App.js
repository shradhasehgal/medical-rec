import React, { Component } from "react";
import IPFSInboxContract from "./IPFSInbox.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";
import ipfs from './ipfs';
import axios from "axios";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props)
      this.state = { 
      storageValue: 0, 
      web3: null, 
      accounts: null, 
      contract: null, 
      ipfsHash: null,
      formIPFS: "",
      formAddress: "",
      receivedIPFS: "",
      receivedText: "",
      patient: "",
    };

    this.handleChangeAddress = this.handleChangeAddress.bind(this);
    this.handleChangeIPFS = this.handleChangeIPFS.bind(this);
    this.handleSend = this.handleSend.bind(this);
    this.handleReceiveIPFS = this.handleReceiveIPFS.bind(this);
    this.handleViewRecord = this.handleViewRecord.bind(this);
    this.handleChangePatient = this.handleChangePatient.bind(this);
  }
  

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(IPFSInboxContract);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();
      var done = 0
      instance.inboxResponse()
        .on('data', result => {
          console.log(result);
          
          if(result.args[0] != "Insufficient Permissions" &&  result.args[0] != "No record")
          {
            axios
            .get("https://gateway.ipfs.io/ipfs/"+result.args[0])
            .then((res) => {
              console.log(res['data']);
              // res['data'] = res['data'].replace(/(?:\r\n|\r|\n)/g, '<br />');
              this.setState({receivedText: res['data']})
            })
          }
          else if (done!=1){
            done = 1;
            if(result.args[0] == "Insufficient Permissions")
              alert("Insufficient Permissions");
            else
              alert("No patient record found");
          }
          // this.setState({receivedIPFS: result.args[0]})
        });

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  // BELOW ADDED
  handleChangeAddress(event){
    this.setState({formAddress: event.target.value});
  }

  handleChangeIPFS(event){
    this.setState({formIPFS: event.target.value});
  }

  handleChangePatient(event){
    this.setState({patient: event.target.value});
  }

  handleSend(event){
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]

    document.getElementById('new-notification-form').reset()
    this.setState({showNotification: true});
    contract.sendIPFS(this.state.formAddress, this.state.formIPFS, {from: account})
      .then(result => {
        this.setState({formAddress: ""});
        this.setState({formIPFS: ""});
      })
  }

  handleViewRecord(event){
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]

    document.getElementById('pat-notification-form').reset()
    contract.getRecord(this.state.patient, {from: account})
    .then(result => {
      this.setState({patient: ""});
    })

  }

  handleReceiveIPFS(event){
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]
    contract.checkInbox({from: account})
  }



  convertToBuffer = async(reader) => {
    //file is converted to a buffer for upload to IPFS
      const buffer = await Buffer.from(reader.result);
    //set this buffer -using es6 syntax
      this.setState({buffer});
  };

  captureFile = (event) => {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => this.convertToBuffer(reader)    
  };

  onIPFSSubmit = async (event) => {
    event.preventDefault();

    //bring in user's metamask account address
    const accounts = this.state.accounts;

    console.log('Sending from Metamask account: ' + accounts[0]);


    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 

    await ipfs.add(this.state.buffer, (err, ipfsHash) => {
      console.log(err,ipfsHash);
      //setState by setting ipfsHash to ipfsHash[0].hash 
      this.setState({ ipfsHash:ipfsHash[0].hash });

    }) 
  }; 

  // ABOVE ADDED 

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h2> 1. Add a file to IPFS here </h2>
          <form id="ipfs-hash-form" className="scep-form" onSubmit={this.onIPFSSubmit}>
            <input 
              type="file"
              onChange={this.captureFile}
            />
            <button
              type="submit"> 
              Send it 
            </button>
          </form>
          <p> The IPFS hash is: {this.state.ipfsHash}</p>
        <h2> 2. Upload file here </h2>
          <form id="new-notification-form" className="scep-form" onSubmit={this.handleSend}>
            <label>
              Receiver Address:
              <input type="text" value={this.state.value} onChange={this.handleChangeAddress} />
            </label>
            <label>
              IPFS Address:
              <input type="text" value={this.state.value} onChange={this.handleChangeIPFS} />
            </label>
            <input type="submit" value="Submit" />
          </form>
        <h2> 3. View Record </h2>
        <form id="pat-notification-form" className="scep-form" onSubmit={this.handleViewRecord}>
            <label>
              Patient Address:
              <input type="text" value={this.state.patient} onChange={this.handleChangePatient} />
            </label>
            <input type="submit" value="Display Record" />
          </form>
          <p>{this.state.receivedText}</p>
      </div>
    );
  }
}

export default App;
