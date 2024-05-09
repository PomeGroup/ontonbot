import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { toBuffer } from "qrcode";
import sharp from "sharp";
import { shareKeyboard } from "./markups";
import fs from "fs";
import QRCode from "qrcode";


export const handleSendQRCode = async (req, res) => {
    const { url, hub, id } = req.query;

    console.log(url, hub, id);


    if (!url || typeof url !== 'string' || !id || typeof id !== 'string') {
        return res.status(400).send('URL is required');
    }

    try {
        // Generate QR code with transparent background
        const qrBuffer = await QRCode.toBuffer(url, {
            color: {
                dark: '#000000', // QR code color
                light: '#0000' // Transparent background
            },
            errorCorrectionLevel: 'H'
        });

        // Resize QR code to fit well on the base image
        const resizedQRBuffer = await sharp(qrBuffer)
            .resize(700, 700) // Adjust this value as needed
            .png() // Ensure the output is PNG to maintain transparency
            .toBuffer();

        // Determine the base layer image path
        let baseImagePath = `./img/${hub === 'Hong Kong' ? 'SEA' : hub}.png`;
        if (!fs.existsSync(baseImagePath)) {
            baseImagePath = './img/society.png';
        }

        // Read the base layer image into a buffer
        const baseImageBuffer = fs.readFileSync(baseImagePath);

        // Combine the base layer and resized QR code with the QR code in the center
        const imageToSend = await sharp(baseImageBuffer)
            .composite([{ input: resizedQRBuffer, gravity: 'center' }])
            .toBuffer();

        // Send the combined image
        await req.bot.telegram.sendPhoto(id, { source: imageToSend }, {
            caption: `🔗 Scan QR code or share the link:\n\n${url.replace("https://", "")}`,
            reply_markup: { inline_keyboard: shareKeyboard(url) }
        });

        return res.status(200).send("Success");
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};


export const handleFileSend = async (req: Request, res: Response) => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).send('User ID is required');
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // Ensure the file is correctly typed as UploadedFile (not an array of files)
    const file = req.files.file as UploadedFile; // Adjust if supporting multiple files

    try {
        // Ensure 'file.data' is used, which is a Buffer
        // @ts-expect-error fix express.d.ts
        await req.bot.telegram.sendDocument(
            id,
            { source: file.data, filename: "visitors.csv" }, // 'file.data' is the Buffer you need
            { caption: '📄 Here is your file.' }
        );

        return res.status(200).send("Success");
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};
