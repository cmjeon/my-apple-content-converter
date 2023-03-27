const ffmpeg = require('fluent-ffmpeg');

const convertMovToMp4 = (inputFilePath, outputFilePath) => {
  ffmpeg(inputFilePath)
    .outputOptions('-c:v', 'libx264')
    .outputOptions('-preset', 'fast')
    .outputOptions('-crf', '22')
    .outputOptions('-vf', 'scale=720:-1')
    .outputOptions('-an')
    .output(outputFilePath)
    .on('end', () => {
      console.log(`File ${inputFilePath} converted to ${outputFilePath}`);
    })
    .on('error', (err) => {
      console.error(err);
    })
    .run();
};

// Example usage
convertMovToMp4('input/IMG_3029.MOV', 'output/IMG_3029.mp4');
