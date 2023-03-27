// const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const convert = require('heic-convert');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

const convertHEICToJPEG = async (inputFilePath, outputDir) => {
  // console.log('### convertHEICToJPEG');
  const inputBuffer = await fs.readFile(inputFilePath);
  const outputBuffer = await convert({
    buffer: inputBuffer, // the HEIC file buffer
    format: 'JPEG',      // output format
    quality: 1           // the jpeg compression quality, between 0 and 1
  });

  // await fs.writeFile(`${inputFilePath.slice(0, -5)}_c.jpeg`, outputBuffer);
  const { dir, name } = path.parse(inputFilePath);

  await sharp(outputBuffer)
    .resize({ width: 1200 })
    .toFile(path.join(dir.replace("input", outputDir), `${name}.jpeg`));
// .toFile(`${outputDir}/${path.basename(inputFilePath, '.heic')}.jpeg`);

  console.log(`File ${inputFilePath} resized and saved`);
};

const convertMovToMp4 = async (inputFilePath, outputDir) => {
  // console.log('### convertMovToMp4');
  const { dir, name } = path.parse(inputFilePath);
  const outputFilePath = path.join(dir.replace("input", outputDir), `${name}.mp4`);
  // const outputFilePath = `${outputDir}/${path.basename(inputFilePath, '.mov')}.mp4`;

  await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .outputOptions('-c:v', 'libx264')
      .outputOptions('-preset', 'fast')
      .outputOptions('-crf', '28') // 높을수록 용량이 작아짐
      .outputOptions('-vf', 'scale=720:-1') // 가로 720px
      .outputOptions('-an') // 음소거
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
      const inputFilePath = path.join(inputDir, file);

      if ((await fs.stat(inputFilePath)).isFile() && path.extname(file).toLowerCase() === '.heic') {
        console.log('### image', inputFilePath);
        await convertHEICToJPEG(inputFilePath, outputDir);
        // await resize(inputFilePath, outputDir);
      }

      if ((await fs.stat(inputFilePath)).isFile() && path.extname(file).toLowerCase() === '.mov') {
        console.log('### video', inputFilePath);
        await convertMovToMp4(inputFilePath, outputDir);
      }
    }
  } catch (err) {
    console.error(err);
  }
};

start('./input', './output');