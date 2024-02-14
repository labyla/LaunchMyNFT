import * as solanaWeb3 from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import * as Constants from "../Constants";
import * as solanaSPL_Token from "@solana/spl-token";
import * as Metaplex from "@metaplex-foundation/js";
import * as borsh from "@project-serum/borsh";
import BN from "bn.js"

const FindTotalMintsAddress = (payer: solanaWeb3.PublicKey, candyMachine: solanaWeb3.PublicKey, programId: solanaWeb3.PublicKey): solanaWeb3.PublicKey => {
    return findProgramAddressSync(
        [Buffer.from("TotalMints"), payer.toBuffer(), candyMachine.toBuffer()],
        programId
    )[0];
}

interface GetMintInstructionAccounts {
    candyMachine: solanaWeb3.PublicKey;
    payer: solanaWeb3.PublicKey;
    wallet: solanaWeb3.PublicKey;
    totalMints: solanaWeb3.PublicKey;
    mint: solanaWeb3.PublicKey;
    collectionMint: solanaWeb3.PublicKey;
    collectionMetadata: solanaWeb3.PublicKey;
    collectionMasterEdition: solanaWeb3.PublicKey;
    metadataDelegateRecord: solanaWeb3.PublicKey;
}

interface GetMintInstructionData {
    proof: Array<Array<number>>
    expect: BN
}

interface GetMintInstructionArguments {
    metaplex: Metaplex.Metaplex;
    candyMachineVersion: string;
    accounts: GetMintInstructionAccounts;
    data: GetMintInstructionData;
}

export const GetMintInstruction = (Arguments: GetMintInstructionArguments): solanaWeb3.TransactionInstruction => {
    //Get keys
    const metadata = Arguments.metaplex.nfts().pdas().metadata({mint: Arguments.accounts.mint});
    const associated = solanaSPL_Token.getAssociatedTokenAddressSync(Arguments.accounts.mint, Arguments.accounts.payer);
    const masterEdition = Arguments.metaplex.nfts().pdas().masterEdition({mint: Arguments.accounts.mint});
    const tokenRecord = Arguments.metaplex.nfts().pdas().tokenRecord({mint: Arguments.accounts.mint, token: associated});
    const Keys = [
        {pubkey: Arguments.accounts.candyMachine,            isWritable: true,  isSigner: false},
        {pubkey: Arguments.accounts.payer,                   isWritable: true,  isSigner: true},
        {pubkey: Arguments.accounts.wallet,                  isWritable: true,  isSigner: false},
        {pubkey: Constants.LaunchMyNFT_FEE_WALLET,           isWritable: true,  isSigner: false},
        {pubkey: metadata,                                   isWritable: true,  isSigner: false},
        {pubkey: Arguments.accounts.mint,                    isWritable: true,  isSigner: true},
        {pubkey: associated,                                 isWritable: true,  isSigner: false},
        {pubkey: masterEdition,                              isWritable: true,  isSigner: false},
        {pubkey: Arguments.accounts.totalMints,              isWritable: true,  isSigner: false},
        {pubkey: Constants.AssociatedTokenProgram,           isWritable: false, isSigner: false},
        {pubkey: Constants.TokenMetadataProgram,             isWritable: false, isSigner: false},
        {pubkey: Constants.TokenProgram,                     isWritable: false, isSigner: false},
        {pubkey: Constants.SystemProgram,                    isWritable: false, isSigner: false},
        {pubkey: Constants.SYSVAR_INSTRUCTIONS_PUBKEY,       isWritable: false, isSigner: false},
    ]

    if (Arguments.accounts.collectionMint != null) {
        Keys.push(
            {pubkey: Arguments.accounts.collectionMint,          isWritable: false,  isSigner: false},
            {pubkey: Arguments.accounts.collectionMetadata,      isWritable: true,   isSigner: false},
            {pubkey: Arguments.accounts.collectionMasterEdition, isWritable: false,  isSigner: false},
            {pubkey: Arguments.accounts.metadataDelegateRecord,  isWritable: false,  isSigner: false},
        )
    }

    Keys.push({pubkey: tokenRecord, isWritable: true, isSigner: false})
    //Keys.push({pubkey: new solanaWeb3.PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"), isWritable: true, isSigner: false})


    //Get data
    const layout = borsh.struct([
        borsh.vec(borsh.array(borsh.u8(), 32), "proof"),
        borsh.u64("expect")
    ])

    const identifier = (Arguments.candyMachineVersion === "V6" ? Buffer.from([111, 169, 221, 193, 234, 227, 8, 180]) : Buffer.from([96, 114, 250, 235, 203, 205, 188, 36]));
    const buffer = Buffer.alloc(1000);
    layout.encode(
        {
            proof: Arguments.data.proof,
            expect: Arguments.data.expect,
        },
        buffer
    );
    const Data = Buffer.concat([identifier, buffer]).slice(0, 8 + layout.getSpan(buffer));

    return new solanaWeb3.TransactionInstruction({
        keys: Keys,
        programId: Constants.LaunchMyNFT_PROGRAM_ID,
        data: Data
    })
}

