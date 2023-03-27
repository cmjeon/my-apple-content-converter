const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const convert = require('heic-convert');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

const convertHEICToJPEG = async (filePath) => {
  console.log('### convertHEICToJPEG');
  const inputBuffer = await fs.readFile(filePath);
  const outputBuffer = await convert({
    buffer: inputBuffer, // the HEIC file buffer
    format: 'JPEG',      // output format
    quality: 1           // the jpeg compression quality, between 0 and 1
  });

  await fs.writeFile(`${filePath.slice(0, -5)}_c.jpeg`, outputBuffer);
};

const resize = async (filePath, outputDir) => {
  console.log('### resize:filePath', filePath);
  await sharp(`${filePath.slice(0, -5)}_c.jpeg`)
    .resize({ width: 1200 })
    .toFile(`${outputDir}/${path.basename(filePath, '.heic')}_result.jpeg`);

  console.log(`File ${filePath} resized and saved`);
};

const convertMovToMp4 = async (inputFilePath, outputDir) => {
  console.log('### convertMovToMp4');
  const outputFilePath = `${outputDir}/${path.basename(inputFilePath, '.mov')}.mp4`;

  await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .outputOptions('-c:v', 'libx264')
      .outputOptions('-preset', 'fast')
      .outputOptions('-crf', '28')
      .outputOptions('-vf', 'scale=720:-1')
      .outputOptions('-an')
      .output(outputFilePath)
      .on('end', () => {
        console.log(`File ${inputFilePath} converted to ${outputFilePath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(err);
        reject(err);
      })
      .run();
  });
};

const start = async (inputDir, outputDir) => {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const files = await fs.readdir(inputDir);

    for (const file of files) {
      const filePath = path.join(inputDir, file);

      if ((await fs.stat(filePath)).isFile() && path.extname(file).toLowerCase() === '.heic') {
        console.log('### image', filePath);
        await convertHEICToJPEG(filePath);
        await resize(filePath, outputDir);
      }

      if ((await fs.stat(filePath)).isFile() && path.extname(file).toLowerCase() === '.mov') {
        console.log('### video', filePath);
        await convertMovToMp4(filePath, outputDir);
      }
    }
  } catch (err) {
    console.error(err);
  }
};

start('./input', './output');