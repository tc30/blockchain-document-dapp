import React, {useEffect, useRef, useState} from "react";

import { useParams, useHistory } from "react-router-dom";

import {callLambdaFunction} from "../../Hooks/getDatabase";

import ContractPageLoading from "./ContractPages/ContractPageLoading";
import ContractPageCreator from "./ContractPages/Creator/ContractPageCreator";
import ContractSigner from "./ContractPages/Signer/ContractSigner";
import ContractPageForbidden from "./ContractPages/ContractPageForbidden";

import MultiplePartyContract from "../../Contracts/build/MultiplePartyContract";

const ContractPage = props =>
{
	let { contractUrl } = useParams();
	let history = useHistory();

	let [urlStatus, setUrlStatus] = useState(null);
	let [contractOwner, setContractOwner] = useState(null);
	let [isContractOwner, setIsContractOwner] = useState(null);
	let [isSigner, setIsSigner] = useState(null);

	let [signers, setSigners] = useState([{name: "", email: "", ethAccount: ""}]);
	let [image, setImage] = useState(null);
	let [hash, setHash] = useState(null);
	let [fileInformation, setFileInformation] = useState();

	let [contract, setContract] = useState(null);
	let [contractAddress, setContractAddress] = useState(null);

	const firstUpdate = useRef(true);

	useEffect(() =>
	{
		if(props.ethAccount)
		{
			callLambdaFunction("getURLStatus", { url: contractUrl })
			.then(r =>
			{
				console.log(r);

				if(r.data[0])
				{
					if (r.data[0].contractAddress)
					{
						setContractAddress(r.data[0].contractAddress);
						setContract(new web3.eth.Contract(MultiplePartyContract.abi, r.data[0].contractAddress));
					}

					if (r.data[0].contractHash)
					{
						setFileInformation(r.data[0].contractHash);
					}

					if(r.data[0].ipfsHash)
					{
						setHash(r.data[0].ipfsHash);
						setImage("https://ipfs.io/ipfs/" + r.data[0].ipfsHash)
					}

					if(r.data[0].signers.length > 0)
					{
						setSigners(r.data[0].signers);
					}

					setContractOwner(r.data[0].contractOwner);
					setIsContractOwner(props.ethAccount === r.data[0].contractOwner);

					let isSigner = false;

					for(let i = 0; i < r.data[0].signers.length; i++)
					{
						if(r.data[0].signers[i].ethAccount === props.ethAccount)
						{
							isSigner = true;
							setIsSigner(isSigner);
						}
					}

					if(!isSigner)
					{
						setIsSigner(isSigner);
					}

					let restored = false;

					for(let i = 0; i < r.data[0].urlStatus.length; i++)
					{
						let item = r.data[0].urlStatus[i];
						if(item.ethAccount === props.ethAccount)
						{
							restored = true;
							setUrlStatus(item.status);
						}
					}

					// Forbidden User

					if(!restored)
					{
						setUrlStatus(null);
					}
				}

				else
				{
					props.produceSnackBar("This Contract Address Does Not Exist, Redirecting...");

					setTimeout(() =>
					{
						history.push("/");
					}, 3000)
				}
			});
		}
	}, [props.ethAccount]);

	useEffect(() =>
	{
		if (!firstUpdate.current)
		{
			callLambdaFunction("updateURLAccountStatus", {url: contractUrl, urlStatus: urlStatus, ethAccount: props.ethAccount})
			.then(r => console.log(r));
		}

		else
		{
			firstUpdate.current = false;
		}

	}, [urlStatus]);

	return (
		<Layout
			contractUrl={contractUrl}
			urlStatus={urlStatus}
			setUrlStatus={setUrlStatus}
			contractOwner={contractOwner}
			isContractOwner={isContractOwner}
			setIsContractOwner={setIsContractOwner}
			isSigner={isSigner}
			setIsSigner={setIsSigner}
			signers={signers}
			setSigners={setSigners}
			image={image}
			setImage={setImage}
			hash={hash}
			setHash={setHash}
			fileInformation={fileInformation}
			setFileInformation={setFileInformation}
			contract={contract}
			setContract={setContract}
			contractAddress={contractAddress}
			setContractAddress={setContractAddress}
			{...props}
		/>
	);
};

const Layout = props =>
{
	let pageType = <ContractPageLoading {...props}/>;

	if(props.isContractOwner)
	{
		pageType = <ContractPageCreator {...props}/>;
	}

	else if (props.isContractOwner !== null)
	{
		if (props.isSigner)
		{
			pageType = <ContractSigner {...props}/>;
		}

		else
		{
			pageType = <ContractPageForbidden {...props}/>;
		}
	}

	return pageType;
};

export default ContractPage;
