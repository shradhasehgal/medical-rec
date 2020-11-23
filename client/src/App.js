import React, { Component } from "react";
import IPFSInboxContract from "./IPFSInbox.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";
import ipfs from './ipfs';
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
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
      ShareAddress: "",
      UpdateAddress: "",
      role: "doc",
    };

    this.handleChangeAddress = this.handleChangeAddress.bind(this);
    this.handleChangeIPFS = this.handleChangeIPFS.bind(this);
    this.handleSend = this.handleSend.bind(this);
    this.handleReceiveIPFS = this.handleReceiveIPFS.bind(this);
    this.handleViewRecord = this.handleViewRecord.bind(this);
    this.handleChangePatient = this.handleChangePatient.bind(this);
    this.handleShareRecord = this.handleShareRecord.bind(this);
    this.handleChangeShareAddress = this.handleChangeShareAddress.bind(this);
    this.handleChangeUpdate = this.handleChangeUpdate.bind(this);
    this.handleUpdateRecord = this.handleUpdateRecord.bind(this);
    this.handleChangeRole = this.handleChangeRole.bind(this);
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

          if (result.args[0] !== "Insufficient Permissions" && result.args[0] !== "No record" && result.args[0] !== "1 sign" && result.args[0] !== "2 sign" && result.args[0] !== "exists" && result.args[0] != "Not a doctor") {
            axios
              .get("https://gateway.ipfs.io/ipfs/" + result.args[0])
              .then((res) => {
                console.log(res['data']);
                // res['data'] = res['data'].replace(/(?:\r\n|\r|\n)/g, '<br />');
                this.setState({ receivedText: res['data'] })
              })
          }
          else if (done !== 1) {
            done = 1;
            if (result.args[0] === "Insufficient Permissions")
              alert("Insufficient Permissions");
            else if (result.args[0] === "No record")
              alert("No patient record found");
            else if (result.args[0] === "1 sign")
              alert("1 sign completed, 1 sign left");
            else if (result.args[0] === "2 sign")
              alert("Both signs completed, record can be updated");
            else if (result.args[0] === "exists")
              alert("Record exists, sign update");
            else if (result.args[0] === "Not a doctor")
              alert("Account does not have doctor permissions");
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
  handleChangeAddress(event) {
    this.setState({ formAddress: event.target.value });
  }

  handleChangeIPFS(event) {
    this.setState({ formIPFS: event.target.value });
  }

  handleChangePatient(event) {
    this.setState({ patient: event.target.value });
  }

  handleChangeRole(event) {
    this.setState({ role: event.target.value });
  }

  handleChangeShareAddress(event) {
    this.setState({ ShareAddress: event.target.value });
  }

  handleChangeUpdate(event) {
    this.setState({ UpdateAddress: event.target.value });
  }

  handleSend(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]

    document.getElementById('new-notification-form').reset()
    this.setState({ showNotification: true });
    contract.sendIPFS(this.state.formAddress, this.state.formIPFS, { from: account })
      .then(result => {
        this.setState({ formAddress: "" });
        this.setState({ formIPFS: "" });
      })
  }

  handleViewRecord(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]

    document.getElementById('pat-notification-form').reset()
    contract.getRecord(this.state.patient, { from: account })
      .then(result => {
        this.setState({ patient: "" });
      })

  }

  handleShareRecord(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]

    document.getElementById('my-notification-form').reset()
    contract.signRequest(this.state.ShareAddress, { from: account })
      .then(result => {
        this.setState({ ShareAddress: "" });
      })
  }

  handleReceiveIPFS(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]
    contract.checkInbox({ from: account })
  }

  handleUpdateRecord(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]

    document.getElementById('upd-notification-form').reset()
    contract.canUpdate(this.state.UpdateAddress, { from: account })
      .then(result => {
        this.setState({ UpdateAddress: "" });
      })
  }

  convertToBuffer = async (reader) => {
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer -using es6 syntax
    this.setState({ buffer });
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
      console.log(err, ipfsHash);
      //setState by setting ipfsHash to ipfsHash[0].hash 
      this.setState({ ipfsHash: ipfsHash[0].hash });

    })
  };

  // ABOVE ADDED 

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">

        <nav class="navbar navbar-expand-md navbar-dark bg-dark">
          <a class="navbar-brand" href="#">EHRS</a>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav mr-auto">
            </ul>
            <ul class="navbar-nav">
              <li class="nav-item">
                <a class="nav-link" href="#" onClick={() => this.setState({ medical: 0, assign: 1 })}>Assign Roles</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" onClick={() => this.setState({ medical: 1, assign: 0 })}>Medical Records</a>
              </li>
            </ul>
          </div>
        </nav>
        <h1>Electronic Health Record System</h1>
        {/* <a class="nav-link nav-item active" onClick={() => this.setState({ medical: 1 })}>Link</a> */}
        {
          this.state.medical ?
            <div class="medical">
              <h5> 1. Add record to IPFS </h5>
              <form id="ipfs-hash-form" className="scep-form" onSubmit={this.onIPFSSubmit}>
                <input
                  type="file"
                  onChange={this.captureFile}
                />
                 <input type="submit" value="Send" />
                {/* <button
                  type="submit" class="btn btn-primary">
                  Send it
            </button> */}
              </form>
              <br/>
              <p> The IPFS hash is: {this.state.ipfsHash}</p>

              <h5> 2. Upload file here </h5>
              <div class="form-group">
                <form id="new-notification-form" className="scep-form" onSubmit={this.handleSend}>
                  <input type="text" class="form-control" value={this.state.value} onChange={this.handleChangeAddress} placeholder="Receiver Address"></input>
                  <input type="text" class="form-control" value={this.state.value} onChange={this.handleChangeIPFS} placeholder="IPFS Hash"></input>
                  <input type="submit" class="btn btn-primary" value="Submit File" />
                </form>
              </div>

              <br />
              <h5> 3. View Record </h5>
              <div class="form-group">
                <form id="pat-notification-form" className="scep-form" onSubmit={this.handleViewRecord}>
                  <input class="form-control" type="text" value={this.state.patient} onChange={this.handleChangePatient} placeholder="Patient Address" />
                  <input class="form-control" type="submit" value="Display Record" class="btn btn-primary" />
                </form>
              </div>
              <p>{this.state.receivedText}</p>

              <br />
              <h5> 4. Share My Record </h5>
              <div class="form-group">
                <form id="my-notification-form" className="scep-form" onSubmit={this.handleShareRecord}>
                  <input type="text" class="form-control" value={this.state.ShareAddress} onChange={this.handleChangeShareAddress} placeholder="Address to share record with" />
                  <input type="submit" value="Share Record" class="btn btn-primary" />
                </form>
              </div>


              <br />
              <h5> 5. Allow Record Update </h5>
              <div class="form-group">
                <form id="upd-notification-form" className="scep-form" onSubmit={this.handleUpdateRecord}>
                  <input class="form-control" type="text" value={this.state.UpdateAddress} onChange={this.handleChangeUpdate} placeholder="Patient Address" />
                  <input type="submit" value="Allow Update" class="btn btn-primary" />
                </form>
              </div>
            </div>
            : <div>
              <form>
                <div class="form-group assign">
                  <input class="form-control" id="exampleInputPassword1" placeholder="Address">
                  </input>
                  <br />
                  <select  value={this.state.role} class="form-control" onChange={this.handleChangeRole}>
                    <option value ="doc">Doctor</option>
                    <option value="pat">Patient</option>
                  </select>
                  <br />
                </div>
                <input type="submit" class="btn btn-primary" value="Assign Role" />

              </form>

            </div>
        }
      </div>

    );
  }
}

export default App;
