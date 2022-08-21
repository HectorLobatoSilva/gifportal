import * as anchor from "@project-serum/anchor";
import Logger from "@hectorlobatosilva/simple-logger";

const logger = new Logger("INFO");

const main = async () => {
    logger.info("Staring test...");
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Gifportal;

    const baseAccount = anchor.web3.Keypair.generate();
    const tx = await program.rpc.startStuffOff({
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [baseAccount],
    });
    logger.info(`Transaction signature ${tx}`);

    let account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
    );
    logger.info("GIF count", account.totalGifs.toString());
    logger.warn("Adding a gif");

    const gifLink =
        "https://64.media.tumblr.com/9f40b42c8ae4c3ac105dbbba8d2e6e52/tumblr_oz1117X2dP1tfw70go2_500.gifv";
    await program.rpc.addGif(gifLink, {
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
        },
    });

    account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    logger.info("GIF count", account.totalGifs.toString());
    logger.info("GIF List", account.gifList);
};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }
};

runMain();