interface GetMintCompressedInstructionAccounts {
    payer: solanaWeb3.PublicKey;
    candyMachine: solanaWeb3.PublicKey;
    nameBank: solanaWeb3.PublicKey;
    totalMints: solanaWeb3.PublicKey;
    wallet: solanaWeb3.PublicKey;
    collectionMint: solanaWeb3.PublicKey;
    collectionMetadata: solanaWeb3.PublicKey;
    collectionMasterEdition: solanaWeb3.PublicKey;
    collectionAuthorityRecord: solanaWeb3.PublicKey;
    bubblegumSigner: solanaWeb3.PublicKey;
    treeAuthority: solanaWeb3.PublicKey;
}

interface GetMintCompressedInstructionData {
    proof: Array<Array<number>>
    expect: BN,
    amount: number
}

interface GetMintCompressedInstructionArguments {
    solanaConnection: solanaWeb3.Connection;
    accounts: GetMintCompressedInstructionAccounts;
    data: GetMintCompressedInstructionData;
}

export const GetMintCompressedInstruction = async (Arguments: GetMintCompressedInstructionArguments) => {
    //Get keys
    const Keys = [
        {pubkey: Arguments.accounts.payer,                     isWritable: true,  isSigner: true},
        {pubkey: Arguments.accounts.candyMachine,              isWritable: true,  isSigner: false},
        {pubkey: Arguments.accounts.nameBank,                  isWritable: true,  isSigner: false},
        {pubkey: Arguments.accounts.totalMints,                isWritable: true,  isSigner: false},
        {pubkey: Constants.TreeDelegate,                       isWritable: false, isSigner: false},
        {pubkey: Arguments.accounts.wallet,                    isWritable: true,  isSigner: false},
        {pubkey: Constants.LaunchMyNFT_FEE_WALLET,             isWritable: true,  isSigner: false},
        {pubkey: Constants.SystemProgram,                      isWritable: false, isSigner: false},
        {pubkey: Constants.LaunchMyNFT_COMPRESSED_PROGRAM_ID,  isWritable: false, isSigner: false},
        {pubkey: Constants.LaunchMyNFT_COMPRESSED_PROGRAM_ID,  isWritable: false, isSigner: false},
        {pubkey: Constants.LaunchMyNFT_COMPRESSED_PROGRAM_ID,  isWritable: false, isSigner: false},
        {pubkey: Constants.LaunchMyNFT_COMPRESSED_PROGRAM_ID,  isWritable: false, isSigner: false},
        {pubkey: Constants.LaunchMyNFT_COMPRESSED_PROGRAM_ID,  isWritable: false, isSigner: false},
        {pubkey: Constants.SYSVAR_INSTRUCTIONS_PUBKEY,         isWritable: false, isSigner: false},
        {pubkey: Arguments.accounts.collectionMint,            isWritable: false, isSigner: false},
        {pubkey: Arguments.accounts.collectionMetadata,        isWritable: true,  isSigner: false},
        {pubkey: Arguments.accounts.collectionMasterEdition,   isWritable: false, isSigner: false},
        {pubkey: Arguments.accounts.collectionAuthorityRecord, isWritable: false, isSigner: false},
        {pubkey: Arguments.accounts.bubblegumSigner,           isWritable: false, isSigner: false},
        {pubkey: Arguments.accounts.treeAuthority,             isWritable: true,  isSigner: false},
        {pubkey: Constants.TokenProgram,                       isWritable: false, isSigner: false},
        {pubkey: Constants.TokenMetadataProgram,               isWritable: false, isSigner: false},
        {pubkey: Constants.CompressionProgram,                 isWritable: false, isSigner: false},
        {pubkey: Constants.LogWrapper,                         isWritable: false, isSigner: false},
        {pubkey: Constants.MerkleTree,                         isWritable: true,  isSigner: false},
        {pubkey: Constants.SYSVAR_SLOT_HASHES,                 isWritable: false, isSigner: false},
        {pubkey: Constants.BUBBLEGUM_PROGRAM_ID,               isWritable: false, isSigner: false},
    ]

    //Get data
    const layout = borsh.struct([
        borsh.vec(borsh.array(borsh.u8(), 32), "proof"),
        borsh.u64("expect"),
        borsh.u32("amount")
    ])

    const identifier = Buffer.from([51, 57, 225, 47, 182, 146, 137, 166]);
    const buffer = Buffer.alloc(1000);
    layout.encode(
        {
            proof: Arguments.data.proof,
            expect: Arguments.data.expect,
            amount: Arguments.data.amount
        },
        buffer
    );

    let Data = Buffer.concat([identifier, buffer]).slice(0, identifier.length + layout.getSpan(buffer));

    return new solanaWeb3.TransactionInstruction({
        keys: Keys,
        programId: Constants.LaunchMyNFT_COMPRESSED_PROGRAM_ID,
        data: Data
    })
}