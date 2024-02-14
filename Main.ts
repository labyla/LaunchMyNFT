import * as CandyMachineTools from "./Utils/CandyMachine";
import * as solanaWeb3 from "@solana/web3.js";
import * as Metaplex from "@metaplex-foundation/js";
import * as Mint from "./Instructions/Mint";
import * as Constants from "./Constants";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";

const Connection = new solanaWeb3.Connection("http://fra.rpc.urbanaio.com/"); //https://02-dallas-054-01.rpc.tatum.io
const MetaplexConnection = new Metaplex.Metaplex(Connection);


const FindTotalMintsAddress = (payer: solanaWeb3.PublicKey, candyMachine: solanaWeb3.PublicKey, programId: solanaWeb3.PublicKey): solanaWeb3.PublicKey => {
    return solanaWeb3.PublicKey.findProgramAddressSync(
        [Buffer.from("TotalMints"), payer.toBuffer(), candyMachine.toBuffer()],
        programId
    )[0];
}

const FindNameBankAddress = async (CandyMachineAddress: solanaWeb3.PublicKey) => {
    return await Connection.getParsedProgramAccounts(
        Constants.LaunchMyNFT_COMPRESSED_PROGRAM_ID,
        {
            filters: [
                {
                    memcmp: {
                        offset: 0,
                        bytes: bs58.encode(Buffer.from([232, 241, 89, 8, 189, 80, 47, 63])),
                    },
                },
                {
                    memcmp: {
                        offset: 8,
                        bytes: CandyMachineAddress.toBase58(),
                    },
                },
            ]
        }
    )
}

const CreateLookupTable = async (
    Payer: solanaWeb3.Signer,
    Accounts: Array<solanaWeb3.PublicKey>,
): Promise<[string, solanaWeb3.PublicKey]> => {
    const [LookupTableInst, LookupTableAddress] = solanaWeb3.AddressLookupTableProgram.createLookupTable({
        authority: Payer.publicKey,
        payer: Payer.publicKey,
        recentSlot: (await Connection.getSlot()) - 1,
    });

    const ExtendInstruction = solanaWeb3.AddressLookupTableProgram.extendLookupTable({
        payer: Payer.publicKey,
        authority: Payer.publicKey,
        lookupTable: LookupTableAddress,
        addresses: Accounts
    });

    const Message = new solanaWeb3.TransactionMessage({
        payerKey: Payer.publicKey,
        recentBlockhash: (await Connection.getLatestBlockhash()).blockhash,
        instructions: [LookupTableInst, ExtendInstruction]
    }).compileToV0Message();

    const Transaction = new solanaWeb3.VersionedTransaction(Message);
    Transaction.sign([Payer]);

    const Signature = await Connection.sendTransaction(Transaction)
    return [Signature, LookupTableAddress];
}

function Delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const MintTask = async (
    CandyMachineAddress: solanaWeb3.PublicKey,
    SaleFazeName: string,
    ComputeUnits: number,
    Fee: number | bigint,
    TransactionsDelay: number,
    TransactionsCount: number,
    Payer: solanaWeb3.Signer
) => {
    const CandyMachineAccountInfo = await Connection.getAccountInfo(CandyMachineAddress);
    const CandyMachine = CandyMachineTools.GetCandyMachine(CandyMachineAccountInfo.data);

    console.log(CandyMachine.Version)
    console.log(CandyMachine.Data)

    if (CandyMachine.Version != "Compressed") {
        const SaleFaze = CandyMachine.Data.data.saleFazes.find((SaleFaze) => SaleFaze.name === SaleFazeName) || null;
        if (SaleFaze === null) {
            throw new Error(`Couldn't find SaleFaze by name: ${SaleFazeName}`);
        }

        const TotalMints = FindTotalMintsAddress(Payer.publicKey, CandyMachineAddress, Constants.LaunchMyNFT_PROGRAM_ID);
        let CollectionMetadata = null, CollectionMasterEdition = null, MetadataDelegateRecord = null;
        if (CandyMachine.Data.collectionMint != null) {
            CollectionMetadata = MetaplexConnection.nfts().pdas().metadata({mint: CandyMachine.Data.collectionMint});
            CollectionMasterEdition = MetaplexConnection.nfts().pdas().masterEdition({mint: CandyMachine.Data.collectionMint});
            MetadataDelegateRecord = MetaplexConnection.nfts().pdas().metadataDelegateRecord({mint: CandyMachine.Data.collectionMint, type: "CollectionV1", updateAuthority: CandyMachine.Data.data.creators[0].address, delegate: CandyMachineAddress});
        }

        while (SaleFaze.start > ((new Date().getTime() / 1000)) - 5);

        while (TransactionsCount--) {
            try {
                const MintKeypair = solanaWeb3.Keypair.generate();

                const MintInstruction = Mint.GetMintInstruction({
                    metaplex: MetaplexConnection,
                    candyMachineVersion: CandyMachine.Version,
                    accounts: {
                        candyMachine: CandyMachineAddress,
                        payer: Payer.publicKey,
                        wallet: CandyMachine.Data.data.creators[0].address,
                        totalMints: TotalMints,
                        mint: MintKeypair.publicKey,
                        collectionMint: CandyMachine.Data.collectionMint,
                        collectionMetadata: CollectionMetadata,
                        collectionMasterEdition: CollectionMasterEdition,
                        metadataDelegateRecord: MetadataDelegateRecord
                    },
                    data: {
                        proof: [[]],
                        expect: SaleFaze.price
                    }
                })

                const Transaction = new solanaWeb3.Transaction();
                Transaction.recentBlockhash = (await Connection.getLatestBlockhash('confirmed')).blockhash;
                Transaction.add(solanaWeb3.ComputeBudgetProgram.setComputeUnitLimit({units: ComputeUnits}));
                Transaction.add(solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({microLamports: Fee}));
                Transaction.add(MintInstruction);

                const txSig = await solanaWeb3.sendAndConfirmTransaction(Connection, Transaction, [Payer, MintKeypair]);
                console.log(txSig);
            }
            catch (ErrorInfo) {
                console.log(ErrorInfo);
            }

            await Delay(TransactionsDelay);
        }
    }
    else {
        const SaleFaze = CandyMachine.Data.saleFazes.find((SaleFaze) => SaleFaze.name === SaleFazeName) || null;
        if (SaleFaze === null) {
            throw new Error(`Couldn't find SaleFaze by name: ${SaleFazeName}`);
        }

        /*const NameBankData = await FindNameBankAddress(CandyMachineAddress);
        if (NameBankData.length === 0) {
            throw new Error(`Couldn't find name_bank account for provided CandyMachine address: ${CandyMachineAddress}`);
        }*/

        const NameBank = new solanaWeb3.PublicKey("6CgajhnvL4V23sUw1jBTV7RB6cGkGCmpfXb8YRfjMGZ2");
        const TotalMints = FindTotalMintsAddress(Payer.publicKey, CandyMachineAddress, Constants.LaunchMyNFT_COMPRESSED_PROGRAM_ID);
        const CollectionMetadata = MetaplexConnection.nfts().pdas().metadata({mint: CandyMachine.Data.collectionMint});
        const CollectionMasterEdition = MetaplexConnection.nfts().pdas().masterEdition({mint: CandyMachine.Data.collectionMint});
        const CollectionAuthorityRecord = MetaplexConnection.nfts().pdas().collectionAuthorityRecord({mint: CandyMachine.Data.collectionMint, collectionAuthority: CandyMachineAddress});
        const [BubblegumSigner] = solanaWeb3.PublicKey.findProgramAddressSync([Buffer.from("collection_cpi")], Constants.BUBBLEGUM_PROGRAM_ID);
        const [TreeAuthority] = solanaWeb3.PublicKey.findProgramAddressSync([Constants.MerkleTree.toBuffer()], Constants.BUBBLEGUM_PROGRAM_ID);

        const MintInstruction = await Mint.GetMintCompressedInstruction({
            solanaConnection: Connection,
            accounts: {
                payer: Payer.publicKey,
                candyMachine: CandyMachineAddress,
                nameBank: NameBank,
                totalMints: TotalMints,
                wallet: CandyMachine.Data.creators[0].address,
                collectionMint: CandyMachine.Data.collectionMint,
                collectionMetadata: CollectionMetadata,
                collectionMasterEdition: CollectionMasterEdition,
                collectionAuthorityRecord: CollectionAuthorityRecord,
                bubblegumSigner: BubblegumSigner,
                treeAuthority: TreeAuthority,
            },
            data: {
                proof: [[]],
                expect: SaleFaze.price,
                amount: 1
            }
        })

        /*const [TransactionSignature, LookupTableAddress] = await CreateLookupTable(
            Payer,
            [
                CandyMachineAddress,
                CandyMachine.Data.creators[0].address,
                Constants.SystemProgram,
                Constants.SYSVAR_RENT,
                Constants.TreeDelegate,
                Constants.AssociatedTokenProgram,
                Constants.TokenMetadataProgram,
                Constants.TokenProgram,
                Constants.LaunchMyNFT_FEE_WALLET,
                Constants.SYSVAR_INSTRUCTIONS_PUBKEY,
                BubblegumSigner,
                Constants.MerkleTree,
                TreeAuthority,
                Constants.CompressionProgram,
                Constants.LogWrapper,
                Constants.SYSVAR_SLOT_HASHES,
                Constants.BUBBLEGUM_PROGRAM_ID,
                CandyMachine.Data.collectionMint,
                CollectionMetadata,
                CollectionMasterEdition,
                CollectionAuthorityRecord,
                NameBank
            ]
        )
        
        let LookupTableAccount = (await Connection.getAddressLookupTable(LookupTableAddress)).value;
        while (LookupTableAccount === null) {
            Delay(1000);
            LookupTableAccount = (await Connection.getAddressLookupTable(LookupTableAddress)).value;
        }
        console.log(LookupTableAddress, LookupTableAccount);*/
        const LookupTableAccount = (await Connection.getAddressLookupTable(new solanaWeb3.PublicKey("8BRUFthgsH1W9bUPeURzibC9vUmUaY1gpESC2qsDWHY9"))).value;

        while (SaleFaze.start > ((new Date().getTime() / 1000) - 5)); 

        while (TransactionsCount--) {
            try {
                const MessageV0 = new solanaWeb3.TransactionMessage({
                    payerKey: Payer.publicKey,
                    recentBlockhash: (await Connection.getLatestBlockhash()).blockhash,
                    instructions: [
                        solanaWeb3.ComputeBudgetProgram.setComputeUnitLimit({units: ComputeUnits}),
                        solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({microLamports: Fee}),
                        MintInstruction
                    ],
                }).compileToV0Message([LookupTableAccount]);
    
                const TransactionV0 = new solanaWeb3.VersionedTransaction(MessageV0);
                TransactionV0.sign([Payer]);
                
                console.log(await Connection.sendTransaction(TransactionV0));
            }
            catch (ErrorInfo) {
                console.log(ErrorInfo);
            }

            await Delay(TransactionsDelay);
        }
    }
}

(async () => {
    const CandyMachineAddress = new solanaWeb3.PublicKey("HGgs7XF8pHD4MJJDEafmmSxDqPtBFMCdbpEUr5UfcpMu");

    const startTime = Date.now();

    const Payers = [
        solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(bs58.decode("PRIVATE-KEY"))),
        solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(bs58.decode("PRIVATE-KEY"))),
        solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(bs58.decode("PRIVATE-KEY"))),
        solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(bs58.decode("PRIVATE-KEY"))),
        solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(bs58.decode("PRIVATE-KEY"))),
    ]

    const Tasks = []
    Payers.forEach((Payer) => {
        Tasks.push(MintTask(
            CandyMachineAddress,
            "Public",
            1_000_000,
            200_000,
            25,
            200,
            Payer
        ).then(() => {
            const executionTime = Date.now() - startTime;
            console.log(`Task for ${Payer.publicKey} finished in ${executionTime} ms`);
        }));
    })

    await Promise.all(Tasks);
})();